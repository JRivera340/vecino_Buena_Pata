export const RADIO_SEPARACION_GRADOS = 0.0006;

export interface PuntoSeparable {
  id: number;
  lat: number;
  lng: number;
}

export function separarMarcadores<T extends PuntoSeparable>(puntos: T[]): T[] {
  const grupos = new Map<string, T[]>();
  for (const punto of puntos) {
    const clave = `${punto.lat}|${punto.lng}`;
    const grupo = grupos.get(clave);
    if (grupo) {
      grupo.push(punto);
    } else {
      grupos.set(clave, [punto]);
    }
  }

  const resultadoPorId = new Map<number, T>();
  for (const grupo of grupos.values()) {
    if (grupo.length === 1) {
      resultadoPorId.set(grupo[0].id, grupo[0]);
      continue;
    }
    const ordenado = [...grupo].sort((a, b) => a.id - b.id);
    ordenado.forEach((punto, posicion) => {
      const angulo = (2 * Math.PI * posicion) / ordenado.length;
      resultadoPorId.set(punto.id, {
        ...punto,
        lat: punto.lat + RADIO_SEPARACION_GRADOS * Math.sin(angulo),
        lng: punto.lng + RADIO_SEPARACION_GRADOS * Math.cos(angulo),
      });
    });
  }

  return puntos.map((punto) => resultadoPorId.get(punto.id) as T);
}
