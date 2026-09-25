import type { CausalSalida } from '@/core/modelos/enums';

const MENSAJE_COMPORTAMIENTO = 'Describe cómo se comporta el animal.';
const MENSAJE_PESO = 'El peso debe ser un número mayor que 0 y menor o igual a 120 kg.';
const MAXIMO_PESO_KG = 120;

function aNullSiVacio(texto: string): string | null {
  const limpio = texto.trim();
  return limpio === '' ? null : limpio;
}

export interface ResultadoValidacion<T, E> {
  datos: T | null;
  errores: E;
}

export interface FormularioVisita {
  comportamiento: string;
  peso: string;
  observaciones: string;
}

export function validarVisita(formulario: FormularioVisita): ResultadoValidacion<
  { estado_comportamiento: string; peso_kg: number | null; observaciones: string | null },
  { comportamiento?: string; peso?: string }
> {
  const errores: { comportamiento?: string; peso?: string } = {};
  const comportamiento = formulario.comportamiento.trim();
  if (comportamiento === '') {
    errores.comportamiento = MENSAJE_COMPORTAMIENTO;
  }

  let peso: number | null = null;
  const textoPeso = formulario.peso.trim().replace(',', '.');
  if (textoPeso !== '') {
    peso = Number(textoPeso);
    if (!Number.isFinite(peso) || peso <= 0 || peso > MAXIMO_PESO_KG) {
      errores.peso = MENSAJE_PESO;
    }
  }

  if (Object.keys(errores).length > 0) {
    return { datos: null, errores };
  }
  return {
    errores,
    datos: {
      estado_comportamiento: comportamiento,
      peso_kg: peso,
      observaciones: aNullSiVacio(formulario.observaciones),
    },
  };
}

export interface FormularioSalida {
  causal: CausalSalida;
  fecha: string;
  notas: string;
}

export function validarSalida(
  formulario: FormularioSalida,
  ahora: Date = new Date(),
): ResultadoValidacion<{ causal: CausalSalida; fecha: string; notas: string | null }, { fecha?: string }> {
  const fecha = new Date(`${formulario.fecha}T12:00:00`);
  if (formulario.fecha === '' || Number.isNaN(fecha.getTime())) {
    return { datos: null, errores: { fecha: 'Elige la fecha de la salida.' } };
  }
  const finDeHoy = new Date(ahora);
  finDeHoy.setHours(23, 59, 59, 999);
  if (fecha.getTime() > finDeHoy.getTime()) {
    return { datos: null, errores: { fecha: 'La fecha de la salida no puede ser posterior a hoy.' } };
  }
  return {
    errores: {},
    datos: { causal: formulario.causal, fecha: fecha.toISOString(), notas: aNullSiVacio(formulario.notas) },
  };
}

export function validarReactivacion(formulario: { comportamiento: string }): ResultadoValidacion<
  { estado_comportamiento: string },
  { comportamiento?: string }
> {
  const comportamiento = formulario.comportamiento.trim();
  if (comportamiento === '') {
    return { datos: null, errores: { comportamiento: MENSAJE_COMPORTAMIENTO } };
  }
  return { errores: {}, datos: { estado_comportamiento: comportamiento } };
}
