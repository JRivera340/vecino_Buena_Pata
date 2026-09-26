import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Especie } from '@/core/modelos/enums';
import type { AnimalMapaPublico } from '@/core/modelos/publico';
import { estadoVisual } from '@/shared/estado-visual/estado-visual.lib';
import { MapaTerritorio, type MarcadorMapa } from '@/shared/mapa/MapaTerritorio';
import { Alerta } from '@/shared/ui/Alerta';
import { Boton } from '@/shared/ui/Boton';
import { Campo, Entrada, Selector } from '@/shared/ui/Campo';
import { Esqueleto } from '@/shared/ui/Esqueleto';
import { Tarjeta, TarjetaCuerpo } from '@/shared/ui/Tarjeta';
import { filtrarMapaPublico } from '../filtrar-mapa-publico.lib';
import { separarMarcadores } from '../separar-marcadores.lib';
import { TarjetaAnimalMapa } from './TarjetaAnimalMapa';

interface Props {
  animales: AnimalMapaPublico[] | null;
  cargando: boolean;
  hayError: boolean;
  alReintentar: () => void;
}

export function MapaVecinos({ animales, cargando, hayError, alReintentar }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [especie, setEspecie] = useState<Especie | 'TODAS'>('TODAS');
  const [barrio, setBarrio] = useState('TODOS');
  const [seleccionadoId, setSeleccionadoId] = useState<number | null>(null);

  const todos = useMemo(() => animales ?? [], [animales]);
  const filtrados = useMemo(
    () => filtrarMapaPublico(todos, { busqueda, especie, barrio }),
    [todos, busqueda, especie, barrio],
  );
  const barrios = useMemo(
    () =>
      Array.from(new Set(todos.map((animal) => animal.barrio))).sort((a, b) =>
        a.localeCompare(b, 'es'),
      ),
    [todos],
  );
  const marcadores = useMemo<MarcadorMapa[]>(() => {
    const visual = estadoVisual('VBP_ACTIVO');
    return separarMarcadores(
      filtrados.map((animal) => ({
        id: animal.id,
        lat: animal.latitud,
        lng: animal.longitud,
        etiqueta: animal.nombre,
        visual,
      })),
    );
  }, [filtrados]);

  const hayFiltros = busqueda.trim() !== '' || especie !== 'TODAS' || barrio !== 'TODOS';

  function limpiarFiltros() {
    setBusqueda('');
    setEspecie('TODAS');
    setBarrio('TODOS');
  }

  let lista;
  if (cargando) {
    lista = (
      <div className="space-y-3" role="status" aria-label="Cargando los animales">
        {[0, 1, 2].map((i) => (
          <Esqueleto key={i} className="h-[88px] w-full" />
        ))}
      </div>
    );
  } else if (hayError) {
    lista = (
      <Alerta tipo="error" titulo="No pudimos cargar el mapa">
        <p>Revisa tu conexión e inténtalo otra vez.</p>
        <Boton className="mt-3" tamano="pequeno" variante="secundario" onClick={alReintentar}>
          Reintentar
        </Boton>
      </Alerta>
    );
  } else if (todos.length === 0) {
    lista = (
      <p className="rounded border border-dashed border-lienzo-borde p-6 text-pequeno text-tinta-suave">
        Aún no hay animales activos en el mapa. Cuando el programa formalice a los primeros, los
        verás aquí.
      </p>
    );
  } else if (filtrados.length === 0) {
    lista = (
      <div className="rounded border border-dashed border-lienzo-borde p-6 text-pequeno text-tinta-suave">
        <p>Ningún animal coincide con tu búsqueda.</p>
        <Boton className="mt-3" tamano="pequeno" variante="secundario" onClick={limpiarFiltros}>
          Quitar los filtros
        </Boton>
      </div>
    );
  } else {
    lista = (
      <ul className="space-y-3" aria-label="Animales en el mapa">
        {filtrados.map((animal) => (
          <TarjetaAnimalMapa
            key={animal.id}
            animal={animal}
            seleccionado={animal.id === seleccionadoId}
            alElegir={() => setSeleccionadoId(animal.id)}
          />
        ))}
      </ul>
    );
  }

  return (
    <section id="mapa" aria-labelledby="titulo-mapa" className="contenedor scroll-mt-20 py-14">
      <div className="mb-8 max-w-[62ch]">
        <h2 id="titulo-mapa" className="text-h2">
          Mapa de Vecinos Buena Pata
        </h2>
        <p className="mt-2 text-tinta-suave">
          Busca por nombre, especie o barrio. Toca un punto del mapa para ver de quién se trata.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="order-2 flex flex-col gap-4 lg:order-1">
          <Tarjeta>
            <TarjetaCuerpo className="space-y-4">
              <Campo id="filtro-nombre" etiqueta="Buscar por nombre">
                {(p) => (
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-suave"
                      aria-hidden="true"
                    />
                    <Entrada
                      {...p}
                      type="search"
                      className="pl-10"
                      value={busqueda}
                      onChange={(evento) => setBusqueda(evento.target.value)}
                    />
                  </div>
                )}
              </Campo>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <Campo id="filtro-especie" etiqueta="Especie">
                  {(p) => (
                    <Selector
                      {...p}
                      value={especie}
                      onChange={(evento) => setEspecie(evento.target.value as Especie | 'TODAS')}
                    >
                      <option value="TODAS">Todas</option>
                      <option value="PERRO">Perros</option>
                      <option value="GATO">Gatos</option>
                    </Selector>
                  )}
                </Campo>
                <Campo id="filtro-barrio" etiqueta="Barrio">
                  {(p) => (
                    <Selector
                      {...p}
                      value={barrio}
                      onChange={(evento) => setBarrio(evento.target.value)}
                    >
                      <option value="TODOS">Todos</option>
                      {barrios.map((nombre) => (
                        <option key={nombre} value={nombre}>
                          {nombre}
                        </option>
                      ))}
                    </Selector>
                  )}
                </Campo>
              </div>
              {hayFiltros && (
                <Boton variante="fantasma" tamano="pequeno" onClick={limpiarFiltros}>
                  Quitar los filtros
                </Boton>
              )}
            </TarjetaCuerpo>
          </Tarjeta>

          <p className="text-pequeno text-tinta-suave" aria-live="polite">
            {cargando
              ? ' '
              : `${filtrados.length} ${filtrados.length === 1 ? 'animal' : 'animales'} en la lista`}
          </p>
          <div className="lg:max-h-[520px] lg:overflow-y-auto lg:pr-1">{lista}</div>
        </div>

        <div className="order-1 lg:order-2">
          <div className="overflow-hidden rounded-seccion border border-black/15 shadow-sutil">
            <MapaTerritorio
              marcadores={marcadores}
              seleccionadoId={seleccionadoId}
              ajustarAMarcadores
              altura="min(72vh, 640px)"
              descripcion="Mapa con la ubicación aproximada de los Vecinos Buena Pata activos"
              alHacerClicEnMarcador={setSeleccionadoId}
            />
          </div>
          <p className="mt-3 max-w-[70ch] text-pequeno text-tinta-suave">
            Los puntos son aproximados, con unos 300 metros de margen. Así protegemos a las personas
            que cuidan a cada animal.
          </p>
        </div>
      </div>
    </section>
  );
}
