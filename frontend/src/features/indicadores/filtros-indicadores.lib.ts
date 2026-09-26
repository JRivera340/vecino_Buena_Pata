import type { Animal } from '@/core/modelos/animal';
import type { Especie, EstadoAnimal } from '@/core/modelos/enums';

export type EspecieFiltro = Especie | 'TODAS';

export interface FiltrosIndicadores {
  desde: string; // AAAA-MM-DD o vacío
  hasta: string;
  estado: EstadoAnimal | 'TODOS';
  especie: EspecieFiltro;
}

export const FILTROS_INICIALES: FiltrosIndicadores = {
  desde: '',
  hasta: '',
  estado: 'TODOS',
  especie: 'TODAS',
};

// Mensaje si el rango no tiene sentido; null si está bien.
export function validarRango(filtros: FiltrosIndicadores): string | null {
  if (filtros.desde && filtros.hasta && filtros.desde > filtros.hasta) {
    return 'La fecha inicial no puede ser posterior a la final.';
  }
  return null;
}

export function parametrosIndicadores(filtros: FiltrosIndicadores): URLSearchParams {
  const parametros = new URLSearchParams();
  if (filtros.desde) {
    parametros.set('desde', filtros.desde);
  }
  if (filtros.hasta) {
    parametros.set('hasta', filtros.hasta);
  }
  if (filtros.estado !== 'TODOS') {
    parametros.set('estado', filtros.estado);
  }
  if (filtros.especie !== 'TODAS') {
    parametros.set('especie', filtros.especie);
  }
  return parametros;
}

// Las huellitas del mapa siguen los mismos filtros que los totales. La fecha se compara por día
// (en hora de Bogotá) para que coincida con el rango que ve la persona.
function diaDeBogota(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
}

export function filtrarAnimalesIndicadores(
  animales: Animal[],
  filtros: FiltrosIndicadores,
): Animal[] {
  return animales.filter((animal) => {
    if (filtros.estado !== 'TODOS' && animal.estado !== filtros.estado) {
      return false;
    }
    if (filtros.especie !== 'TODAS' && animal.especie !== filtros.especie) {
      return false;
    }
    const dia = diaDeBogota(animal.fecha_inscripcion);
    if (filtros.desde && dia < filtros.desde) {
      return false;
    }
    if (filtros.hasta && dia > filtros.hasta) {
      return false;
    }
    return true;
  });
}
