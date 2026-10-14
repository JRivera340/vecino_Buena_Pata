import { useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { actualizarAnimal, obtenerAnimal, obtenerHistorial, obtenerValidaciones, obtenerVisitas } from '@/core/api/animales';
import { ErrorApi } from '@/core/api/cliente';
import { listarComunidades } from '@/core/api/comunidades';
import { mensajeError } from '@/core/api/mensaje-error';
import { useCarga } from '@/core/api/useCarga';
import {
  etiquetaEspecie,
  etiquetaPendiente,
  etiquetaSexo,
  etiquetaTamano,
  formatearEdad,
  formatearFecha,
  formatearPeso,
} from '@/core/formato.lib';
import type { Animal } from '@/core/modelos/animal';
import type { EstadoSalud, TipoDocumento } from '@/core/modelos/enums';
import { TIPOS_DOCUMENTO } from '@/features/publico/inscripcion/documento.lib';
import { etiquetaSalud } from '@/features/publico/etiqueta-salud.lib';
import { FormularioReporte } from '@/features/publico/FormularioReporte';
import { AccionesAnimal } from '@/features/seguimiento/AccionesAnimal';
import { Alerta } from '@/shared/ui/Alerta';
import { Boton, BotonEnlace } from '@/shared/ui/Boton';
import { Campo, Entrada, Selector } from '@/shared/ui/Campo';
import { EncabezadoPagina } from '@/shared/ui/EncabezadoPagina';
import { ErrorCarga } from '@/shared/ui/ErrorCarga';
import { Esqueleto } from '@/shared/ui/Esqueleto';
import { Etiqueta, EtiquetaEstado, type TonoEtiqueta } from '@/shared/ui/Etiqueta';
import { FotoAnimal } from '@/shared/ui/FotoAnimal';
import { Modal } from '@/shared/ui/Modal';
import { Tarjeta, TarjetaCuerpo, TarjetaEncabezado } from '@/shared/ui/Tarjeta';
import { useTitulo } from '@/shared/ui/useTitulo';
import { describirEvento } from './nombre-evento.lib';

function CompletarInformacion({
  animal,
  alCompletar,
}: {
  animal: Animal;
  alCompletar: () => void;
}) {
  const comunidades = useCarga(listarComunidades, []);
  const [comunidadId, setComunidadId] = useState<number | null>(animal.comunidad_id);
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('CC');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await actualizarAnimal(animal.id, {
        comunidad_id: comunidadId,
        tipo_documento: numeroDocumento.trim() === '' ? null : tipoDocumento,
        numero_documento: numeroDocumento.trim() === '' ? null : numeroDocumento.trim(),
      });
      alCompletar();
    } catch (err) {
      setError(mensajeError(err, 'No pudimos guardar los cambios. Inténtalo de nuevo.'));
      setEnviando(false);
    }
  }

  return (
    <Tarjeta destacada className="mb-8">
      <TarjetaEncabezado>
        <span className="font-semibold">Completar información</span>
      </TarjetaEncabezado>
      <TarjetaCuerpo>
        <form onSubmit={enviar} noValidate className="space-y-4">
          <p className="text-pequeno text-tinta-suave">
            Este registro quedó incompleto al cargarse. Completa lo que falte.
          </p>
          {animal.comunidad_id === null && (
            <Campo id="completar-comunidad" etiqueta="Comunidad que lo cuida">
              {(props) => (
                <Selector
                  {...props}
                  value={comunidadId ?? ''}
                  onChange={(e) =>
                    setComunidadId(e.target.value === '' ? null : Number(e.target.value))
                  }
                >
                  <option value="">Sin definir por ahora</option>
                  {(comunidades.datos ?? []).map((comunidad) => (
                    <option key={comunidad.id} value={comunidad.id}>
                      {comunidad.nombre}
                    </option>
                  ))}
                </Selector>
              )}
            </Campo>
          )}
          <div className="grid gap-4 sm:grid-cols-[auto,1fr]">
            <Campo id="completar-tipo-documento" etiqueta="Tipo de documento">
              {(props) => (
                <Selector
                  {...props}
                  value={tipoDocumento}
                  onChange={(e) => setTipoDocumento(e.target.value as TipoDocumento)}
                >
                  {TIPOS_DOCUMENTO.map((tipo) => (
                    <option key={tipo.valor} value={tipo.valor}>
                      {tipo.texto}
                    </option>
                  ))}
                </Selector>
              )}
            </Campo>
            <Campo
              id="completar-numero-documento"
              etiqueta="Número de documento de quien inscribe"
              ayuda="De la persona u organización responsable."
            >
              {(props) => (
                <Entrada
                  {...props}
                  value={numeroDocumento}
                  onChange={(e) => setNumeroDocumento(e.target.value)}
                />
              )}
            </Campo>
          </div>
          {error && <Alerta tipo="error">{error}</Alerta>}
          <Boton type="submit" cargando={enviando}>
            Guardar
          </Boton>
        </form>
      </TarjetaCuerpo>
    </Tarjeta>
  );
}

const TONO_SALUD: Record<EstadoSalud, TonoEtiqueta> = {
  BUENO: 'exito',
  REGULAR: 'aviso',
  MALO: 'error',
};

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="border-b border-black/10 pb-2">
      <dt className="text-minimo text-tinta-suave">{etiqueta}</dt>
      <dd className="text-cuerpo font-medium">{valor}</dd>
    </div>
  );
}

export default function PaginaFichaInterna() {
  const { id } = useParams();
  const numero = Number(id);
  const idValido = Number.isInteger(numero) && numero > 0;
  const [reporteAbierto, setReporteAbierto] = useState(false);

  const ficha = useCarga(async () => {
    if (!idValido) {
      throw new ErrorApi(404, null);
    }
    const [animal, historial, visitas, validaciones] = await Promise.all([
      obtenerAnimal(numero),
      obtenerHistorial(numero),
      obtenerVisitas(numero),
      obtenerValidaciones(numero),
    ]);
    return { animal, historial, visitas, validaciones };
  }, [numero, idValido]);
  useTitulo(ficha.datos ? `Ficha interna de ${ficha.datos.animal.nombre}` : 'Ficha interna');

  if (ficha.cargando) {
    return (
      <div className="contenedor space-y-4 py-10" role="status" aria-label="Cargando la ficha">
        <Esqueleto className="h-10 w-1/2" />
        <Esqueleto className="h-64 w-full" />
      </div>
    );
  }

  if (ficha.error instanceof ErrorApi && ficha.error.estado === 404) {
    return (
      <div className="contenedor max-w-[56ch] space-y-4 py-10">
        <h1 className="text-h1">No encontramos a este animal</h1>
        <p className="text-tinta-suave">
          Puede que el enlace tenga un error o que ya no esté registrado.
        </p>
        <BotonEnlace to="/mapa">Volver al mapa</BotonEnlace>
      </div>
    );
  }

  if (!ficha.datos) {
    return (
      <div className="contenedor py-10">
        <ErrorCarga titulo="No pudimos cargar la ficha" alReintentar={ficha.recargar} />
      </div>
    );
  }

  const { animal, historial, visitas, validaciones } = ficha.datos;
  const peso = (kilos: number | null) => formatearPeso(kilos);

  return (
    <div className="contenedor py-10">
      <EncabezadoPagina
        titulo={animal.nombre}
        migas={[{ texto: 'Mapa', a: '/mapa' }, { texto: animal.nombre }]}
        acciones={<AccionesAnimal animal={animal} alActualizar={ficha.recargar} />}
      />

      {animal.incompleto && (
        <CompletarInformacion animal={animal} alCompletar={ficha.recargar} />
      )}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,360px)_1fr]">
        <div className="space-y-4">
          <FotoAnimal
            ruta={animal.foto_principal}
            nombre={animal.nombre}
            especie={animal.especie}
            prioridad
            className="aspect-[4/5] w-full rounded-seccion shadow-medio"
          />
          <EtiquetaEstado estado={animal.estado} />
          {animal.estado === 'VBP_ACTIVO' && (
            <BotonEnlace to={`/vbp/${animal.id}`} variante="secundario" anchoCompleto>
              Ver ficha pública
            </BotonEnlace>
          )}
          {animal.codigo_collar && (
            <Boton
              variante="secundario"
              anchoCompleto
              onClick={() => setReporteAbierto(true)}
            >
              Reportar novedad
            </Boton>
          )}
        </div>

        <div className="space-y-8">
          {animal.descripcion && <p className="max-w-[62ch]">{animal.descripcion}</p>}

          <section aria-labelledby="titulo-datos">
            <h2 id="titulo-datos" className="text-h4">
              Datos
            </h2>
            <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
              <Dato etiqueta="Especie" valor={etiquetaEspecie(animal.especie)} />
              <Dato etiqueta="Sexo" valor={etiquetaSexo(animal.sexo)} />
              <Dato etiqueta="Tamaño" valor={etiquetaTamano(animal.tamano)} />
              <Dato etiqueta="Edad estimada" valor={formatearEdad(animal.edad_estimada)} />
              <Dato etiqueta="Barrio" valor={animal.barrio} />
              <Dato etiqueta="Inscrito" valor={formatearFecha(animal.fecha_inscripcion)} />
              <Dato etiqueta="Esterilizado" valor={animal.esterilizado ? 'Sí' : 'No'} />
              <Dato etiqueta="Microchip" valor={animal.numero_microchip ?? 'Sin microchip'} />
            </dl>
            {animal.observacion_comportamiento && (
              <p className="mt-4 max-w-[62ch] text-pequeno text-tinta-suave">
                <span className="font-semibold text-tinta">Comportamiento al inscribir: </span>
                {animal.observacion_comportamiento}
              </p>
            )}
          </section>

          <section aria-labelledby="titulo-validaciones" className="space-y-3">
            <h2 id="titulo-validaciones" className="text-h4">
              Validaciones veterinarias
            </h2>
            {validaciones.length === 0 ? (
              <p className="rounded border border-dashed border-lienzo-borde p-4 text-pequeno text-tinta-suave">
                Todavía no tiene validaciones.
              </p>
            ) : (
              validaciones.map((validacion) => (
                <Tarjeta key={validacion.id}>
                  <TarjetaEncabezado className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">{formatearFecha(validacion.fecha)}</span>
                    <Etiqueta tono={validacion.veredicto === 'APROBADO' ? 'exito' : 'aviso'}>
                      {validacion.veredicto === 'APROBADO' ? 'Aprobada' : 'Con pendientes'}
                    </Etiqueta>
                  </TarjetaEncabezado>
                  <TarjetaCuerpo className="space-y-1 text-pequeno">
                    <p>Veterinario: {validacion.veterinario}</p>
                    {validacion.pendientes.length > 0 && (
                      <p>Pendientes: {validacion.pendientes.map(etiquetaPendiente).join(', ')}.</p>
                    )}
                    {validacion.observaciones && <p>{validacion.observaciones}</p>}
                  </TarjetaCuerpo>
                </Tarjeta>
              ))
            )}
          </section>

          <section aria-labelledby="titulo-visitas" className="space-y-3">
            <h2 id="titulo-visitas" className="text-h4">
              Visitas de seguimiento
            </h2>
            {visitas.length === 0 ? (
              <p className="rounded border border-dashed border-lienzo-borde p-4 text-pequeno text-tinta-suave">
                Todavía no tiene visitas.
              </p>
            ) : (
              visitas.map((visita) => (
                <Tarjeta key={visita.id} destacada>
                  <TarjetaCuerpo className="space-y-2 text-pequeno">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-semibold">{formatearFecha(visita.fecha)}</span>
                      <Etiqueta tono={TONO_SALUD[visita.estado_salud]}>
                        {etiquetaSalud(visita.estado_salud)}
                      </Etiqueta>
                      {peso(visita.peso_kg) && (
                        <span className="text-tinta-suave">Pesó {peso(visita.peso_kg)}</span>
                      )}
                    </div>
                    <p>Comportamiento: {visita.estado_comportamiento}</p>
                    {visita.observaciones && <p>{visita.observaciones}</p>}
                    <p className="text-minimo text-tinta-suave">Registró {visita.responsable}</p>
                  </TarjetaCuerpo>
                </Tarjeta>
              ))
            )}
          </section>

          <section aria-labelledby="titulo-historial" className="space-y-3">
            <h2 id="titulo-historial" className="text-h4">
              Historial
            </h2>
            <ol className="space-y-4 border-l-2 border-verde/40 pl-5">
              {historial.map((evento) => {
                const descrito = describirEvento(evento.tipo_evento, evento.detalle);
                return (
                  <li key={evento.id}>
                    <p className="font-semibold">{descrito.titulo}</p>
                    {descrito.detalle && <p className="text-pequeno">{descrito.detalle}</p>}
                    <p className="text-minimo text-tinta-suave">
                      {formatearFecha(evento.fecha)} por {evento.usuario}
                    </p>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
      </div>

      {animal.codigo_collar && (
        <Modal
          abierto={reporteAbierto}
          titulo="Reportar novedad"
          alCerrar={() => setReporteAbierto(false)}
        >
          <FormularioReporte codigo={animal.codigo_collar} animal={animal.nombre} />
        </Modal>
      )}
    </div>
  );
}
