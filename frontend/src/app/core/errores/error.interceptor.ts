import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { ErrorGlobalService } from './error-global.service';
import { esErrorDeServidor } from './es-error-de-servidor.lib';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorGlobal = inject(ErrorGlobalService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (esErrorDeServidor(error)) {
        errorGlobal.mostrar('No se pudo conectar con el servidor. Intenta de nuevo.');
      }
      return throwError(() => error);
    }),
  );
};
