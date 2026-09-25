import { Especie } from '@/core/modelos/enums';
import { AnimalMapaPublico } from '@/core/modelos/publico';

export interface CriteriosFiltroMapaPublico {
  busqueda: string;
  especie: Especie | 'TODAS';
  barrio: string | 'TODOS';
}

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function filtrarMapaPublico(
  animales: AnimalMapaPublico[],
  criterios: CriteriosFiltroMapaPublico,
): AnimalMapaPublico[] {
  const texto = normalizar(criterios.busqueda);

  return animales.filter((animal) => {
    if (texto && !normalizar(animal.nombre).includes(texto)) {
      return false;
    }
    if (criterios.especie !== 'TODAS' && animal.especie !== criterios.especie) {
      return false;
    }
    if (criterios.barrio !== 'TODOS' && animal.barrio !== criterios.barrio) {
      return false;
    }
    return true;
  });
}
