import L from 'leaflet';
import { describe, expect, it } from 'vitest';
import { centroDesplazado } from './movimiento';

// Un mapa de mentira con proyección lineal: 1 grado = 1000 px, y el eje vertical crece hacia el sur.
const mapaFalso = {
  project: (punto: L.LatLng) => L.point(punto.lng * 1000, -punto.lat * 1000),
  unproject: (punto: L.Point) => L.latLng(-punto.y / 1000, punto.x / 1000),
} as unknown as L.Map;

describe('centroDesplazado', () => {
  it('sin desplazamiento devuelve el mismo punto', () => {
    expect(centroDesplazado(mapaFalso, [4.6, -74.07], 15)).toEqual([4.6, -74.07]);
  });

  it('con [170, 0] el centro queda 170 px a la izquierda, así el punto se ve a la derecha del centro', () => {
    const [lat, lng] = centroDesplazado(mapaFalso, [4.6, -74.07], 15, [170, 0]);

    expect(lat).toBeCloseTo(4.6);
    expect(lng).toBeCloseTo(-74.07 - 0.17);
  });

  it('con [0, -100] el centro queda 100 px por debajo, así el punto se ve por encima del centro', () => {
    const [lat, lng] = centroDesplazado(mapaFalso, [4.6, -74.07], 15, [0, -100]);

    expect(lng).toBeCloseTo(-74.07);
    expect(lat).toBeCloseTo(4.6 - 0.1);
  });
});
