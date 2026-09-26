import { LOCALIDAD_DE_LA_ALCALDIA } from './localidades.lib';

export const VERDE_BORDE = '#55711f';
export const VERDE_RELLENO = '#719d15';
export const TINTA = '#252525';
// Amarillo miel: ningún estado de animal usa este color, así la localidad elegida nunca se confunde con una huellita.
export const MIEL = '#e8b100';

export interface EstiloLocalidad {
  color: string;
  weight: number;
  opacity: number;
  fillColor: string;
  fillOpacity: number;
}

export interface EntradaEstilo {
  nombre: string;
  seleccionada: string | null;
  enHover: boolean;
  zoom: number;
  // Con un color propio (mapa coroplético) el relleno ya no es el verde tenue de reposo.
  colorRelleno?: string | null;
}

// El relleno baja con el zoom para no tapar las calles: 10 % con zoom 12 o menos y 3 % con zoom 15 o más.
export function opacidadRelleno(zoom: number): number {
  if (zoom <= 12) {
    return 0.1;
  }
  if (zoom >= 15) {
    return 0.03;
  }
  return 0.1 - ((zoom - 12) / 3) * 0.07;
}

// La localidad elegida también se aclara al acercarse: 30 % con zoom 13 o menos y 10 % con zoom 16 o más,
// para que se sigan leyendo las calles cuando ya se está marcando un punto.
export function opacidadSeleccion(zoom: number): number {
  if (zoom <= 13) {
    return 0.3;
  }
  if (zoom >= 16) {
    return 0.1;
  }
  return 0.3 - ((zoom - 13) / 3) * 0.2;
}

export function estiloLocalidad({
  nombre,
  seleccionada,
  enHover,
  zoom,
  colorRelleno,
}: EntradaEstilo): EstiloLocalidad {
  const esLaElegida = seleccionada === nombre;
  const hayElegida = seleccionada !== null;
  const grosorBase = nombre === LOCALIDAD_DE_LA_ALCALDIA ? 2.2 : 1.5;

  if (esLaElegida) {
    return {
      color: TINTA,
      weight: 3,
      opacity: 1,
      fillColor: MIEL,
      fillOpacity: opacidadSeleccion(zoom),
    };
  }
  if (colorRelleno) {
    return {
      color: VERDE_BORDE,
      weight: enHover ? 3 : grosorBase,
      opacity: hayElegida ? 0.35 : 0.7,
      fillColor: colorRelleno,
      fillOpacity: hayElegida ? 0.45 : enHover ? 0.85 : 0.72,
    };
  }
  if (hayElegida) {
    return {
      color: VERDE_BORDE,
      weight: enHover ? 3 : grosorBase,
      opacity: enHover ? 0.7 : 0.35,
      fillColor: VERDE_RELLENO,
      fillOpacity: enHover ? 0.12 : 0,
    };
  }
  return {
    color: VERDE_BORDE,
    weight: enHover ? 3 : grosorBase,
    opacity: enHover ? 0.95 : 0.6,
    fillColor: VERDE_RELLENO,
    fillOpacity: enHover ? 0.24 : opacidadRelleno(zoom),
  };
}
