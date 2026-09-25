import { ErrorApi } from './cliente';

export function mensajeError(error: unknown, porDefecto: string): string {
  if (error instanceof ErrorApi && error.detalle) {
    return error.detalle;
  }
  return porDefecto;
}
