import { etiquetaCausal, etiquetaPendiente, etiquetaSaludMinuscula } from '@/core/formato.lib';

export interface EventoDescrito {
  titulo: string;
  detalle: string | null;
}

const TITULOS: Record<string, string> = {
  INSCRIPCION: 'Inscripción',
  VALIDACION: 'Validación veterinaria',
  FORMALIZACION: 'Formalización',
  VISITA_SEGUIMIENTO: 'Visita de seguimiento',
  SALIDA: 'Salida del programa',
  REACTIVACION: 'Reactivación',
  ATENCION_ESPECIAL: 'Atención a un reporte',
};

function texto(valor: unknown): string | null {
  return typeof valor === 'string' && valor !== '' ? valor : null;
}

function detalleDe(tipo: string, detalle: Record<string, unknown>): string | null {
  switch (tipo) {
    case 'INSCRIPCION': {
      const barrio = texto(detalle.barrio);
      return barrio ? `Barrio ${barrio}.` : null;
    }
    case 'VALIDACION': {
      const veredicto = texto(detalle.veredicto);
      if (veredicto === 'APROBADO') {
        return 'Aprobada.';
      }
      if (veredicto === 'CON_PENDIENTES') {
        const pendientes = Array.isArray(detalle.pendientes)
          ? (detalle.pendientes as string[])
          : [];
        return pendientes.length > 0
          ? `Con pendientes: ${pendientes.map(etiquetaPendiente).join(', ')}.`
          : 'Con pendientes.';
      }
      return null;
    }
    case 'FORMALIZACION': {
      const codigo = texto(detalle.codigo_collar);
      return codigo ? `Collar ${codigo}.` : null;
    }
    case 'VISITA_SEGUIMIENTO': {
      const salud = texto(detalle.estado_salud);
      return salud ? `Salud ${etiquetaSaludMinuscula(salud)}.` : null;
    }
    case 'SALIDA': {
      const causal = texto(detalle.causal);
      return causal ? `Motivo: ${etiquetaCausal(causal)}.` : null;
    }
    default:
      return null;
  }
}

export function describirEvento(tipo: string, detalle: Record<string, unknown>): EventoDescrito {
  return { titulo: TITULOS[tipo] ?? tipo, detalle: detalleDe(tipo, detalle) };
}
