import { EstadoAnimal } from '../../core/models/enums';

export interface EstadoVisualResultado {
  color: string;
  etiqueta: string;
  esActivo: boolean;
  indicadorReporte: boolean;
}

const MAPA_ESTADO_VISUAL: Record<EstadoAnimal, Omit<EstadoVisualResultado, 'indicadorReporte'>> = {
  CANDIDATO: { color: 'var(--color-ambar)', etiqueta: 'Candidato', esActivo: true },
  EN_PROCESO: { color: 'var(--color-ambar-oscuro)', etiqueta: 'En proceso', esActivo: true },
  VBP_ACTIVO: { color: 'var(--color-secundario)', etiqueta: 'Vecino Buena Pata activo', esActivo: true },
  ADOPTADO: { color: 'var(--color-neutro-600)', etiqueta: 'Adoptado', esActivo: false },
  PERDIDO: { color: 'var(--color-neutro-600)', etiqueta: 'Perdido', esActivo: false },
  FALLECIDO: { color: 'var(--color-neutro-600)', etiqueta: 'Fallecido', esActivo: false },
};

export function estadoVisual(estado: EstadoAnimal, tieneReporteAbierto = false): EstadoVisualResultado {
  return { ...MAPA_ESTADO_VISUAL[estado], indicadorReporte: tieneReporteAbierto };
}
