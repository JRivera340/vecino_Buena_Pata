import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Maximize2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { EstadoVisualResultado } from '@/shared/estado-visual/estado-visual.lib';
import { cx } from '@/shared/ui/clases';
import { crearCapaLocalidades, type CapaLocalidades } from './capa-localidades';
import { cargarLocalidades } from './cargar-localidades';
import { ControlLocalidades } from './ControlLocalidades';
import { crearIconoMarcador } from './icono-marcador';
import {
  buscarLocalidad,
  cajaDe,
  cajaDeTodas,
  localidadDePunto,
  nombresOrdenados,
  type ColeccionLocalidades,
} from './localidades.lib';
import { vistaActual, volarALimites, volarAPunto, volarAVista } from './movimiento';
import { PilaDeVistas } from './pila-de-vistas.lib';

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
  // Localidad donde cayó el punto: null si está fuera de Bogotá, undefined si las localidades aún no cargan.
  localidad?: string | null;
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
  mostrarLocalidades?: boolean;
  // Si se pasa, la localidad elegida la controla quien usa el mapa; si no, el mapa la recuerda solo.
  localidadSeleccionada?: string | null;
  alSeleccionarLocalidad?: (nombre: string | null) => void;
  textoCartelLocalidad?: (nombre: string) => string;
  colorLocalidad?: (nombre: string) => string | null;
  alHacerClicEnMarcador?: (id: number) => void;
  alSeleccionarUbicacion?: (ubicacion: UbicacionSeleccionada) => void;
}

const CENTRO_POR_DEFECTO: [number, number] = [4.6097, -74.0817];
const ZOOM_AL_MARCAR = 16;

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
  mostrarLocalidades = true,
  localidadSeleccionada,
  alSeleccionarLocalidad,
  textoCartelLocalidad,
  colorLocalidad,
  alHacerClicEnMarcador,
  alSeleccionarUbicacion,
}: MapaTerritorioProps) {
  const envoltura = useRef<HTMLDivElement>(null);
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const capaMarcadores = useRef<L.LayerGroup | null>(null);
  const capaLocalidades = useRef<CapaLocalidades | null>(null);
  const temporal = useRef<L.Marker | null>(null);
  const ultimaClave = useRef('');
  const pila = useRef(new PilaDeVistas());
  const alClic = useRef(alHacerClicEnMarcador);
  const alUbicar = useRef(alSeleccionarUbicacion);
  const alElegirLocalidad = useRef(alSeleccionarLocalidad);
  const textoCartel = useRef(textoCartelLocalidad);
  const colorPorLocalidad = useRef(colorLocalidad);

  const [coleccion, setColeccion] = useState<ColeccionLocalidades | null>(null);
  const [verLocalidades, setVerLocalidades] = useState(mostrarLocalidades);
  const [interna, setInterna] = useState<string | null>(null);
  const elegida = localidadSeleccionada !== undefined ? localidadSeleccionada : interna;
  const elegidaRef = useRef<string | null>(elegida);
  const coleccionRef = useRef<ColeccionLocalidades | null>(null);
  // Cuando la elección viene de marcar un punto, el mapa ya vuela al punto y no debe volar a la localidad.
  const omitirVuelo = useRef(false);
  const elegidaVolada = useRef<string | null>(null);

  useEffect(() => {
    alClic.current = alHacerClicEnMarcador;
    alUbicar.current = alSeleccionarUbicacion;
    alElegirLocalidad.current = alSeleccionarLocalidad;
    textoCartel.current = textoCartelLocalidad;
    colorPorLocalidad.current = colorLocalidad;
    elegidaRef.current = elegida;
  }, [
    alHacerClicEnMarcador,
    alSeleccionarUbicacion,
    alSeleccionarLocalidad,
    textoCartelLocalidad,
    colorLocalidad,
    elegida,
  ]);

  const elegirLocalidad = useCallback((nombre: string | null) => {
    setInterna(nombre);
    alElegirLocalidad.current?.(nombre);
  }, []);

  useEffect(() => {
    if (!contenedor.current) {
      return undefined;
    }
    const historial = pila.current;
    const instancia = L.map(contenedor.current).setView(centro, zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(instancia);
    capaMarcadores.current = L.layerGroup().addTo(instancia);
    mapa.current = instancia;

    instancia.on('zoomend', () => capaLocalidades.current?.actualizarZoom(instancia.getZoom()));

    instancia.on('click', (evento: L.LeafletMouseEvent) => {
      if (!seleccionable) {
        // Un clic en un espacio vacío suelta la localidad elegida.
        if (elegidaRef.current !== null) {
          elegirLocalidad(null);
        }
        return;
      }
      const localidad = coleccionRef.current
        ? localidadDePunto(evento.latlng.lat, evento.latlng.lng, coleccionRef.current)
        : undefined;
      temporal.current?.remove();
      temporal.current = L.marker(evento.latlng, { icon: ICONO_SELECCION }).addTo(instancia);
      const nueva = localidad ?? null;
      if (nueva !== elegidaRef.current) {
        omitirVuelo.current = true;
      }
      elegirLocalidad(nueva);
      volarAPunto(
        instancia,
        [evento.latlng.lat, evento.latlng.lng],
        Math.max(instancia.getZoom(), ZOOM_AL_MARCAR),
      );
      alUbicar.current?.({ lat: evento.latlng.lat, lng: evento.latlng.lng, localidad });
    });

    const observador = new ResizeObserver(() => instancia.invalidateSize());
    observador.observe(contenedor.current);

    return () => {
      observador.disconnect();
      capaLocalidades.current?.quitar();
      capaLocalidades.current = null;
      instancia.remove();
      mapa.current = null;
      capaMarcadores.current = null;
      temporal.current = null;
      ultimaClave.current = '';
      historial.limpiar();
    };
    // El mapa se crea una vez; centro y zoom solo fijan la vista inicial.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seleccionable]);

  useEffect(() => {
    if (!mostrarLocalidades) {
      return undefined;
    }
    let activo = true;
    cargarLocalidades()
      .then((datos) => {
        if (activo) {
          coleccionRef.current = datos;
          setColeccion(datos);
        }
      })
      .catch(() => {
        // Sin el archivo el mapa funciona igual, solo sin la capa de localidades.
      });
    return () => {
      activo = false;
    };
  }, [mostrarLocalidades]);

  // Crea o quita la capa de localidades según el interruptor.
  useEffect(() => {
    const instancia = mapa.current;
    if (!instancia || !coleccion || !verLocalidades) {
      return undefined;
    }
    const capa = crearCapaLocalidades(instancia, coleccion, {
      interactiva: !seleccionable,
      alHacerClic: (nombre) => elegirLocalidad(nombre === elegidaRef.current ? null : nombre),
      textoCartel: (nombre) => textoCartel.current?.(nombre) ?? nombre,
      colorRelleno: (nombre) => colorPorLocalidad.current?.(nombre) ?? null,
    });
    capaLocalidades.current = capa;
    capa.actualizarZoom(instancia.getZoom());
    capa.seleccionar(elegidaRef.current);
    return () => {
      capa.quitar();
      capaLocalidades.current = null;
    };
  }, [coleccion, verLocalidades, seleccionable, elegirLocalidad]);

  useEffect(() => {
    capaLocalidades.current?.refrescar();
  }, [colorLocalidad]);

  // Resalta la localidad elegida y vuela hacia ella (o de regreso a donde estaba al soltarla).
  useEffect(() => {
    capaLocalidades.current?.seleccionar(elegida);
    const instancia = mapa.current;
    if (!instancia || elegidaVolada.current === elegida) {
      return;
    }
    if (omitirVuelo.current) {
      omitirVuelo.current = false;
      elegidaVolada.current = elegida;
      return;
    }
    if (elegida !== null) {
      if (!coleccion) {
        return; // Espera a que carguen las localidades para saber adónde volar.
      }
      if (elegidaVolada.current === null) {
        pila.current.empujar(vistaActual(instancia));
      }
      const feature = buscarLocalidad(coleccion, elegida);
      if (feature) {
        volarALimites(instancia, cajaDe(feature));
      }
    } else {
      const previa = pila.current.sacar();
      if (previa) {
        volarAVista(instancia, previa);
      }
    }
    elegidaVolada.current = elegida;
  }, [elegida, coleccion, verLocalidades]);

  useEffect(() => {
    const grupo = capaMarcadores.current;
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
        L.latLngBounds(
          marcadores.map((marcador) => [marcador.lat, marcador.lng] as [number, number]),
        ),
        { padding: [48, 48], maxZoom: 16 },
      );
    }
    ultimaClave.current = clave;
  }, [marcadores, seleccionadoId, ajustarAMarcadores]);

  const nombres = useMemo(() => (coleccion ? nombresOrdenados(coleccion) : []), [coleccion]);

  // Escape suelta la localidad elegida. Se escucha en el contenedor y no con un atributo de React para
  // no volver "interactivo" a un elemento que solo agrupa el mapa.
  useEffect(() => {
    const elemento = envoltura.current;
    if (!elemento) {
      return undefined;
    }
    const alTeclear = (evento: globalThis.KeyboardEvent) => {
      if (evento.key === 'Escape' && elegidaRef.current !== null) {
        elegirLocalidad(null);
      }
    };
    elemento.addEventListener('keydown', alTeclear);
    return () => elemento.removeEventListener('keydown', alTeclear);
  }, [elegirLocalidad]);

  const verTodaBogota = () => {
    if (mapa.current && coleccion) {
      pila.current.limpiar();
      volarALimites(mapa.current, cajaDeTodas(coleccion), 8);
    }
  };

  return (
    <div
      role="region"
      aria-label={descripcion}
      style={{ height: altura }}
      className="relative z-0 min-h-[300px] w-full"
      ref={envoltura}
    >
      <div ref={contenedor} className="h-full w-full" />
      {mostrarLocalidades && coleccion && (
        <div className="pointer-events-none absolute right-3 top-3 z-[500] flex flex-col items-end gap-2">
          <div className="pointer-events-auto flex flex-col items-end gap-2">
            {verLocalidades && (
              <ControlLocalidades
                nombres={nombres}
                seleccionada={elegida}
                alElegir={elegirLocalidad}
              />
            )}
            <button
              type="button"
              role="switch"
              aria-checked={verLocalidades}
              onClick={() => {
                if (verLocalidades) {
                  elegirLocalidad(null);
                }
                setVerLocalidades((actual) => !actual);
              }}
              className={cx(
                'flex min-h-[44px] items-center gap-2 rounded px-3 text-pequeno font-semibold shadow-medio sm:min-h-[36px]',
                verLocalidades
                  ? 'bg-verde-profundo text-white'
                  : 'bg-white text-tinta hover:bg-verde-tenue',
              )}
            >
              Mostrar localidades
            </button>
            {verLocalidades && (
              <button
                type="button"
                onClick={verTodaBogota}
                className="flex min-h-[44px] items-center gap-2 rounded bg-white px-3 text-pequeno font-semibold text-tinta shadow-medio hover:bg-verde-tenue sm:min-h-[36px]"
              >
                <Maximize2 className="h-4 w-4" aria-hidden="true" />
                Ver toda Bogotá
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
