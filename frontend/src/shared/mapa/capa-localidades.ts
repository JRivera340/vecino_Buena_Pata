import L from 'leaflet';
import { estiloLocalidad } from './estilo-localidad.lib';
import {
  LOCALIDAD_DE_LA_ALCALDIA,
  type ColeccionLocalidades,
  type LocalidadFeature,
} from './localidades.lib';

const PANEL_LOCALIDADES = 'localidades';
const PANEL_ETIQUETAS = 'etiquetas-localidades';

export interface OpcionesCapaLocalidades {
  // Si es falso, las localidades no reciben clics ni cursor: así el mapa de inscripción puede marcar puntos encima.
  interactiva: boolean;
  alHacerClic: (nombre: string) => void;
  // Texto del cartel que sigue al cursor. Por defecto, solo el nombre.
  textoCartel?: (nombre: string) => string;
  // Color propio de relleno por localidad (mapa coroplético).
  colorRelleno?: (nombre: string) => string | null;
}

export interface CapaLocalidades {
  seleccionar: (nombre: string | null) => void;
  actualizarZoom: (zoom: number) => void;
  refrescar: () => void;
  quitar: () => void;
}

function crearPanel(mapa: L.Map, nombre: string, zIndex: number): void {
  if (!mapa.getPane(nombre)) {
    const panel = mapa.createPane(nombre);
    panel.style.zIndex = String(zIndex);
  }
}

// Las localidades van por debajo de las huellitas (panel 600) y por encima de los mosaicos (200).
export function crearCapaLocalidades(
  mapa: L.Map,
  coleccion: ColeccionLocalidades,
  opciones: OpcionesCapaLocalidades,
): CapaLocalidades {
  crearPanel(mapa, PANEL_LOCALIDADES, 350);
  crearPanel(mapa, PANEL_ETIQUETAS, 450);

  let seleccionada: string | null = null;
  let zoom = mapa.getZoom();
  let enHover: string | null = null;
  const capas = new Map<string, L.Path>();

  const aplicarEstilo = (nombre: string) => {
    capas.get(nombre)?.setStyle(
      estiloLocalidad({
        nombre,
        seleccionada,
        enHover: enHover === nombre,
        zoom,
        colorRelleno: opciones.colorRelleno?.(nombre) ?? null,
      }),
    );
  };
  const aplicarTodos = () => capas.forEach((_, nombre) => aplicarEstilo(nombre));

  const renderizador = L.canvas({ pane: PANEL_LOCALIDADES, padding: 0.5 });
  const opcionesGeo: L.GeoJSONOptions & L.PathOptions = {
    pane: PANEL_LOCALIDADES,
    renderer: renderizador,
    interactive: opciones.interactiva,
    style: (feature) => {
      const nombre = (feature as LocalidadFeature).properties.nombre;
      return estiloLocalidad({
        nombre,
        seleccionada,
        enHover: false,
        zoom,
        colorRelleno: opciones.colorRelleno?.(nombre) ?? null,
      });
    },
    onEachFeature: (feature, capa) => {
      const nombre = (feature as LocalidadFeature).properties.nombre;
      capas.set(nombre, capa as L.Path);
      if (!opciones.interactiva) {
        return;
      }
      capa.bindTooltip(opciones.textoCartel?.(nombre) ?? nombre, {
        sticky: true,
        direction: 'top',
        className: 'cartel-localidad',
        opacity: 1,
      });
      capa.on({
        mouseover: () => {
          enHover = nombre;
          aplicarEstilo(nombre);
          // Al estar en el canvas, la capa queda encima de las vecinas para que se vea su borde completo.
          (capa as L.Path).bringToFront();
        },
        mouseout: () => {
          enHover = null;
          aplicarEstilo(nombre);
        },
        click: (evento: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(evento);
          opciones.alHacerClic(nombre);
        },
      });
    },
  };
  const geojson = L.geoJSON(coleccion, opcionesGeo).addTo(mapa);

  // El nombre de Santa Fe se ve siempre: es la localidad de la Alcaldía.
  const etiquetas = L.layerGroup().addTo(mapa);
  const feature = coleccion.features.find((f) => f.properties.nombre === LOCALIDAD_DE_LA_ALCALDIA);
  if (feature) {
    const centro = L.geoJSON(feature).getBounds().getCenter();
    L.marker(centro, {
      pane: PANEL_ETIQUETAS,
      interactive: false,
      keyboard: false,
      icon: L.divIcon({
        className: 'etiqueta-localidad',
        html: `<span>${LOCALIDAD_DE_LA_ALCALDIA}</span>`,
        iconSize: [110, 22],
        iconAnchor: [55, 11],
      }),
    }).addTo(etiquetas);
  }

  return {
    seleccionar: (nombre) => {
      seleccionada = nombre;
      aplicarTodos();
      if (nombre) {
        capas.get(nombre)?.bringToFront();
      }
    },
    actualizarZoom: (nuevoZoom) => {
      zoom = nuevoZoom;
      aplicarTodos();
    },
    refrescar: aplicarTodos,
    quitar: () => {
      geojson.remove();
      etiquetas.remove();
      capas.clear();
    },
  };
}
