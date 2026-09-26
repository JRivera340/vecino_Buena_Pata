import { vi } from 'vitest';
import { useAviso } from '@/core/avisos/aviso.store';
import { useSesion } from '@/core/sesion/sesion.store';
import { ErrorApi, solicitar } from './cliente';

const BASE = 'http://localhost:8000/api/v1';

async function capturar(promesa: Promise<unknown>): Promise<ErrorApi> {
  try {
    await promesa;
  } catch (error) {
    return error as ErrorApi;
  }
  throw new Error('La petición debía fallar');
}

function respuestaJson(cuerpo: unknown, estado = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('solicitar', () => {
  const fetchFalso = vi.fn();

  beforeEach(() => {
    fetchFalso.mockReset();
    vi.stubGlobal('fetch', fetchFalso);
    sessionStorage.clear();
    useSesion.getState().cerrar();
    useAviso.getState().limpiar();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('hace GET a la ruta indicada bajo la URL base', async () => {
    fetchFalso.mockResolvedValue(respuestaJson([{ id: 1 }]));

    const datos = await solicitar<{ id: number }[]>('/animales');

    expect(datos).toEqual([{ id: 1 }]);
    const [url, opciones] = fetchFalso.mock.calls[0];
    expect(url).toBe(`${BASE}/animales`);
    expect(opciones.method).toBe('GET');
  });

  it('no envía Authorization cuando no hay sesión', async () => {
    fetchFalso.mockResolvedValue(respuestaJson({}));

    await solicitar('/publico/mapa');

    expect(fetchFalso.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it('envía el token como Bearer cuando hay sesión', async () => {
    useSesion.getState().iniciar({ token: 'abc123', rol: 'ADMIN', nombre: 'Admin' });
    fetchFalso.mockResolvedValue(respuestaJson({}));

    await solicitar('/animales');

    expect(fetchFalso.mock.calls[0][1].headers.Authorization).toBe('Bearer abc123');
  });

  it('serializa el cuerpo como JSON', async () => {
    fetchFalso.mockResolvedValue(respuestaJson({ id: 7 }));

    await solicitar('/animales', { metodo: 'POST', cuerpo: { nombre: 'Rocky' } });

    const [, opciones] = fetchFalso.mock.calls[0];
    expect(opciones.method).toBe('POST');
    expect(opciones.headers['Content-Type']).toBe('application/json');
    expect(opciones.body).toBe(JSON.stringify({ nombre: 'Rocky' }));
  });

  it('envía un formulario tal cual, sin fijar Content-Type', async () => {
    fetchFalso.mockResolvedValue(respuestaJson({}));
    const cuerpo = new URLSearchParams({ username: 'admin', password: 'x' });

    await solicitar('/auth/login', { metodo: 'POST', cuerpo });

    const [, opciones] = fetchFalso.mock.calls[0];
    expect(opciones.body).toBe(cuerpo);
    expect(opciones.headers['Content-Type']).toBeUndefined();
  });

  it('devuelve undefined cuando la respuesta es 204', async () => {
    fetchFalso.mockResolvedValue(new Response(null, { status: 204 }));

    expect(await solicitar('/algo', { metodo: 'DELETE' })).toBeUndefined();
  });

  it('devuelve un Blob cuando se pide como blob', async () => {
    fetchFalso.mockResolvedValue(new Response('png', { status: 200 }));

    const resultado = await solicitar<Blob>('/animales/1/collar/qr.png', { como: 'blob' });

    expect(resultado).toBeInstanceOf(Blob);
  });

  it('lanza ErrorApi con el detalle que manda el servidor', async () => {
    fetchFalso.mockResolvedValue(respuestaJson({ detail: 'Ya existe.' }, 409));

    const error = await capturar(solicitar('/animales', { metodo: 'POST', cuerpo: {} }));

    expect(error).toBeInstanceOf(ErrorApi);
    expect(error.estado).toBe(409);
    expect(error.detalle).toBe('Ya existe.');
    expect(useAviso.getState().mensaje).toBeNull();
  });

  it('toma el primer mensaje cuando el detalle es una lista de validaciones', async () => {
    fetchFalso.mockResolvedValue(respuestaJson({ detail: [{ msg: 'Campo obligatorio' }] }, 422));

    const error = await capturar(solicitar('/animales', { metodo: 'POST', cuerpo: {} }));

    expect(error.detalle).toBe('Campo obligatorio');
  });

  it('muestra el aviso global y lanza ErrorApi en errores 5xx', async () => {
    fetchFalso.mockResolvedValue(respuestaJson({ detail: 'Falló' }, 503));

    const error = await capturar(solicitar('/animales'));

    expect(error.estado).toBe(503);
    expect(useAviso.getState().mensaje).toMatch(/servidor/i);
  });

  it('muestra el aviso global y lanza ErrorApi con estado 0 si no hay red', async () => {
    fetchFalso.mockRejectedValue(new TypeError('Failed to fetch'));

    const error = await capturar(solicitar('/animales'));

    expect(error).toBeInstanceOf(ErrorApi);
    expect(error.estado).toBe(0);
    expect(useAviso.getState().mensaje).toMatch(/servidor/i);
  });

  it('cierra la sesión cuando el servidor responde 401 a una petición con token', async () => {
    useSesion.getState().iniciar({ token: 'vencido', rol: 'ADMIN', nombre: 'Admin' });
    fetchFalso.mockResolvedValue(respuestaJson({ detail: 'Credenciales invalidas' }, 401));

    await solicitar('/animales').catch(() => undefined);

    expect(useSesion.getState().sesion).toBeNull();
  });

  it('no toca la sesión cuando un 401 llega sin token (login fallido)', async () => {
    fetchFalso.mockResolvedValue(
      respuestaJson({ detail: 'Usuario o contrasena incorrectos' }, 401),
    );

    const error = await capturar(
      solicitar('/auth/login', { metodo: 'POST', cuerpo: new URLSearchParams() }),
    );

    expect(error.estado).toBe(401);
    expect(useAviso.getState().mensaje).toBeNull();
  });
});
