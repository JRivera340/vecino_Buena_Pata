import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';
import { RolUsuario } from '../models/enums';

export function crearGuardDeRol(...roles: RolUsuario[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const sesion = auth.sesionActual();

    if (!sesion) {
      router.navigate(['/ingreso']);
      return false;
    }
    if (!roles.includes(sesion.rol as RolUsuario)) {
      router.navigate(['/mapa']);
      return false;
    }
    return true;
  };
}
