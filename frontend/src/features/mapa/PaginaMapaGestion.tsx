import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listarAnimales } from '@/core/api/animales';
import { listarComunidades } from '@/core/api/comunidades';
import { useCarga } from '@/core/api/useCarga';
import { etiquetaEspecie } from '@/core/formato.lib';
import type { Animal } from '@/core/modelos/animal';
import type { EstadoAnimal } from '@/core/modelos/enums';
import { estadoVisual } from '@/shared/estado-visual/estado-visual.lib';
import { MapaTerritorio, type MarcadorMapa } from '@/shared/mapa/MapaTerritorio';
import { Campo, Entrada, Opcion, Selector } from '@/shared/ui/Campo';
import { EncabezadoPagina } from '@/shared/ui/EncabezadoPagina';
import { ErrorCarga } from '@/shared/ui/ErrorCarga';
import { Esqueleto } from '@/shared/ui/Esqueleto';
import { EtiquetaEstado } from '@/shared/ui/Etiqueta';
import { FotoAnimal } from '@/shared/ui/FotoAnimal';
import { Tarjeta } from '@/shared/ui/Tarjeta';
import { useTitulo } from '@/shared/ui/useTitulo';
import { filtrarAnimales } from './filtrar-animales.lib';

const ESTADOS: EstadoAnimal[] = ['CANDIDATO', 'EN_PROCESO', 'VBP_ACTIVO', 'ADOPTADO', 'PERDIDO', 'FALLECIDO'];

export default function PaginaMapaGestion() {
  useTitulo('Mapa de gestión');
  const animales = useCarga(listarAnimales, []);
  const comunidades = useCarga(listarComunidades, []);
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState<EstadoAnimal | 'TODOS'>('TODOS');
  const [barrio, setBarrio] = useState('TODOS');
  const [comunidadId, setComunidadId] = useState<number | 'TODOS'>('TODOS');
  const [mostrarSalidos, setMostrarSalidos] = useState(false);

  const lista: Animal[] = useMemo(() => animales.datos ?? [], [animales.datos]);
  const barrios = useMemo(() => [...new Set(lista.map((animal) => animal.barrio))].sort(), [lista]);
  const visibles = useMemo(
    () => filtrarAnimales(lista, { busqueda, estado, barrio, comunidadId, mostrarSalidos }),
    [lista, busqueda, estado, barrio, comunidadId, mostrarSalidos],
  );
  const marcadores: MarcadorMapa[] = useMemo(
    () =>
      visibles.map((animal) => ({
        id: animal.id,
        lat: animal.latitud,
        lng: animal.longitud,
        visual: estadoVisual(animal.estado),
        etiqueta: `${animal.nombre} - ${estadoVisual(animal.estado).etiqueta}`,
      })),
    [visibles],
  );

  return (
    <div className="contenedor py-10">
      <EncabezadoPagina
        titulo="Mapa de gestión"
        descripcion="Todos los animales inscritos en el territorio, con su estado actual."
      />

      {animales.error ? (
        <ErrorCarga titulo="No pudimos cargar los animales" alReintentar={animales.recargar} />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-4" aria-label="Filtros">
            <Campo id="filtro-busqueda" etiqueta="Buscar por nombre">
              {(props) => (
                <Entrada {...props} type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
              )}
            </Campo>
            <Campo id="filtro-estado" etiqueta="Estado">
              {(props) => (
                <Selector {...props} value={estado} onChange={(e) => setEstado(e.target.value as EstadoAnimal | 'TODOS')}>
                  <option value="TODOS">Todos</option>
                  {ESTADOS.map((valor) => (
                    <option key={valor} value={valor}>
                      {estadoVisual(valor).etiqueta}
                    </option>
                  ))}
                </Selector>
              )}
            </Campo>
            <Campo id="filtro-barrio" etiqueta="Barrio">
              {(props) => (
                <Selector {...props} value={barrio} onChange={(e) => setBarrio(e.target.value)}>
                  <option value="TODOS">Todos</option>
                  {barrios.map((valor) => (
                    <option key={valor} value={valor}>
                      {valor}
                    </option>
                  ))}
                </Selector>
              )}
            </Campo>
            <Campo id="filtro-comunidad" etiqueta="Comunidad">
              {(props) => (
                <Selector
                  {...props}
                  value={comunidadId}
                  onChange={(e) => setComunidadId(e.target.value === 'TODOS' ? 'TODOS' : Number(e.target.value))}
                >
                  <option value="TODOS">Todas</option>
                  {(comunidades.datos ?? []).map((comunidad) => (
                    <option key={comunidad.id} value={comunidad.id}>
                      {comunidad.nombre}
                    </option>
                  ))}
                </Selector>
              )}
            </Campo>
            <Opcion
              id="filtro-salidos"
              tipo="checkbox"
              etiqueta="Incluir adoptados, perdidos y fallecidos"
              checked={mostrarSalidos}
              onChange={(e) => setMostrarSalidos(e.target.checked)}
            />
          </aside>

          <div className="space-y-6">
            <div className="h-[420px] overflow-hidden rounded-tarjeta border border-black/15 shadow-sutil">
              {animales.cargando ? (
                <Esqueleto className="h-full w-full" />
              ) : (
                <MapaTerritorio
                  marcadores={marcadores}
                  ajustarAMarcadores
                  descripcion="Mapa con los animales inscritos"
                  altura="420px"
                />
              )}
            </div>

            <p className="text-pequeno text-tinta-suave" aria-live="polite">
              {animales.cargando ? 'Cargando animales...' : `${visibles.length} de ${lista.length} animales`}
            </p>

            {!animales.cargando && visibles.length === 0 ? (
              <p className="rounded border border-dashed border-lienzo-borde p-8 text-center text-tinta-suave">
                Ningún animal coincide con estos filtros.
              </p>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visibles.map((animal) => (
                  <li key={animal.id}>
                    <Link to={`/animales/${animal.id}`} className="block h-full no-underline">
                      <Tarjeta interactiva className="flex h-full gap-4 p-4">
                        <FotoAnimal
                          ruta={animal.foto_principal}
                          nombre={animal.nombre}
                          especie={animal.especie}
                          className="h-20 w-20 shrink-0 rounded"
                        />
                        <div className="min-w-0 space-y-1">
                          <p className="truncate text-h6 font-semibold text-tinta">{animal.nombre}</p>
                          <p className="text-minimo text-tinta-suave">
                            {etiquetaEspecie(animal.especie)} en {animal.barrio}
                          </p>
                          <EtiquetaEstado estado={animal.estado} />
                        </div>
                      </Tarjeta>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
