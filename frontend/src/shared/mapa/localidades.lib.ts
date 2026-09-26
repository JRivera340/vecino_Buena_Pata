import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson';

export interface PropiedadesLocalidad {
  codigo: string;
  nombre: string;
}

export type LocalidadFeature = Feature<Polygon | MultiPolygon, PropiedadesLocalidad>;
export type ColeccionLocalidades = FeatureCollection<Polygon | MultiPolygon, PropiedadesLocalidad>;

// Anillo de GeoJSON: [longitud, latitud].
type Anillo = number[][];

export const LOCALIDAD_DE_LA_ALCALDIA = 'Santa Fe';

function dentroDelAnillo(lng: number, lat: number, anillo: Anillo): boolean {
  let dentro = false;
  let anterior = anillo[anillo.length - 1];
  for (const actual of anillo) {
    const [x1, y1] = anterior;
    const [x2, y2] = actual;
    if (y1 > lat !== y2 > lat) {
      const corte = ((x2 - x1) * (lat - y1)) / (y2 - y1) + x1;
      if (lng < corte) {
        dentro = !dentro;
      }
    }
    anterior = actual;
  }
  return dentro;
}

function poligonosDe(feature: LocalidadFeature): Anillo[][] {
  const { geometry } = feature;
  return geometry.type === 'MultiPolygon' ? geometry.coordinates : [geometry.coordinates];
}

function dentroDelPoligono(lng: number, lat: number, anillos: Anillo[]): boolean {
  const [exterior, ...huecos] = anillos;
  return (
    dentroDelAnillo(lng, lat, exterior) && !huecos.some((hueco) => dentroDelAnillo(lng, lat, hueco))
  );
}

// Solo es una guía visual mientras la persona marca el punto: la localidad oficial la calcula el servidor
// con el archivo de precisión completa.
export function localidadDePunto(
  lat: number,
  lng: number,
  coleccion: ColeccionLocalidades,
): string | null {
  for (const feature of coleccion.features) {
    if (poligonosDe(feature).some((poligono) => dentroDelPoligono(lng, lat, poligono))) {
      return feature.properties.nombre;
    }
  }
  return null;
}

export interface CajaGeografica {
  surOeste: [number, number];
  norEste: [number, number];
}

// Caja envolvente en [lat, lng], lista para `fitBounds`.
export function cajaDe(feature: LocalidadFeature): CajaGeografica {
  let minLat = Infinity;
  let minLng = Infinity;
  let maxLat = -Infinity;
  let maxLng = -Infinity;
  for (const poligono of poligonosDe(feature)) {
    for (const [lng, lat] of poligono[0]) {
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    }
  }
  return { surOeste: [minLat, minLng], norEste: [maxLat, maxLng] };
}

export function cajaDeTodas(coleccion: ColeccionLocalidades): CajaGeografica {
  const cajas = coleccion.features.map(cajaDe);
  return {
    surOeste: [
      Math.min(...cajas.map((c) => c.surOeste[0])),
      Math.min(...cajas.map((c) => c.surOeste[1])),
    ],
    norEste: [
      Math.max(...cajas.map((c) => c.norEste[0])),
      Math.max(...cajas.map((c) => c.norEste[1])),
    ],
  };
}

export function nombresOrdenados(coleccion: ColeccionLocalidades): string[] {
  return coleccion.features
    .map((f) => f.properties.nombre)
    .sort((a, b) => a.localeCompare(b, 'es'));
}

export function buscarLocalidad(
  coleccion: ColeccionLocalidades,
  nombre: string,
): LocalidadFeature | undefined {
  return coleccion.features.find((f) => f.properties.nombre === nombre);
}

// "Santa Fe" -> "santa-fe", "Ciudad Bolívar" -> "ciudad-bolivar": sirve para guardar la selección en la URL.
export function slugDeLocalidad(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function localidadDeSlug(
  coleccion: ColeccionLocalidades,
  slug: string | null,
): string | null {
  if (!slug) {
    return null;
  }
  return (
    coleccion.features.find((f) => slugDeLocalidad(f.properties.nombre) === slug)?.properties
      .nombre ?? null
  );
}

export function filtrarNombres(nombres: string[], busqueda: string): string[] {
  const texto = slugDeLocalidad(busqueda).replace(/-/g, '');
  if (texto === '') {
    return nombres;
  }
  return nombres.filter((nombre) => slugDeLocalidad(nombre).replace(/-/g, '').includes(texto));
}
