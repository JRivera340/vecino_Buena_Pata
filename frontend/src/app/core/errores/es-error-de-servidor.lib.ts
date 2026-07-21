import { HttpErrorResponse } from '@angular/common/http';

export function esErrorDeServidor(error: HttpErrorResponse): boolean {
  return error.status === 0 || error.status >= 500;
}
