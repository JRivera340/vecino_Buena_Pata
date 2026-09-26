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

export function volarAPunto(mapa: L.Map, centro: [number, number], zoom: number): void {
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
