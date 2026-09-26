import type { Especie, Sexo, Tamano, TipoDocumento } from '@/core/modelos/enums';
import {
  validarInscripcion,
  type ErroresInscripcion,
} from '@/features/animales/validar-inscripcion.lib';
import type { UbicacionSeleccionada } from '@/shared/mapa/MapaTerritorio';
import { validarDocumento } from './documento.lib';

export interface FormularioInscripcionPublica {
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombrePersona: string;
  telefono: string;
  correo: string;
  aceptaDatos: boolean;
  nombre: string;
  especie: Especie;
  sexo: Sexo;
  tamano: Tamano;
  edadEstimada: string;
  descripcion: string;
  barrio: string;
  comunidadId: number | null;
  ubicacion: UbicacionSeleccionada | null;
  foto: File | null;
  // Campo trampa: una persona no lo ve ni lo llena.
  sitioWeb: string;
}

export interface ErroresInscripcionPublica extends ErroresInscripcion {
  documento?: string;
  nombrePersona?: string;
  telefono?: string;
  correo?: string;
  aceptaDatos?: string;
}

const CORREO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function validarInscripcionPublica(
  f: FormularioInscripcionPublica,
): ErroresInscripcionPublica {
  const errores: ErroresInscripcionPublica = validarInscripcion({
    nombre: f.nombre,
    barrio: f.barrio,
    comunidadId: f.comunidadId,
    ubicacion: f.ubicacion,
    foto: f.foto,
    edadEstimada: f.edadEstimada,
  });

  const documento = validarDocumento(f.numeroDocumento);
  if (documento) {
    errores.documento = documento;
  }
  if (f.nombrePersona.trim() === '') {
    errores.nombrePersona = 'Escribe tu nombre completo.';
  }
  const digitosTelefono = f.telefono.replace(/[\s()+-]/g, '');
  if (!/^\d{7,15}$/.test(digitosTelefono)) {
    errores.telefono = 'Escribe un teléfono válido, solo con números.';
  }
  if (!CORREO.test(f.correo.trim())) {
    errores.correo = 'Escribe un correo válido, por ejemplo nombre@correo.com.';
  }
  if (!f.aceptaDatos) {
    errores.aceptaDatos = 'Debes aceptar el tratamiento de tus datos personales para continuar.';
  }
  return errores;
}

export function armarEnvioInscripcionPublica(f: FormularioInscripcionPublica): FormData {
  const datos = new FormData();
  datos.append('tipo_documento', f.tipoDocumento);
  datos.append('numero_documento', f.numeroDocumento.trim());
  datos.append('nombre_persona', f.nombrePersona.trim());
  datos.append('telefono', f.telefono.trim());
  datos.append('correo', f.correo.trim());
  datos.append('acepta_datos', String(f.aceptaDatos));
  datos.append('nombre', f.nombre.trim());
  datos.append('especie', f.especie);
  datos.append('sexo', f.sexo);
  datos.append('tamano', f.tamano);
  if (f.edadEstimada.trim() !== '') {
    datos.append('edad_estimada', f.edadEstimada.trim());
  }
  if (f.descripcion.trim() !== '') {
    datos.append('descripcion', f.descripcion.trim());
  }
  datos.append('barrio', f.barrio.trim());
  if (f.ubicacion) {
    datos.append('latitud', String(f.ubicacion.lat));
    datos.append('longitud', String(f.ubicacion.lng));
  }
  if (f.comunidadId !== null) {
    datos.append('comunidad_id', String(f.comunidadId));
  }
  if (f.foto) {
    datos.append('foto', f.foto);
  }
  datos.append('sitio_web', f.sitioWeb);
  return datos;
}
