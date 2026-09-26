import type { UbicacionSeleccionada } from '@/shared/mapa/MapaTerritorio';

export interface FormularioInscripcion {
  nombre: string;
  barrio: string;
  comunidadId: number | null;
  ubicacion: UbicacionSeleccionada | null;
  foto: File | null;
  edadEstimada: string;
}

export interface ErroresInscripcion {
  nombre?: string;
  barrio?: string;
  comunidad?: string;
  ubicacion?: string;
  foto?: string;
  edad?: string;
}

const MAXIMO_FOTO_BYTES = 10 * 1024 * 1024;
const EDAD_ENTERA = /^\d{1,2}$/;

export function validarInscripcion(formulario: FormularioInscripcion): ErroresInscripcion {
  const errores: ErroresInscripcion = {};

  if (formulario.nombre.trim() === '') {
    errores.nombre = 'Escribe el nombre del animal.';
  }
  if (formulario.barrio.trim() === '') {
    errores.barrio = 'Escribe el barrio donde vive.';
  }
  if (formulario.comunidadId === null) {
    errores.comunidad = 'Elige la comunidad que lo cuida.';
  }
  if (formulario.ubicacion === null) {
    errores.ubicacion = 'Toca el mapa para marcar dónde vive.';
  } else if (formulario.ubicacion.localidad === null) {
    errores.ubicacion = 'El punto está fuera de Bogotá. Marca un lugar dentro de la ciudad.';
  }

  if (formulario.foto === null) {
    errores.foto = 'Agrega una foto del animal.';
  } else if (!formulario.foto.type.startsWith('image/')) {
    errores.foto = 'El archivo debe ser una imagen (JPG, PNG o WEBP).';
  } else if (formulario.foto.size > MAXIMO_FOTO_BYTES) {
    errores.foto = 'La foto pesa más de 10 MB. Elige una más liviana.';
  }

  const edad = formulario.edadEstimada.trim();
  if (edad !== '' && (!EDAD_ENTERA.test(edad) || Number(edad) > 30)) {
    errores.edad = 'La edad debe ser un número entero de años entre 0 y 30.';
  }

  return errores;
}
