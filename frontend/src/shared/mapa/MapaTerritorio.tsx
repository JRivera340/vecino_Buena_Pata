import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Maximize2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { EstadoVisualResultado } from '@/shared/estado-visual/estado-visual.lib';
import { cx } from '@/shared/ui/clases';
import { crearCapaLocalidades, type CapaLocalidades } from './capa-localidades';
import { cargarLocalidades } from './cargar-localidades';
import { ControlLocalidades } from './ControlLocalidades';
import { crearIconoMarcador, crearIconoUbicacion } from './icono-marcador';
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
  // Localidad del animal: al elegirlo, el mapa la resalta.
  localidad?: string | null;
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
  // Para el modo en que el mapa recuerda solo la elección: con qué localidad arranca.
  localidadInicial?: string | null;
  alSeleccionarLocalidad?: (nombre: string | null) => void;
  textoCartelLocalidad?: (nombre: string) => string;
  colorLocalidad?: (nombre: string) => string | null;
  alHacerClicEnMarcador?: (id: number) => void;
  // Escape o un clic en un espacio vacío: quien usa el mapa suelta el animal elegido.
  alDeseleccionarMarcador?: () => void;
  alSeleccionarUbicacion?: (ubicacion: UbicacionSeleccionada) => void;
  // Panel con el detalle de lo elegido: lateral en escritorio y hoja inferior en móvil.
  panel?: ReactNode;
}

const CENTRO_POR_DEFECTO: [number, number] = [4.6097, -74.0817];
const ZOOM_AL_MARCAR = 16;
const ZOOM_AL_ELEGIR_ANIMAL = 15;
const ANCHO_PANEL_ESCRITORIO = 340;

function hayPanelLateral(): boolean {
  return window.matchMedia?.('(min-width: 1024px)').matches === true;
}

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
  localidadInicial = null,
  alSeleccionarLocalidad,
  textoCartelLocalidad,
  colorLocalidad,
  alHacerClicEnMarcador,
  alDeseleccionarMarcador,
  alSeleccionarUbicacion,
  panel,
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
  const alSoltarMarcador = useRef(alDeseleccionarMarcador);
  const alUbicar = useRef(alSeleccionarUbicacion);
  const alElegirLocalidad = useRef(alSeleccionarLocalidad);
  const textoCartel = useRef(textoCartelLocalidad);
  const colorPorLocalidad = useRef(colorLocalidad);
  const conPanel = useRef(Boolean(panel));

  const [coleccion, setColeccion] = useState<ColeccionLocalidades | null>(null);
  const [verLocalidades, setVerLocalidades] = useState(mostrarLocalidades);
  const [interna, setInterna] = useState<string | null>(localidadInicial);
  const elegida = localidadSeleccionada !== undefined ? localidadSeleccionada : interna;
  const elegidaRef = useRef<string | null>(elegida);
  const seleccionadoRef = useRef<number | null>(seleccionadoId);
  const coleccionRef = useRef<ColeccionLocalidades | null>(null);
  // Cuando la elección viene de marcar un punto o de elegir un animal, el mapa ya vuela hacia allá
  // y no debe volar además a los límites de la localidad.
  const omitirVuelo = useRef(false);
  const elegidaVolada = useRef<string | null>(null);
  const localidadPorAnimal = useRef(false);
  const animalVolado = useRef<number | null>(null);

  useEffect(() => {
    alClic.current = alHacerClicEnMarcador;
    alSoltarMarcador.current = alDeseleccionarMarcador;
    alUbicar.current = alSeleccionarUbicacion;
    alElegirLocalidad.current = alSeleccionarLocalidad;
    textoCartel.current = textoCartelLocalidad;
    colorPorLocalidad.current = colorLocalidad;
    elegidaRef.current = elegida;
    seleccionadoRef.current = seleccionadoId;
    conPanel.current = Boolean(panel);
  }, [
    alHacerClicEnMarcador,
    alDeseleccionarMarcador,
    alSeleccionarUbicacion,
    alSeleccionarLocalidad,
    textoCartelLocalidad,
    colorLocalidad,
    elegida,
    seleccionadoId,
    panel,
  ]);

  const elegirLocalidad = useCallback((nombre: string | null) => {
    setInterna(nombre);
    alElegirLocalidad.current?.(nombre);
  }, []);

  const guardarOrigen = useCallback((instancia: L.Map) => {
    if (pila.current.tamano === 0) {
      pila.current.empujar(vistaActual(instancia));
    }
  }, []);

  const restaurarOrigen = useCallback((instancia: L.Map) => {
    const previa = pila.current.sacar();
    pila.current.limpiar();
    if (previa) {
      volarAVista(instancia, previa);
    }
  }, []);

  // Suelta lo que haya elegido: primero el animal (que arrastra su localidad) y si no, la localidad.
  const soltarTodo = useCallback(() => {
    if (seleccionadoRef.current !== null) {
      alSoltarMarcador.current?.();
    } else if (elegidaRef.current !== null) {
      elegirLocalidad(null);
    }
  }, [elegirLocalidad]);

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
        // Un clic en un espacio vacío suelta lo que se haya elegido.
        soltarTodo();
        return;
      }
      const localidad = coleccionRef.current
        ? localidadDePunto(evento.latlng.lat, evento.latlng.lng, coleccionRef.current)
        : undefined;
      temporal.current?.remove();
      temporal.current = L.marker(evento.latlng, { icon: crearIconoUbicacion() }).addTo(instancia);
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
      alHacerClic: (nombre) => {
        localidadPorAnimal.current = false;
        elegirLocalidad(nombre === elegidaRef.current ? null : nombre);
      },
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
      guardarOrigen(instancia);
      const feature = buscarLocalidad(coleccion, elegida);
      if (feature) {
        volarALimites(instancia, cajaDe(feature));
      }
    } else if (seleccionadoRef.current === null) {
      restaurarOrigen(instancia);
    }
    elegidaVolada.current = elegida;
  }, [elegida, coleccion, verLocalidades, guardarOrigen, restaurarOrigen]);

  // Al elegir un animal: la huellita salta, el mapa vuela hasta él y se resalta su localidad.
  useEffect(() => {
    const instancia = mapa.current;
    if (!instancia || animalVolado.current === seleccionadoId) {
      return;
    }
    if (seleccionadoId !== null) {
      const animal = marcadores.find((marcador) => marcador.id === seleccionadoId);
      if (!animal) {
        return;
      }
      animalVolado.current = seleccionadoId;
      guardarOrigen(instancia);
      const tamano = instancia.getSize();
      const desplazamiento: [number, number] = !conPanel.current
        ? [0, 0]
        : hayPanelLateral()
          ? [ANCHO_PANEL_ESCRITORIO / 2, 0]
          : [0, -tamano.y * 0.225];
      volarAPunto(instancia, [animal.lat, animal.lng], ZOOM_AL_ELEGIR_ANIMAL, desplazamiento);
      if (animal.localidad) {
        if (animal.localidad !== elegidaRef.current) {
          omitirVuelo.current = true;
        }
        localidadPorAnimal.current = true;
        elegirLocalidad(animal.localidad);
      }
      return;
    }
    animalVolado.current = null;
    if (localidadPorAnimal.current) {
      localidadPorAnimal.current = false;
      if (elegidaRef.current !== null) {
        omitirVuelo.current = true;
        elegirLocalidad(null);
      }
      restaurarOrigen(instancia);
    } else if (elegidaRef.current === null) {
      restaurarOrigen(instancia);
    }
  }, [seleccionadoId, marcadores, elegirLocalidad, guardarOrigen, restaurarOrigen]);

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
      });
      if (!panel) {
        punto.bindPopup(contenido);
      }
      punto.on('add', () => punto.getElement()?.setAttribute('aria-label', marcador.etiqueta));
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
  }, [marcadores, seleccionadoId, ajustarAMarcadores, panel]);

  const nombres = useMemo(() => (coleccion ? nombresOrdenados(coleccion) : []), [coleccion]);

  // Escape suelta lo elegido. Se escucha en el contenedor y no con un atributo de React para
  // no volver "interactivo" a un elemento que solo agrupa el mapa.
  useEffect(() => {
    const elemento = envoltura.current;
    if (!elemento) {
      return undefined;
    }
    const alTeclear = (evento: globalThis.KeyboardEvent) => {
      if (evento.key === 'Escape') {
        soltarTodo();
      }
    };
    elemento.addEventListener('keydown', alTeclear);
    return () => elemento.removeEventListener('keydown', alTeclear);
  }, [soltarTodo]);

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
                alElegir={(nombre) => {
                  localidadPorAnimal.current = false;
                  elegirLocalidad(nombre);
                }}
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
      {panel && (
        <div className="absolute inset-x-2 bottom-6 z-[550] max-h-[45%] overflow-y-auto rounded-tarjeta bg-white shadow-fuerte lg:inset-x-auto lg:bottom-auto lg:left-3 lg:top-[104px] lg:max-h-[calc(100%-116px)] lg:w-[340px] lg:rounded-tarjeta">
          {panel}
        </div>
      )}
    </div>
  );
}
