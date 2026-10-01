import { listarNotificaciones } from '@/core/api/notificaciones-internas';
import { useCarga } from '@/core/api/useCarga';
import { useSesion } from '@/core/sesion/sesion.store';

export function useContadorNotificaciones(): number {
  const token = useSesion((estado) => estado.sesion?.token);
  const notificaciones = useCarga(
    () => (token ? listarNotificaciones() : Promise.resolve([])),
    [token],
  );
  return (notificaciones.datos ?? []).filter((notificacion) => notificacion.leida_en === null).length;
}
