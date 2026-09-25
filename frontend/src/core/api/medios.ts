import { solicitar } from './cliente';

export interface MediaSubidaRespuesta {
  ruta: string;
}

export function subirArchivo(archivo: File): Promise<MediaSubidaRespuesta> {
  const formulario = new FormData();
  formulario.append('archivo', archivo);
  return solicitar<MediaSubidaRespuesta>('/media', { metodo: 'POST', cuerpo: formulario });
}
