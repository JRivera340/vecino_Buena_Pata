import { entorno } from '@/core/entorno';

export function resolverUrlMedia(ruta: string | null): string | null {
  if (!ruta) {
    return null;
  }
  return `${entorno.mediaBaseUrl}/${ruta}`;
}
