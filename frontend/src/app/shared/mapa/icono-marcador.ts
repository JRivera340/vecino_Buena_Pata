import * as L from 'leaflet';

import { EstadoVisualResultado } from '../estado-visual/estado-visual.lib';

export function crearIconoMarcador(visual: EstadoVisualResultado): L.DivIcon {
  const anillo = visual.indicadorReporte
    ? '<circle cx="16" cy="16" r="15" fill="none" stroke="var(--color-rojo-ladrillo)" stroke-width="2.5" />'
    : '';

  const html = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="12" fill="${visual.color}" stroke="var(--color-fondo)" stroke-width="2" />
      ${anillo}
    </svg>
  `;

  return L.divIcon({
    html,
    className: 'icono-marcador-vbp',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}
