import type { EstadoVisualResultado } from '@/shared/estado-visual/estado-visual.lib';

export type EstadoSeguimiento = 'AL_DIA' | 'PROXIMO' | 'VENCIDO' | 'EN_CAMINO';

const MAPA: Record<EstadoSeguimiento, Omit<EstadoVisualResultado, 'indicadorReporte'>> = {
  AL_DIA: { color: '#719d15', colorTexto: '#55711f', etiqueta: 'Al día', esActivo: true, icono: 'activo' },
  PROXIMO: { color: '#b45309', colorTexto: '#b45309', etiqueta: 'Próximo a vencer', esActivo: true, icono: 'proceso' },
  VENCIDO: { color: '#b02a37', colorTexto: '#b02a37', etiqueta: 'Vencido', esActivo: true, icono: 'perdido' },
  EN_CAMINO: { color: '#0345bf', colorTexto: '#0345bf', etiqueta: 'En camino', esActivo: true, icono: 'revision' },
};

export function seguimientoVisual(estado: EstadoSeguimiento): Omit<EstadoVisualResultado, 'indicadorReporte'> {
  return MAPA[estado];
}
