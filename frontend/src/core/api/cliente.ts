import { useAviso } from '@/core/avisos/aviso.store';
import { entorno } from '@/core/entorno';
import { useSesion } from '@/core/sesion/sesion.store';
import { esErrorDeServidor } from './es-error-de-servidor.lib';

const TIEMPO_MAXIMO_MS = 30_000;
const MENSAJE_SERVIDOR = 'No pudimos conectar con el servidor. Inténtalo de nuevo en un momento.';

export class ErrorApi extends Error {
  readonly estado: number;
  readonly detalle: string | null;

  constructor(estado: number, detalle: string | null) {
    super(detalle ?? `Error ${estado}`);
    this.name = 'ErrorApi';
    this.estado = estado;
    this.detalle = detalle;
  }
}

type Cuerpo = URLSearchParams | FormData | Record<string, unknown> | unknown[] | null;

interface Opciones {
  metodo?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  cuerpo?: Cuerpo;
  como?: 'json' | 'blob';
}

function extraerDetalle(datos: unknown): string | null {
  if (!datos || typeof datos !== 'object' || !('detail' in datos)) {
    return null;
  }
  const detalle = (datos as { detail: unknown }).detail;
  if (typeof detalle === 'string') {
    return detalle;
  }
  if (Array.isArray(detalle) && detalle.length > 0) {
    return (detalle[0] as { msg?: string })?.msg ?? null;
  }
  return null;
}

export async function solicitar<T>(ruta: string, opciones: Opciones = {}): Promise<T> {
  const { metodo = 'GET', cuerpo = null, como = 'json' } = opciones;
  const cabeceras: Record<string, string> = {};

  const token = useSesion.getState().sesion?.token;
  if (token) {
    cabeceras.Authorization = `Bearer ${token}`;
  }

  let body: BodyInit | undefined;
  if (cuerpo instanceof URLSearchParams || cuerpo instanceof FormData) {
    body = cuerpo;
  } else if (cuerpo !== null) {
    cabeceras['Content-Type'] = 'application/json';
    body = JSON.stringify(cuerpo);
  }

  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), TIEMPO_MAXIMO_MS);

  let respuesta: Response;
  try {
    respuesta = await fetch(`${entorno.apiBaseUrl}${ruta}`, {
      method: metodo,
      headers: cabeceras,
      body,
      signal: control.signal,
    });
  } catch {
    useAviso.getState().mostrar(MENSAJE_SERVIDOR);
    throw new ErrorApi(0, null);
  } finally {
    clearTimeout(temporizador);
  }

  if (!respuesta.ok) {
    let detalle: string | null = null;
    try {
      detalle = extraerDetalle(await respuesta.json());
    } catch {
      // La respuesta de error no traía cuerpo JSON.
    }
    if (esErrorDeServidor(respuesta.status)) {
      useAviso.getState().mostrar(MENSAJE_SERVIDOR);
    }
    if (respuesta.status === 401 && token) {
      useSesion.getState().cerrar();
    }
    throw new ErrorApi(respuesta.status, detalle);
  }

  if (respuesta.status === 204) {
    return undefined as T;
  }
  return (como === 'blob' ? await respuesta.blob() : await respuesta.json()) as T;
}
