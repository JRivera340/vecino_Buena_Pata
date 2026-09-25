import type { Atencion, AtencionCrear, Reporte } from '@/core/modelos/reporte';
import { solicitar } from './cliente';

export const listarReportes = () => solicitar<Reporte[]>('/reportes');

export const registrarAtencion = (reporteId: number, datos: AtencionCrear) =>
  solicitar<Atencion>(`/reportes/${reporteId}/atencion`, { metodo: 'POST', cuerpo: { ...datos } });
