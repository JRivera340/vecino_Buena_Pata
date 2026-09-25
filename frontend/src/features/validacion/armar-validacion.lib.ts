import type { VeredictoValidacion } from '@/core/modelos/enums';
import type { ValidacionCrear } from '@/core/modelos/validacion';

export interface FormularioValidacion {
  veredicto: VeredictoValidacion;
  pendientes: string[];
  observaciones: string;
  esterilizado: boolean;
  numeroMicrochip: string;
}

export interface ErroresValidacion {
  pendientes?: string;
  numeroMicrochip?: string;
}

export interface ResultadoValidacion {
  datos: ValidacionCrear | null;
  errores: ErroresValidacion;
}

const MICROCHIP = /^\d{9,15}$/;

export function armarValidacion(formulario: FormularioValidacion): ResultadoValidacion {
  const errores: ErroresValidacion = {};
  const microchip = formulario.numeroMicrochip.trim();
  const observaciones = formulario.observaciones.trim();

  if (formulario.veredicto === 'CON_PENDIENTES' && formulario.pendientes.length === 0) {
    errores.pendientes = 'Marca al menos un pendiente o cambia el veredicto a aprobado.';
  }
  if (microchip !== '' && !MICROCHIP.test(microchip)) {
    errores.numeroMicrochip = 'El microchip debe tener entre 9 y 15 dígitos.';
  }
  if (Object.keys(errores).length > 0) {
    return { datos: null, errores };
  }

  return {
    errores,
    datos: {
      veredicto: formulario.veredicto,
      pendientes: formulario.veredicto === 'CON_PENDIENTES' ? formulario.pendientes : [],
      observaciones: observaciones === '' ? null : observaciones,
      // null deja intacto lo que ya estaba registrado; false lo sobrescribiría.
      esterilizado: formulario.esterilizado ? true : null,
      numero_microchip: microchip === '' ? null : microchip,
    },
  };
}
