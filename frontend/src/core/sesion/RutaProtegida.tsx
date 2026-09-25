import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { RolUsuario } from '@/core/modelos/enums';
import { useSesion } from './sesion.store';

interface RutaProtegidaProps {
  roles?: RolUsuario[];
  children?: ReactNode;
}

export function RutaProtegida({ roles, children }: RutaProtegidaProps) {
  const sesion = useSesion((estado) => estado.sesion);
  const ubicacion = useLocation();

  if (!sesion) {
    return <Navigate to="/ingreso" replace state={{ desde: ubicacion.pathname }} />;
  }
  if (roles && !roles.includes(sesion.rol)) {
    return <Navigate to="/mapa" replace />;
  }
  return children ? <>{children}</> : <Outlet />;
}
