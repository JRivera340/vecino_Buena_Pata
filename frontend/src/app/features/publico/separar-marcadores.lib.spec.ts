import { RADIO_SEPARACION_GRADOS, separarMarcadores } from './separar-marcadores.lib';

describe('separarMarcadores', () => {
  it('devuelve una lista vacia si no hay puntos', () => {
    expect(separarMarcadores([])).toEqual([]);
  });

  it('no modifica los puntos que estan solos', () => {
    const puntos = [
      { id: 1, lat: 4.6095, lng: -74.0805 },
      { id: 2, lat: 4.6125, lng: -74.0805 },
    ];
    expect(separarMarcadores(puntos)).toEqual(puntos);
  });

  it('reparte dos puntos coincidentes en lados opuestos del centro', () => {
    const resultado = separarMarcadores([
      { id: 1, lat: 4.6095, lng: -74.0805 },
      { id: 2, lat: 4.6095, lng: -74.0805 },
    ]);

    expect(resultado[0].lat).toBeCloseTo(4.6095, 6);
    expect(resultado[0].lng).toBeCloseTo(-74.0805 + RADIO_SEPARACION_GRADOS, 6);
    expect(resultado[1].lat).toBeCloseTo(4.6095, 6);
    expect(resultado[1].lng).toBeCloseTo(-74.0805 - RADIO_SEPARACION_GRADOS, 6);
  });

  it('deja todos los puntos de un grupo a la misma distancia del centro y sin superponerse', () => {
    const centro = { lat: 4.6095, lng: -74.0805 };
    const resultado = separarMarcadores([
      { id: 1, ...centro },
      { id: 2, ...centro },
      { id: 3, ...centro },
      { id: 4, ...centro },
    ]);

    for (const punto of resultado) {
      const distancia = Math.hypot(punto.lat - centro.lat, punto.lng - centro.lng);
      expect(distancia).toBeCloseTo(RADIO_SEPARACION_GRADOS, 6);
    }
    const posiciones = new Set(resultado.map((p) => `${p.lat.toFixed(7)}|${p.lng.toFixed(7)}`));
    expect(posiciones.size).toBe(4);
  });

  it('da la misma posicion a cada id sin importar el orden de entrada', () => {
    const centro = { lat: 4.6095, lng: -74.0805 };
    const directo = separarMarcadores([
      { id: 1, ...centro },
      { id: 2, ...centro },
      { id: 3, ...centro },
    ]);
    const invertido = separarMarcadores([
      { id: 3, ...centro },
      { id: 2, ...centro },
      { id: 1, ...centro },
    ]);

    for (const id of [1, 2, 3]) {
      const a = directo.find((p) => p.id === id)!;
      const b = invertido.find((p) => p.id === id)!;
      expect(a.lat).toBeCloseTo(b.lat, 9);
      expect(a.lng).toBeCloseTo(b.lng, 9);
    }
  });

  it('conserva el orden de entrada y los demas campos', () => {
    const resultado = separarMarcadores([
      { id: 9, lat: 1, lng: 1, etiqueta: 'A' },
      { id: 3, lat: 2, lng: 2, etiqueta: 'B' },
    ]);
    expect(resultado.map((p) => p.id)).toEqual([9, 3]);
    expect(resultado.map((p) => p.etiqueta)).toEqual(['A', 'B']);
  });

  it('solo separa los grupos coincidentes y deja los demas intactos', () => {
    const resultado = separarMarcadores([
      { id: 1, lat: 4.6095, lng: -74.0805 },
      { id: 2, lat: 4.6095, lng: -74.0805 },
      { id: 3, lat: 4.6125, lng: -74.0805 },
    ]);
    expect(resultado[2]).toEqual({ id: 3, lat: 4.6125, lng: -74.0805 });
  });
});
