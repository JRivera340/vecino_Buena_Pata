import type { EstadoAnimal } from '@/core/modelos/enums';

export type IconoEstado = 'revision' | 'proceso' | 'activo' | 'adoptado' | 'perdido' | 'fallecido';

export interface EstadoVisualResultado {
  color: string;
  colorTexto: string;
  etiqueta: string;
  esActivo: boolean;
  indicadorReporte: boolean;
  icono: IconoEstado;
}

const MAPA_ESTADO_VISUAL: Record<EstadoAnimal, Omit<EstadoVisualResultado, 'indicadorReporte'>> = {
  CANDIDATO: {
    color: '#0345bf',
    colorTexto: '#0345bf',
    etiqueta: 'Candidato',
    esActivo: true,
    icono: 'revision',
  },
  EN_PROCESO: {
    color: '#b45309',
    colorTexto: '#b45309',
    etiqueta: 'En proceso',
    esActivo: true,
    icono: 'proceso',
  },
  VBP_ACTIVO: {
    color: '#719d15',
    colorTexto: '#55711f',
    etiqueta: 'Vecino Buena Pata activo',
    esActivo: true,
    icono: 'activo',
  },
  ADOPTADO: {
    color: '#0f766e',
    colorTexto: '#0f766e',
    etiqueta: 'Adoptado',
    esActivo: false,
    icono: 'adoptado',
  },
  PERDIDO: {
    color: '#b02a37',
    colorTexto: '#b02a37',
    etiqueta: 'Perdido',
    esActivo: false,
    icono: 'perdido',
  },
  FALLECIDO: {
    color: '#495057',
    colorTexto: '#495057',
    etiqueta: 'Fallecido',
    esActivo: false,
    icono: 'fallecido',
  },
};

export function estadoVisual(estado: EstadoAnimal, tieneReporteAbierto = false): EstadoVisualResultado {
  return { ...MAPA_ESTADO_VISUAL[estado], indicadorReporte: tieneReporteAbierto };
}

function luminancia(hex: string): number {
  const valor = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((inicio) => {
    const canal = parseInt(valor.slice(inicio, inicio + 2), 16) / 255;
    return canal <= 0.03928 ? canal / 12.92 : Math.pow((canal + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contraste(colorA: string, colorB: string): number {
  const [claro, oscuro] = [luminancia(colorA), luminancia(colorB)].sort((a, b) => b - a);
  return (claro + 0.05) / (oscuro + 0.05);
}
