import L from 'leaflet';
import type { CajaGeografica } from './localidades.lib';
import type { VistaMapa } from './pila-de-vistas.lib';

export function prefiereMenosMovimiento(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  );
}

// Con "reducir movimiento" el mapa salta directo, sin animar el vuelo.
export function volarALimites(mapa: L.Map, caja: CajaGeografica, margen = 24): void {
  const limites = L.latLngBounds(caja.surOeste, caja.norEste);
  if (prefiereMenosMovimiento()) {
    mapa.fitBounds(limites, { padding: [margen, margen], animate: false });
  } else {
    mapa.flyToBounds(limites, { padding: [margen, margen], duration: 0.8 });
  }
}

// `desplazamiento` corre el punto respecto al centro del mapa, en píxeles: sirve para que el animal
// elegido quede a la vista y no debajo del panel de detalle. Con [170, 0] el punto queda 170 px a la
// derecha del centro; con [0, -100], 100 px por encima.
export function centroDesplazado(
  mapa: L.Map,
  punto: [number, number],
  zoom: number,
  desplazamiento: [number, number] = [0, 0],
): [number, number] {
  if (desplazamiento[0] === 0 && desplazamiento[1] === 0) {
    return punto;
  }
  const enPixeles = mapa.project(L.latLng(punto), zoom).subtract(L.point(desplazamiento));
  const centro = mapa.unproject(enPixeles, zoom);
  return [centro.lat, centro.lng];
}

export function volarAPunto(
  mapa: L.Map,
  punto: [number, number],
  zoom: number,
  desplazamiento: [number, number] = [0, 0],
): void {
  const centro = centroDesplazado(mapa, punto, zoom, desplazamiento);
  if (prefiereMenosMovimiento()) {
    mapa.setView(centro, zoom, { animate: false });
  } else {
    mapa.flyTo(centro, zoom, { duration: 0.9 });
  }
}

export function volarAVista(mapa: L.Map, vista: VistaMapa): void {
  volarAPunto(mapa, vista.centro, vista.zoom);
}

export function vistaActual(mapa: L.Map): VistaMapa {
  const centro = mapa.getCenter();
  return { centro: [centro.lat, centro.lng], zoom: mapa.getZoom() };
}
