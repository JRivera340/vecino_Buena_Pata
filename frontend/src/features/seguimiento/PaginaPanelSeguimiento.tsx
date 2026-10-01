import { useMemo, useState } from 'react';
import { cancelarEnCamino, listarSeguimiento, marcarEnCamino } from '@/core/api/seguimiento-estado';
import { listarComunidades } from '@/core/api/comunidades';
import { useCarga } from '@/core/api/useCarga';
import { formatearFecha } from '@/core/formato.lib';
import type { AnimalSeguimiento } from '@/core/modelos/seguimiento-estado';
import { useSesion } from '@/core/sesion/sesion.store';
import { MapaTerritorio, type MarcadorMapa } from '@/shared/mapa/MapaTerritorio';
import { Boton } from '@/shared/ui/Boton';
import { Campo, Entrada, Selector } from '@/shared/ui/Campo';
import { EncabezadoPagina } from '@/shared/ui/EncabezadoPagina';
import { ErrorCarga } from '@/shared/ui/ErrorCarga';
import { Esqueleto } from '@/shared/ui/Esqueleto';
import { Tarjeta } from '@/shared/ui/Tarjeta';
import { useTitulo } from '@/shared/ui/useTitulo';
import { filtrarSeguimiento } from './filtrar-seguimiento.lib';
import { seguimientoVisual } from './seguimiento-visual.lib';

// El token no se verifica en el cliente: solo se lee el "sub" (username) para
// saber si la visita en camino la reclamó el usuario con la sesión activa.
function usernameDeSesion(token: string | undefined): string | null {
  if (!token) return null;
  try {
    const cuerpo = token.split('.')[1];
    const normalizado = cuerpo.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(normalizado)) as { sub?: unknown };
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

export default function PaginaPanelSeguimiento() {
  useTitulo('Panel de seguimiento');
  const sesion = useSesion((estado) => estado.sesion);
  const usuarioActual = useMemo(() => usernameDeSesion(sesion?.token), [sesion?.token]);

  const seguimiento = useCarga(listarSeguimiento, []);
  const comunidades = useCarga(listarComunidades, []);

  const [busqueda, setBusqueda] = useState('');
  const [comunidadId, setComunidadId] = useState<number | 'TODAS'>('TODAS');
  const [liderId, setLiderId] = useState<number | 'TODOS'>('TODOS');
  const [enEspera, setEnEspera] = useState<number | null>(null);

  const lista: AnimalSeguimiento[] = useMemo(() => seguimiento.datos ?? [], [seguimiento.datos]);

  // listarUsuarios() es solo-ADMIN, así que las opciones de líder y el mapa comunidad -> líder
  // salen de listarComunidades() (sin restricción de rol), usando su lider_id.
  const comunidadesConLider = useMemo(
    () => (comunidades.datos ?? []).filter((comunidad) => comunidad.lider_id != null),
    [comunidades.datos],
  );
  const comunidadALider = useMemo(() => {
    const mapa = new Map<number, number>();
    for (const comunidad of comunidadesConLider) {
      mapa.set(comunidad.id, comunidad.lider_id as number);
    }
    return mapa;
  }, [comunidadesConLider]);

  const visibles = useMemo(() => {
    const porFiltrosBase = filtrarSeguimiento(lista, { busqueda, comunidadId, liderId });
    if (liderId === 'TODOS') return porFiltrosBase;
    return porFiltrosBase.filter((animal) => comunidadALider.get(animal.comunidad_id) === liderId);
  }, [lista, busqueda, comunidadId, liderId, comunidadALider]);

  const marcadores: MarcadorMapa[] = useMemo(
    () =>
      visibles.map((animal) => ({
        id: animal.id,
        lat: animal.latitud,
        lng: animal.longitud,
        visual: { ...seguimientoVisual(animal.estado_seguimiento), indicadorReporte: false },
        etiqueta: `${animal.nombre} - ${seguimientoVisual(animal.estado_seguimiento).etiqueta}`,
      })),
    [visibles],
  );

  async function voyAVisitarlo(animalId: number) {
    setEnEspera(animalId);
    try {
      await marcarEnCamino(animalId);
      seguimiento.recargar();
    } finally {
      setEnEspera(null);
    }
  }

  async function cancelarVisita(animalId: number) {
    setEnEspera(animalId);
    try {
      await cancelarEnCamino(animalId);
      seguimiento.recargar();
    } finally {
      setEnEspera(null);
    }
  }

  return (
    <div className="contenedor py-10">
      <EncabezadoPagina
        titulo="Panel de seguimiento"
        descripcion="Vecinos Buena Pata con visitas de seguimiento al día, próximas a vencer o vencidas."
      />

      {seguimiento.error ? (
        <ErrorCarga titulo="No pudimos cargar el seguimiento" alReintentar={seguimiento.recargar} />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-4" aria-label="Filtros">
            <Campo id="filtro-busqueda" etiqueta="Buscar por nombre">
              {(props) => (
                <Entrada
                  {...props}
                  type="search"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              )}
            </Campo>
            <Campo id="filtro-comunidad" etiqueta="Comunidad">
              {(props) => (
                <Selector
                  {...props}
                  value={comunidadId}
                  onChange={(e) =>
                    setComunidadId(e.target.value === 'TODAS' ? 'TODAS' : Number(e.target.value))
                  }
                >
                  <option value="TODAS">Todas</option>
                  {(comunidades.datos ?? []).map((comunidad) => (
                    <option key={comunidad.id} value={comunidad.id}>
                      {comunidad.nombre}
                    </option>
                  ))}
                </Selector>
              )}
            </Campo>
            <Campo id="filtro-lider" etiqueta="Líder">
              {(props) => (
                <Selector
                  {...props}
                  value={liderId}
                  onChange={(e) =>
                    setLiderId(e.target.value === 'TODOS' ? 'TODOS' : Number(e.target.value))
                  }
                >
                  <option value="TODOS">Todos</option>
                  {comunidadesConLider.map((comunidad) => (
                    <option key={comunidad.id} value={comunidad.lider_id as number}>
                      Líder de {comunidad.nombre}
                    </option>
                  ))}
                </Selector>
              )}
            </Campo>
          </aside>

          <div className="space-y-6">
            <div className="h-[520px] overflow-hidden rounded-tarjeta border border-black/15 shadow-sutil">
              {seguimiento.cargando ? (
                <Esqueleto className="h-full w-full" />
              ) : (
                <MapaTerritorio
                  marcadores={marcadores}
                  ajustarAMarcadores
                  descripcion="Mapa con los animales en seguimiento"
                  altura="520px"
                />
              )}
            </div>

            <p className="text-pequeno text-tinta-suave" aria-live="polite">
              {seguimiento.cargando
                ? 'Cargando animales...'
                : `${visibles.length} de ${lista.length} animales`}
            </p>

            {!seguimiento.cargando && visibles.length === 0 ? (
              <p className="rounded border border-dashed border-lienzo-borde p-8 text-center text-tinta-suave">
                Ningún animal coincide con estos filtros.
              </p>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visibles.map((animal) => {
                  const visual = seguimientoVisual(animal.estado_seguimiento);
                  const enCaminoPorMi =
                    animal.visita_en_camino_por !== null &&
                    animal.visita_en_camino_por === usuarioActual;
                  return (
                    <li key={animal.id}>
                      <Tarjeta className="flex h-full flex-col gap-3 p-4">
                        <div className="min-w-0 space-y-1">
                          <p className="truncate text-h6 font-semibold text-tinta">{animal.nombre}</p>
                          <p className="text-minimo text-tinta-suave">{animal.barrio}</p>
                          <span
                            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-minimo font-semibold"
                            style={{
                              color: visual.colorTexto,
                              borderColor: visual.color,
                              backgroundColor: `${visual.color}14`,
                            }}
                          >
                            {visual.etiqueta}
                          </span>
                          <p className="text-minimo text-tinta-suave">
                            Vence: {formatearFecha(animal.proxima_visita_vence)}
                          </p>
                          {animal.visita_en_camino_por && !enCaminoPorMi && (
                            <p className="text-minimo text-tinta-suave">
                              En camino: {animal.visita_en_camino_por}
                            </p>
                          )}
                        </div>
                        {enCaminoPorMi ? (
                          <Boton
                            variante="secundario"
                            tamano="pequeno"
                            cargando={enEspera === animal.id}
                            onClick={() => cancelarVisita(animal.id)}
                          >
                            Cancelar
                          </Boton>
                        ) : !animal.visita_en_camino_por ? (
                          <Boton
                            variante="primario"
                            tamano="pequeno"
                            cargando={enEspera === animal.id}
                            onClick={() => voyAVisitarlo(animal.id)}
                          >
                            Voy a visitarlo
                          </Boton>
                        ) : null}
                      </Tarjeta>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
