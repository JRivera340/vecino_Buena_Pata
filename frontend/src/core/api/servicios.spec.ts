import { vi } from 'vitest';
import { useSesion } from '@/core/sesion/sesion.store';
import { crearAnimal, listarAnimales } from './animales';
import { iniciarSesion } from './autenticacion';
import { descargarQr, formalizarAnimal } from './formalizacion';
import { subirArchivo } from './medios';
import {
  crearReportePublico,
  listarMapa,
  obtenerAnimalPorCodigo,
  obtenerHojaVida,
} from './publico';
import { listarReportes, registrarAtencion } from './reportes';
import { crearVisita, reactivarAnimal, registrarSalida } from './seguimiento';
import { crearValidacion } from './validaciones';

const BASE = 'http://localhost:8000/api/v1';

function respuesta(cuerpo: unknown = {}): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('servicios de la API', () => {
  const fetchFalso = vi.fn();

  function ultimaLlamada() {
    const [url, opciones] = fetchFalso.mock.calls.at(-1) ?? [];
    return { url: url as string, metodo: opciones.method as string, cuerpo: opciones.body };
  }

  beforeEach(() => {
    fetchFalso.mockReset();
    fetchFalso.mockImplementation(async () => respuesta([]));
    vi.stubGlobal('fetch', fetchFalso);
    sessionStorage.clear();
    useSesion.getState().cerrar();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('iniciarSesion envía el formulario a /auth/login y guarda la sesión', async () => {
    fetchFalso.mockResolvedValue(
      respuesta({
        access_token: 'tk',
        token_type: 'bearer',
        rol: 'VETERINARIO',
        nombre: 'Dr. Rojas',
      }),
    );

    await iniciarSesion('dr.rojas', 'clave');

    const llamada = ultimaLlamada();
    expect(llamada.url).toBe(`${BASE}/auth/login`);
    expect(llamada.metodo).toBe('POST');
    expect((llamada.cuerpo as URLSearchParams).get('username')).toBe('dr.rojas');
    expect(useSesion.getState().sesion?.token).toBe('tk');
    expect(useSesion.getState().sesion?.rol).toBe('VETERINARIO');
  });

  it('lista y crea animales', async () => {
    await listarAnimales();
    expect(ultimaLlamada()).toMatchObject({ url: `${BASE}/animales`, metodo: 'GET' });

    await crearAnimal({
      nombre: 'Rocky',
      especie: 'PERRO',
      sexo: 'MACHO',
      tamano: 'MEDIANO',
      edad_estimada: null,
      descripcion: null,
      foto_principal: null,
      barrio: 'Bosa',
      latitud: 4.6,
      longitud: -74.1,
      comunidad_id: 1,
    });
    expect(ultimaLlamada()).toMatchObject({ url: `${BASE}/animales`, metodo: 'POST' });
  });

  it('formaliza con POST y descarga el QR como imagen', async () => {
    await formalizarAnimal(4);
    expect(ultimaLlamada()).toMatchObject({
      url: `${BASE}/animales/4/formalizacion`,
      metodo: 'POST',
    });

    fetchFalso.mockResolvedValue(new Response('png', { status: 200 }));
    await descargarQr(4);
    expect(ultimaLlamada().url).toBe(`${BASE}/animales/4/collar/qr.png`);
  });

  it('sube un archivo por multipart con el campo archivo', async () => {
    fetchFalso.mockResolvedValue(respuesta({ ruta: 'a.jpg' }));

    const resultado = await subirArchivo(new File(['x'], 'a.jpg', { type: 'image/jpeg' }));

    expect(resultado.ruta).toBe('a.jpg');
    const llamada = ultimaLlamada();
    expect(llamada.url).toBe(`${BASE}/media`);
    expect((llamada.cuerpo as FormData).get('archivo')).toBeInstanceOf(File);
  });

  it('consulta el mapa, la hoja de vida y la ficha del QR', async () => {
    await listarMapa();
    expect(ultimaLlamada().url).toBe(`${BASE}/publico/mapa`);

    await obtenerHojaVida(7);
    expect(ultimaLlamada().url).toBe(`${BASE}/publico/animales/7/hoja-vida`);

    await obtenerAnimalPorCodigo('vbp-abc');
    expect(ultimaLlamada().url).toBe(`${BASE}/publico/animales/vbp-abc`);
  });

  it('codifica el código del collar antes de ponerlo en la ruta', async () => {
    await obtenerAnimalPorCodigo('a/b c');
    expect(ultimaLlamada().url).toBe(`${BASE}/publico/animales/a%2Fb%20c`);
  });

  it('envía un reporte público al código del collar', async () => {
    await crearReportePublico('vbp-abc', {
      reportante_nombre: 'Vecina',
      descripcion: 'No come',
      foto: null,
      latitud: null,
      longitud: null,
    });
    expect(ultimaLlamada()).toMatchObject({
      url: `${BASE}/publico/animales/vbp-abc/reportes`,
      metodo: 'POST',
    });
  });

  it('lista reportes y registra una atención', async () => {
    await listarReportes();
    expect(ultimaLlamada().url).toBe(`${BASE}/reportes`);

    await registrarAtencion(3, { acciones_realizadas: 'Visita', resultado: 'Resuelto' });
    expect(ultimaLlamada()).toMatchObject({ url: `${BASE}/reportes/3/atencion`, metodo: 'POST' });
  });

  it('registra visita, salida y reactivación con POST', async () => {
    await crearVisita(1, {
      estado_salud: 'BUENO',
      estado_comportamiento: 'Tranquilo',
      peso_kg: null,
      foto: null,
      observaciones: null,
    });
    expect(ultimaLlamada().url).toBe(`${BASE}/animales/1/visitas`);

    await registrarSalida(1, { causal: 'PERDIDA', fecha: '2026-09-25', notas: null });
    expect(ultimaLlamada().url).toBe(`${BASE}/animales/1/salida`);

    await reactivarAnimal(1, { estado_salud: 'BUENO', estado_comportamiento: 'Tranquilo' });
    expect(ultimaLlamada().url).toBe(`${BASE}/animales/1/reactivacion`);
  });

  it('registra una validación con POST', async () => {
    await crearValidacion(2, {
      veredicto: 'APROBADO',
      pendientes: [],
      observaciones: null,
      esterilizado: true,
      numero_microchip: null,
    });
    expect(ultimaLlamada()).toMatchObject({
      url: `${BASE}/animales/2/validaciones`,
      metodo: 'POST',
    });
  });
});
