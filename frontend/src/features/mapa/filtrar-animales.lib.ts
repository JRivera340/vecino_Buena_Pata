import { Animal } from '@/core/modelos/animal';
import { EstadoAnimal } from '@/core/modelos/enums';

const ESTADOS_VISIBLES_POR_DEFECTO: EstadoAnimal[] = ['CANDIDATO', 'EN_PROCESO', 'VBP_ACTIVO'];

export interface CriteriosFiltroAnimales {
  busqueda: string;
  estado: EstadoAnimal | 'TODOS';
  barrio: string | 'TODOS';
  comunidadId: number | 'TODOS';
  mostrarSalidos: boolean;
}

export function filtrarAnimales(animales: Animal[], criterios: CriteriosFiltroAnimales): Animal[] {
  const texto = criterios.busqueda.trim().toLowerCase();

  return animales.filter((animal) => {
    if (!criterios.mostrarSalidos && !ESTADOS_VISIBLES_POR_DEFECTO.includes(animal.estado)) {
      return false;
    }
    if (texto && !animal.nombre.toLowerCase().includes(texto)) {
      return false;
    }
    if (criterios.estado !== 'TODOS' && animal.estado !== criterios.estado) {
      return false;
    }
    if (criterios.barrio !== 'TODOS' && animal.barrio !== criterios.barrio) {
      return false;
    }
    if (criterios.comunidadId !== 'TODOS' && animal.comunidad_id !== criterios.comunidadId) {
      return false;
    }
    return true;
  });
}
