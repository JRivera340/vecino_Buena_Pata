import type { NotificacionInterna } from '@/core/modelos/notificacion-interna';
import { solicitar } from './cliente';

export const listarNotificaciones = () => solicitar<NotificacionInterna[]>('/notificaciones');
export const marcarLeida = (id: number) => solicitar<NotificacionInterna>(`/notificaciones/${id}/leer`, { metodo: 'POST' });
