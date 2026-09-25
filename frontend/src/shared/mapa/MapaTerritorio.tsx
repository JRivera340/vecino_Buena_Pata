import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import type { EstadoVisualResultado } from '@/shared/estado-visual/estado-visual.lib';
import { crearIconoMarcador } from './icono-marcador';

export interface MarcadorMapa {
  id: number;
  lat: number;
  lng: number;
  visual: EstadoVisualResultado;
  etiqueta: string;
}

export interface UbicacionSeleccionada {
  lat: number;
  lng: number;
}

interface MapaTerritorioProps {
  marcadores?: MarcadorMapa[];
  centro?: [number, number];
  zoom?: number;
  altura?: string;
  seleccionable?: boolean;
  seleccionadoId?: number | null;
  ajustarAMarcadores?: boolean;
  descripcion?: string;
  alHacerClicEnMarcador?: (id: number) => void;
  alSeleccionarUbicacion?: (ubicacion: UbicacionSeleccionada) => void;
}

const CENTRO_POR_DEFECTO: [number, number] = [4.6097, -74.0817];

const ICONO_SELECCION = L.divIcon({
  html:
    '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">' +
    '<circle cx="14" cy="14" r="10" fill="#55711f" stroke="#ffffff" stroke-width="2.5"/></svg>',
  className: 'marcador-vbp',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export function MapaTerritorio({
  marcadores = [],
  centro = CENTRO_POR_DEFECTO,
  zoom = 13,
  altura = '100%',
  seleccionable = false,
  seleccionadoId = null,
  ajustarAMarcadores = false,
  descripcion = 'Mapa de animales del territorio',
  alHacerClicEnMarcador,
  alSeleccionarUbicacion,
}: MapaTerritorioProps) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const capa = useRef<L.LayerGroup | null>(null);
  const temporal = useRef<L.Marker | null>(null);
  const ultimaClave = useRef('');
  const alClic = useRef(alHacerClicEnMarcador);
  const alUbicar = useRef(alSeleccionarUbicacion);

  useEffect(() => {
    alClic.current = alHacerClicEnMarcador;
    alUbicar.current = alSeleccionarUbicacion;
  }, [alHacerClicEnMarcador, alSeleccionarUbicacion]);

  useEffect(() => {
    if (!contenedor.current) {
      return undefined;
    }
    const instancia = L.map(contenedor.current).setView(centro, zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(instancia);
    capa.current = L.layerGroup().addTo(instancia);
    mapa.current = instancia;

    if (seleccionable) {
      instancia.on('click', (evento: L.LeafletMouseEvent) => {
        temporal.current?.remove();
        temporal.current = L.marker(evento.latlng, { icon: ICONO_SELECCION }).addTo(instancia);
        alUbicar.current?.({ lat: evento.latlng.lat, lng: evento.latlng.lng });
      });
    }

    const observador = new ResizeObserver(() => instancia.invalidateSize());
    observador.observe(contenedor.current);

    return () => {
      observador.disconnect();
      instancia.remove();
      mapa.current = null;
      capa.current = null;
      temporal.current = null;
      ultimaClave.current = '';
    };
    // El mapa se crea una vez; centro y zoom solo fijan la vista inicial.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seleccionable]);

  useEffect(() => {
    const grupo = capa.current;
    const instancia = mapa.current;
    if (!grupo || !instancia) {
      return;
    }
    grupo.clearLayers();

    for (const marcador of marcadores) {
      const elegido = marcador.id === seleccionadoId;
      const contenido = document.createElement('span');
      contenido.textContent = marcador.etiqueta;
      const punto = L.marker([marcador.lat, marcador.lng], {
        icon: crearIconoMarcador(marcador.visual, elegido),
        title: marcador.etiqueta,
        alt: marcador.etiqueta,
        keyboard: true,
        zIndexOffset: elegido ? 1000 : 0,
      }).bindPopup(contenido);
      punto.on('click', () => alClic.current?.(marcador.id));
      grupo.addLayer(punto);
    }

    const clave = marcadores.map((marcador) => marcador.id).join(',');
    if (ajustarAMarcadores && marcadores.length > 0 && clave !== ultimaClave.current) {
      instancia.fitBounds(
        L.latLngBounds(marcadores.map((marcador) => [marcador.lat, marcador.lng] as [number, number])),
        { padding: [48, 48], maxZoom: 16 },
      );
    }
    ultimaClave.current = clave;
  }, [marcadores, seleccionadoId, ajustarAMarcadores]);

  return (
    <div
      ref={contenedor}
      role="region"
      aria-label={descripcion}
      style={{ height: altura }}
      className="z-0 min-h-[300px] w-full"
    />
  );
}
