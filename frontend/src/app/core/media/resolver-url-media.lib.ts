import { environment } from '../../../environments/environment';

export function resolverUrlMedia(ruta: string | null): string | null {
  if (!ruta) {
    return null;
  }
  return `${environment.mediaBaseUrl}/${ruta}`;
}
