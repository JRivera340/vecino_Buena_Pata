import type { Atencion, AtencionCrear, Reporte } from '@/core/modelos/reporte';
import { solicitar } from './cliente';

interface ReportesPagina {
  total: number;
  items: Reporte[];
}

interface FiltrosReportes {
  limit: number;
  offset: number;
  desde?: string;
  hasta?: string;
  estado?: string;
}

export const listarReportes = (filtros: FiltrosReportes) => {
  const parametros = new URLSearchParams({ limit: String(filtros.limit), offset: String(filtros.offset) });
  if (filtros.desde) parametros.set('desde', filtros.desde);
  if (filtros.hasta) parametros.set('hasta', filtros.hasta);
  if (filtros.estado) parametros.set('estado', filtros.estado);
  return solicitar<ReportesPagina>(`/reportes?${parametros.toString()}`);
};

export const registrarAtencion = (reporteId: number, datos: AtencionCrear) =>
  solicitar<Atencion>(`/reportes/${reporteId}/atencion`, { metodo: 'POST', cuerpo: { ...datos } });
