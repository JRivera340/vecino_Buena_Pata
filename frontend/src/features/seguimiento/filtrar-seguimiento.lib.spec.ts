import { describe, expect, it } from 'vitest';
import { filtrarSeguimiento } from './filtrar-seguimiento.lib';
import type { AnimalSeguimiento } from '@/core/modelos/seguimiento-estado';

const ANIMALES: AnimalSeguimiento[] = [
  { id: 1, nombre: 'Rocky', barrio: 'X', comunidad_id: 1, latitud: 4, longitud: -74, estado_seguimiento: 'VENCIDO', visita_en_camino_por: null, proxima_visita_vence: '2026-01-01' },
  { id: 2, nombre: 'Canela', barrio: 'Y', comunidad_id: 2, latitud: 4, longitud: -74, estado_seguimiento: 'AL_DIA', visita_en_camino_por: null, proxima_visita_vence: '2026-06-01' },
];

describe('filtrarSeguimiento', () => {
  it('filtra por nombre', () => {
    expect(filtrarSeguimiento(ANIMALES, { busqueda: 'roc', comunidadId: 'TODAS', liderId: 'TODOS' })).toHaveLength(1);
  });
  it('filtra por comunidad', () => {
    expect(filtrarSeguimiento(ANIMALES, { busqueda: '', comunidadId: 2, liderId: 'TODOS' })).toHaveLength(1);
  });
});
