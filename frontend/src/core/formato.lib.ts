const FORMATO_FECHA = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'America/Bogota',
});

const FORMATO_PESO = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 });

export function formatearFecha(iso: string): string {
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime()) ? '' : FORMATO_FECHA.format(fecha);
}

export function formatearPeso(kilos: number | null): string | null {
  return kilos === null ? null : `${FORMATO_PESO.format(kilos)} kg`;
}

export function formatearEdad(anos: number | null): string {
  if (anos === null) {
    return 'Sin dato';
  }
  if (anos === 0) {
    return 'Menos de un año';
  }
  return anos === 1 ? '1 año' : `${anos} años`;
}

const ESPECIES: Record<string, string> = { PERRO: 'Perro', GATO: 'Gato' };
const SEXOS: Record<string, string> = { MACHO: 'Macho', HEMBRA: 'Hembra' };
const TAMANOS: Record<string, string> = {
  PEQUENO: 'Pequeño',
  MEDIANO: 'Mediano',
  GRANDE: 'Grande',
};

export const etiquetaEspecie = (valor: string): string => ESPECIES[valor] ?? valor;
export const etiquetaSexo = (valor: string): string => SEXOS[valor] ?? valor;
export const etiquetaTamano = (valor: string): string => TAMANOS[valor] ?? valor;

const CAUSALES: Record<string, string> = {
  ADOPCION: 'adopción',
  PERDIDA: 'pérdida',
  FALLECIMIENTO: 'fallecimiento',
};
const PENDIENTES: Record<string, string> = {
  SIN_CHIP: 'sin microchip',
  SIN_ESTERILIZAR: 'sin esterilizar',
  COMPORTAMIENTO: 'comportamiento',
  SALUD: 'salud',
};
const SALUD: Record<string, string> = { BUENO: 'bueno', REGULAR: 'regular', MALO: 'malo' };

export const etiquetaCausal = (valor: string): string => CAUSALES[valor] ?? valor;
export const etiquetaPendiente = (valor: string): string => PENDIENTES[valor] ?? valor;
export const etiquetaSaludMinuscula = (valor: string): string => SALUD[valor] ?? valor;
