import L from 'leaflet';
import type { EstadoVisualResultado } from '@/shared/estado-visual/estado-visual.lib';
import { glifoEstado } from '@/shared/ui/IconoEstado';

// Lienzo de 44 x 44: es el área táctil mínima, así que la huellita entera se puede tocar sin acertar al milímetro.
const LIENZO = 44;

// Almohadilla central y cuatro deditos. El color de relleno es el del estado.
const ALMOHADILLA =
  'M22 22.5c-4.6 0-9 4.2-9 8.3 0 3 2.2 4.7 4.6 4.7 1.6 0 2.6-.7 4.4-.7s2.8.7 4.4.7c2.4 0 4.6-1.7 4.6-4.7 0-4.1-4.4-8.3-9-8.3z';
const DEDOS = [
  { cx: 12.5, cy: 20, rx: 3, ry: 4.2, giro: -20 },
  { cx: 18, cy: 13.5, rx: 3.2, ry: 4.4, giro: -8 },
  { cx: 26, cy: 13.5, rx: 3.2, ry: 4.4, giro: 8 },
  { cx: 31.5, cy: 20, rx: 3, ry: 4.2, giro: 20 },
];

export function htmlMarcador(
  visual: EstadoVisualResultado,
  seleccionado = false,
  conDistintivo = true,
): string {
  const dedos = DEDOS.map(
    (d) =>
      `<ellipse cx="${d.cx}" cy="${d.cy}" rx="${d.rx}" ry="${d.ry}" transform="rotate(${d.giro} ${d.cx} ${d.cy})"/>`,
  ).join('');
  const anilloReporte = visual.indicadorReporte
    ? '<circle cx="22" cy="22" r="20.5" fill="none" stroke="#b02a37" stroke-width="2.5"/>'
    : '';
  const halo = seleccionado
    ? '<circle cx="22" cy="22" r="20.5" fill="none" stroke="#252525" stroke-width="1.6" stroke-dasharray="3 2.5"/>'
    : '';
  const aro = seleccionado
    ? '<circle class="huella-aro" cx="22" cy="22" r="16" fill="none" stroke="#e8b100" stroke-width="3"/>'
    : '';
  // Distintivo con el glifo del estado: así el estado no depende solo del color.
  const distintivo = !conDistintivo
    ? ''
    : `<circle cx="35" cy="35" r="7.5" fill="${visual.color}" stroke="#ffffff" stroke-width="2"/>` +
      `<g transform="translate(29 29) scale(0.5)">${glifoEstado(visual.icono)}</g>`;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${LIENZO}" height="${LIENZO}" viewBox="0 0 ${LIENZO} ${LIENZO}" class="huella${seleccionado ? ' huella-elegida' : ''}">` +
    `${aro}${halo}${anilloReporte}` +
    `<g fill="${visual.color}" stroke="#ffffff" stroke-width="2.4" stroke-linejoin="round" paint-order="stroke">` +
    `<path d="${ALMOHADILLA}"/>${dedos}</g>` +
    `${distintivo}` +
    '</svg>'
  );
}

export function crearIconoMarcador(visual: EstadoVisualResultado, seleccionado = false): L.DivIcon {
  return L.divIcon({
    html: htmlMarcador(visual, seleccionado),
    className: 'marcador-vbp',
    iconSize: [LIENZO, LIENZO],
    iconAnchor: [LIENZO / 2, LIENZO / 2],
    popupAnchor: [0, -LIENZO / 2],
  });
}

const VISUAL_UBICACION: EstadoVisualResultado = {
  color: '#55711f',
  colorTexto: '#55711f',
  etiqueta: 'Ubicación marcada',
  esActivo: true,
  indicadorReporte: false,
  icono: 'activo',
};

// El punto que la persona marca al inscribir: la misma huellita, sin distintivo de estado.
export function crearIconoUbicacion(): L.DivIcon {
  return L.divIcon({
    html: htmlMarcador(VISUAL_UBICACION, false, false),
    className: 'marcador-vbp',
    iconSize: [LIENZO, LIENZO],
    iconAnchor: [LIENZO / 2, LIENZO / 2],
  });
}
