import L from 'leaflet';
import type { EstadoVisualResultado } from '@/shared/estado-visual/estado-visual.lib';
import { glifoEstado } from '@/shared/ui/IconoEstado';

export function htmlMarcador(visual: EstadoVisualResultado, seleccionado = false): string {
  const tamano = seleccionado ? 46 : 36;
  const anillo = visual.indicadorReporte
    ? '<circle cx="18" cy="18" r="17" fill="none" stroke="#b02a37" stroke-width="2.5"/>'
    : '';
  const halo = seleccionado
    ? '<circle cx="18" cy="18" r="16.5" fill="none" stroke="#252525" stroke-width="1.5" stroke-dasharray="3 2.5"/>'
    : '';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${tamano}" height="${tamano}" viewBox="0 0 36 36">` +
    `${halo}${anillo}` +
    `<circle cx="18" cy="18" r="13.5" fill="${visual.color}" stroke="#ffffff" stroke-width="2.5"/>` +
    `<g transform="translate(6 6)">${glifoEstado(visual.icono)}</g>` +
    '</svg>'
  );
}

export function crearIconoMarcador(visual: EstadoVisualResultado, seleccionado = false): L.DivIcon {
  const tamano = seleccionado ? 46 : 36;
  return L.divIcon({
    html: htmlMarcador(visual, seleccionado),
    className: 'marcador-vbp',
    iconSize: [tamano, tamano],
    iconAnchor: [tamano / 2, tamano / 2],
    popupAnchor: [0, -tamano / 2],
  });
}
