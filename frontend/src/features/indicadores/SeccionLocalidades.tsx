import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { obtenerIndicadoresPorLocalidad } from '@/core/api/indicadores';
import { useCarga } from '@/core/api/useCarga';
import type { Animal } from '@/core/modelos/animal';
import type { EstadoAnimal } from '@/core/modelos/enums';
import type { IndicadoresLocalidades } from '@/core/modelos/indicadores';
import { estadoVisual } from '@/shared/estado-visual/estado-visual.lib';
import { MapaTerritorio, type MarcadorMapa } from '@/shared/mapa/MapaTerritorio';
import { slugDeLocalidad } from '@/shared/mapa/localidades.lib';
import { PanelAnimalMapa } from '@/shared/mapa/PanelAnimalMapa';
import { Alerta } from '@/shared/ui/Alerta';
import { Boton } from '@/shared/ui/Boton';
import { Campo, Entrada, Selector } from '@/shared/ui/Campo';
import { ErrorCarga } from '@/shared/ui/ErrorCarga';
import { Esqueleto } from '@/shared/ui/Esqueleto';
import { Tabla, type Columna } from '@/shared/ui/Tabla';
import { Tarjeta, TarjetaCuerpo } from '@/shared/ui/Tarjeta';
import { crearEscala } from './escala-coropletica.lib';
import { EvolucionMensual } from './EvolucionMensual';
import {
  FILTROS_INICIALES,
  filtrarAnimalesIndicadores,
  parametrosIndicadores,
  validarRango,
  type EspecieFiltro,
  type FiltrosIndicadores,
} from './filtros-indicadores.lib';
import { LeyendaCoropletica } from './LeyendaCoropletica';
import { PanelLocalidad } from './PanelLocalidad';

const ESTADOS: EstadoAnimal[] = [
  'CANDIDATO',
  'EN_PROCESO',
  'VBP_ACTIVO',
  'ADOPTADO',
  'PERDIDO',
  'FALLECIDO',
];

interface SeccionLocalidadesProps {
  animales: Animal[];
}

export function SeccionLocalidades({ animales }: SeccionLocalidadesProps) {
  const [filtros, setFiltros] = useState<FiltrosIndicadores>(FILTROS_INICIALES);
  const [busqueda, setBusqueda] = useSearchParams();
  const [seleccionadoId, setSeleccionadoId] = useState<number | null>(null);
  const errorRango = validarRango(filtros);
  const consulta = parametrosIndicadores(filtros);

  const carga = useCarga<IndicadoresLocalidades | null>(
    () => (errorRango ? Promise.resolve(null) : obtenerIndicadoresPorLocalidad(consulta)),
    [consulta.toString(), errorRango],
  );
  const datos = carga.datos;

  const slug = busqueda.get('localidad');
  const localidadElegida = useMemo(() => {
    if (!datos || !slug) {
      return null;
    }
    return datos.localidades.find((l) => slugDeLocalidad(l.nombre) === slug)?.nombre ?? null;
  }, [datos, slug]);

  const porNombre = useMemo(
    () => new Map((datos?.localidades ?? []).map((l) => [l.nombre, l])),
    [datos],
  );
  const escala = useMemo(
    () => crearEscala((datos?.localidades ?? []).map((l) => l.total)),
    [datos],
  );

  const visibles = useMemo(
    () => filtrarAnimalesIndicadores(animales, filtros),
    [animales, filtros],
  );
  const marcadores = useMemo<MarcadorMapa[]>(
    () =>
      visibles.map((animal) => ({
        id: animal.id,
        lat: animal.latitud,
        lng: animal.longitud,
        visual: estadoVisual(animal.estado),
        etiqueta: `${animal.nombre} - ${estadoVisual(animal.estado).etiqueta}`,
        localidad: animal.localidad ?? null,
      })),
    [visibles],
  );
  const animalElegido = visibles.find((animal) => animal.id === seleccionadoId) ?? null;
  const resumenLocalidad = localidadElegida ? porNombre.get(localidadElegida) : undefined;
  const hayPeriodo = filtros.desde !== '' || filtros.hasta !== '';

  const elegirLocalidad = (nombre: string | null) => {
    const siguiente = new URLSearchParams(busqueda);
    if (nombre) {
      siguiente.set('localidad', slugDeLocalidad(nombre));
    } else {
      siguiente.delete('localidad');
    }
    setBusqueda(siguiente, { replace: true });
  };

  const cambiar = <K extends keyof FiltrosIndicadores>(clave: K, valor: FiltrosIndicadores[K]) => {
    setSeleccionadoId(null);
    setFiltros((actuales) => ({ ...actuales, [clave]: valor }));
  };

  const columnas: Columna<IndicadoresLocalidades['localidades'][number]>[] = [
    { clave: 'nombre', titulo: 'Localidad', celda: (l) => l.nombre },
    { clave: 'total', titulo: 'Animales', celda: (l) => l.total, alineacion: 'derecha' },
    {
      clave: 'periodo',
      titulo: hayPeriodo ? 'Inscripciones del periodo' : 'Inscripciones',
      celda: (l) => l.inscripciones_periodo,
      alineacion: 'derecha',
    },
    {
      clave: 'reportes',
      titulo: 'Reportes abiertos',
      celda: (l) => l.reportes_abiertos,
      alineacion: 'derecha',
    },
    {
      clave: 'accion',
      titulo: 'Mapa',
      celda: (l) => (
        <Boton
          tamano="pequeno"
          variante="secundario"
          aria-label={`Ver ${l.nombre} en el mapa`}
          onClick={() => {
            setSeleccionadoId(null);
            elegirLocalidad(l.nombre);
            document.getElementById('mapa-localidades')?.scrollIntoView?.({ block: 'center' });
          }}
        >
          Ver en el mapa
        </Boton>
      ),
    },
  ];

  return (
    <section aria-labelledby="titulo-localidades" className="space-y-6">
      <div className="max-w-[62ch]">
        <h2 id="titulo-localidades" className="text-h3">
          Animales por localidad
        </h2>
        <p className="mt-2 text-tinta-suave">
          Toca una localidad para ver su resumen, o una huellita para ver de qué animal se trata.
        </p>
      </div>

      <Tarjeta>
        <TarjetaCuerpo>
          <fieldset className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
            <legend className="mb-3 text-h6">Filtros</legend>
            <Campo id="ind-desde" etiqueta="Desde">
              {(p) => (
                <Entrada
                  {...p}
                  type="date"
                  value={filtros.desde}
                  onChange={(e) => cambiar('desde', e.target.value)}
                />
              )}
            </Campo>
            <Campo id="ind-hasta" etiqueta="Hasta">
              {(p) => (
                <Entrada
                  {...p}
                  type="date"
                  value={filtros.hasta}
                  onChange={(e) => cambiar('hasta', e.target.value)}
                />
              )}
            </Campo>
            <Campo id="ind-estado" etiqueta="Estado">
              {(p) => (
                <Selector
                  {...p}
                  value={filtros.estado}
                  onChange={(e) => cambiar('estado', e.target.value as EstadoAnimal | 'TODOS')}
                >
                  <option value="TODOS">Todos</option>
                  {ESTADOS.map((estado) => (
                    <option key={estado} value={estado}>
                      {estadoVisual(estado).etiqueta}
                    </option>
                  ))}
                </Selector>
              )}
            </Campo>
            <Campo id="ind-especie" etiqueta="Especie">
              {(p) => (
                <Selector
                  {...p}
                  value={filtros.especie}
                  onChange={(e) => cambiar('especie', e.target.value as EspecieFiltro)}
                >
                  <option value="TODAS">Todas</option>
                  <option value="PERRO">Perros</option>
                  <option value="GATO">Gatos</option>
                </Selector>
              )}
            </Campo>
            <Boton variante="fantasma" onClick={() => setFiltros(FILTROS_INICIALES)}>
              Quitar los filtros
            </Boton>
          </fieldset>
          {errorRango && (
            <Alerta tipo="advertencia" className="mt-4">
              {errorRango}
            </Alerta>
          )}
        </TarjetaCuerpo>
      </Tarjeta>

      {carga.error ? (
        <ErrorCarga
          titulo="No pudimos cargar los indicadores por localidad"
          alReintentar={carga.recargar}
        />
      ) : (
        <>
          <p className="text-pequeno text-tinta-suave" aria-live="polite">
            {carga.cargando || !datos
              ? 'Cargando...'
              : `${datos.total_animales} ${datos.total_animales === 1 ? 'animal' : 'animales'} en total` +
                (datos.sin_localidad > 0 ? `, ${datos.sin_localidad} sin localidad` : '')}
          </p>

          <div id="mapa-localidades" className="scroll-mt-24 space-y-3">
            <div className="overflow-hidden rounded-seccion border border-black/15 shadow-sutil">
              {carga.cargando && !datos ? (
                <Esqueleto className="h-[560px] w-full" />
              ) : (
                <MapaTerritorio
                  altura="min(78vh, 620px)"
                  descripcion="Mapa de Bogotá con la cantidad de animales por localidad"
                  centro={[4.66, -74.1]}
                  zoom={11}
                  marcadores={marcadores}
                  seleccionadoId={seleccionadoId}
                  alHacerClicEnMarcador={setSeleccionadoId}
                  alDeseleccionarMarcador={() => setSeleccionadoId(null)}
                  localidadSeleccionada={localidadElegida}
                  alSeleccionarLocalidad={elegirLocalidad}
                  colorLocalidad={(nombre) => escala.colorDe(porNombre.get(nombre)?.total ?? 0)}
                  textoCartelLocalidad={(nombre) => {
                    const total = porNombre.get(nombre)?.total ?? 0;
                    return `${nombre}: ${total} ${total === 1 ? 'animal' : 'animales'}`;
                  }}
                  panel={
                    animalElegido ? (
                      <PanelAnimalMapa
                        nombre={animalElegido.nombre}
                        especie={animalElegido.especie}
                        foto={animalElegido.foto_principal}
                        estado={animalElegido.estado}
                        localidad={animalElegido.localidad}
                        barrio={animalElegido.barrio}
                        fechaInscripcion={animalElegido.fecha_inscripcion}
                        hrefFicha={`/animales/${animalElegido.id}`}
                        alVolver={() => setSeleccionadoId(null)}
                      />
                    ) : resumenLocalidad ? (
                      <PanelLocalidad
                        localidad={resumenLocalidad}
                        hayPeriodo={hayPeriodo}
                        alVolver={() => elegirLocalidad(null)}
                      />
                    ) : null
                  }
                />
              )}
            </div>
            <LeyendaCoropletica escala={escala} />
          </div>

          {datos && (
            <>
              <section aria-labelledby="titulo-difusion" className="space-y-4">
                <h3 id="titulo-difusion" className="text-h4">
                  De dónde vienen las inscripciones
                </h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Tarjeta destacada>
                    <TarjetaCuerpo>
                      <p className="text-hero font-semibold text-verde-tinta">
                        {datos.difusion.en_santa_fe}
                      </p>
                      <p className="text-pequeno text-tinta-suave">En Santa Fe</p>
                    </TarjetaCuerpo>
                  </Tarjeta>
                  <Tarjeta destacada>
                    <TarjetaCuerpo>
                      <p className="text-hero font-semibold text-verde-tinta">
                        {datos.difusion.fuera_de_santa_fe}
                      </p>
                      <p className="text-pequeno text-tinta-suave">En otras localidades</p>
                    </TarjetaCuerpo>
                  </Tarjeta>
                  <Tarjeta destacada>
                    <TarjetaCuerpo>
                      <p className="text-hero font-semibold text-verde-tinta">
                        {datos.difusion.peso_fuera_de_santa_fe.toLocaleString('es-CO', {
                          maximumFractionDigits: 1,
                        })}{' '}
                        %
                      </p>
                      <p className="text-pequeno text-tinta-suave">
                        Del total viene de fuera de Santa Fe
                      </p>
                    </TarjetaCuerpo>
                  </Tarjeta>
                </div>
                {datos.difusion.sin_localidad > 0 && (
                  <p className="text-pequeno text-tinta-suave">
                    {datos.difusion.sin_localidad} inscripciones no tienen localidad y no cuentan en
                    estos porcentajes.
                  </p>
                )}
                <EvolucionMensual meses={datos.difusion.mensual} />
              </section>

              <section aria-labelledby="titulo-tabla-localidades" className="space-y-3">
                <h3 id="titulo-tabla-localidades" className="text-h4">
                  Detalle por localidad
                </h3>
                <Tabla
                  columnas={columnas}
                  filas={datos.localidades}
                  claveFila={(l) => l.codigo}
                  descripcion="Animales, inscripciones y reportes por localidad"
                />
              </section>
            </>
          )}
        </>
      )}
    </section>
  );
}
