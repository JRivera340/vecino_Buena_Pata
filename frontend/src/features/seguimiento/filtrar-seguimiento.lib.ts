import type { AnimalSeguimiento } from '@/core/modelos/seguimiento-estado';

export interface FiltrosSeguimiento {
  busqueda: string;
  comunidadId: number | 'TODAS';
  liderId: number | 'TODOS';
}

export function filtrarSeguimiento(animales: AnimalSeguimiento[], filtros: FiltrosSeguimiento): AnimalSeguimiento[] {
  const busqueda = filtros.busqueda.trim().toLowerCase();
  return animales.filter((animal) => {
    if (busqueda && !animal.nombre.toLowerCase().includes(busqueda)) return false;
    if (filtros.comunidadId !== 'TODAS' && animal.comunidad_id !== filtros.comunidadId) return false;
    return true;
  });
}
