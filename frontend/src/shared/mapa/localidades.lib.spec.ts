import { describe, expect, it } from 'vitest';
import coleccionReal from '@/geo/localidades.geojson?raw';
import {
  buscarLocalidad,
  cajaDe,
  cajaDeTodas,
  filtrarNombres,
  localidadDePunto,
  localidadDeSlug,
  nombresOrdenados,
  slugDeLocalidad,
  type ColeccionLocalidades,
} from './localidades.lib';

const real = JSON.parse(coleccionReal) as ColeccionLocalidades;

function cuadrado(x0: number, y0: number, x1: number, y1: number) {
  return [
    [x0, y0],
    [x1, y0],
    [x1, y1],
    [x0, y1],
    [x0, y0],
  ];
}

const sintetica: ColeccionLocalidades = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { codigo: '98', nombre: 'Con hueco' },
      geometry: { type: 'Polygon', coordinates: [cuadrado(0, 0, 10, 10), cuadrado(4, 4, 6, 6)] },
    },
    {
      type: 'Feature',
      properties: { codigo: '99', nombre: 'Dos partes' },
      geometry: {
        type: 'MultiPolygon',
        coordinates: [[cuadrado(20, 20, 21, 21)], [cuadrado(25, 25, 26, 26)]],
      },
    },
  ],
};

describe('localidadDePunto', () => {
  it('reconoce un punto dentro, uno dentro de un hueco y uno fuera', () => {
    expect(localidadDePunto(2, 2, sintetica)).toBe('Con hueco');
    expect(localidadDePunto(5, 5, sintetica)).toBeNull();
    expect(localidadDePunto(50, 50, sintetica)).toBeNull();
  });

  it('reconoce cualquiera de las partes de un multipolígono', () => {
    expect(localidadDePunto(20.5, 20.5, sintetica)).toBe('Dos partes');
    expect(localidadDePunto(25.5, 25.5, sintetica)).toBe('Dos partes');
    expect(localidadDePunto(23, 23, sintetica)).toBeNull();
  });

  it('acierta con las localidades reales de Bogotá', () => {
    expect(localidadDePunto(4.6021, -74.0691, real)).toBe('Santa Fe');
    expect(localidadDePunto(4.5981, -74.0758, real)).toBe('La Candelaria');
    expect(localidadDePunto(4.676, -74.048, real)).toBe('Chapinero');
    expect(localidadDePunto(6.2442, -75.5812, real)).toBeNull();
  });
});

describe('cajas', () => {
  it('calcula la caja de una localidad en lat, lng', () => {
    expect(cajaDe(sintetica.features[0])).toEqual({ surOeste: [0, 0], norEste: [10, 10] });
  });

  it('abarca todas las localidades', () => {
    expect(cajaDeTodas(sintetica)).toEqual({ surOeste: [0, 0], norEste: [26, 26] });
  });
});

describe('nombres', () => {
  it('trae las 20 localidades ordenadas alfabéticamente', () => {
    const nombres = nombresOrdenados(real);

    expect(nombres).toHaveLength(20);
    expect(nombres[0]).toBe('Antonio Nariño');
    expect(nombres).toContain('Santa Fe');
  });

  it('busca por nombre', () => {
    expect(buscarLocalidad(real, 'Santa Fe')?.properties.codigo).toBe('03');
    expect(buscarLocalidad(real, 'Medellín')).toBeUndefined();
  });

  it('convierte a slug sin tildes y vuelve al nombre', () => {
    expect(slugDeLocalidad('Ciudad Bolívar')).toBe('ciudad-bolivar');
    expect(slugDeLocalidad('Santa Fe')).toBe('santa-fe');
    expect(localidadDeSlug(real, 'ciudad-bolivar')).toBe('Ciudad Bolívar');
    expect(localidadDeSlug(real, 'no-existe')).toBeNull();
    expect(localidadDeSlug(real, null)).toBeNull();
  });

  it('filtra por lo que se escribe, sin importar tildes ni mayúsculas', () => {
    const nombres = nombresOrdenados(real);

    expect(filtrarNombres(nombres, 'bolivar')).toEqual(['Ciudad Bolívar']);
    expect(filtrarNombres(nombres, 'SANTA')).toEqual(['Santa Fe']);
    expect(filtrarNombres(nombres, '')).toHaveLength(20);
    expect(filtrarNombres(nombres, 'zzz')).toEqual([]);
  });
});
