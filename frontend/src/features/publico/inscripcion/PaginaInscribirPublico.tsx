import { CircleCheck } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ErrorApi } from '@/core/api/cliente';
import {
  inscribirComoPublico,
  listarComunidadesPublicas,
  verificarInscriptor,
} from '@/core/api/inscripcion-publica';
import { mensajeError } from '@/core/api/mensaje-error';
import { useCarga } from '@/core/api/useCarga';
import type { Especie, Sexo, Tamano, TipoDocumento } from '@/core/modelos/enums';
import type { AnimalDeInscriptor, InscripcionPublicaRespuesta } from '@/core/modelos/inscripcion';
import { MapaTerritorio, type UbicacionSeleccionada } from '@/shared/mapa/MapaTerritorio';
import { Alerta } from '@/shared/ui/Alerta';
import { Boton, BotonEnlace } from '@/shared/ui/Boton';
import { AreaTexto, Campo, Entrada, Opcion, Selector } from '@/shared/ui/Campo';
import { EncabezadoPagina } from '@/shared/ui/EncabezadoPagina';
import { useTitulo } from '@/shared/ui/useTitulo';
import { AvisoInscripcionesPrevias } from './AvisoInscripcionesPrevias';
import { TIPOS_DOCUMENTO, validarDocumento } from './documento.lib';
import {
  armarEnvioInscripcionPublica,
  validarInscripcionPublica,
  type ErroresInscripcionPublica,
} from './inscripcion-publica.lib';

type Paso = 'documento' | 'datos' | 'listo';

const MENSAJE_LIMITE = 'Hiciste muchas consultas seguidas. Espera un minuto e inténtalo de nuevo.';

export default function PaginaInscribirPublico() {
  useTitulo('Inscribir un animal');
  const comunidades = useCarga(listarComunidadesPublicas, []);
  const [paso, setPaso] = useState<Paso>('documento');
  const encabezado = useRef<HTMLDivElement>(null);

  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('CC');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [errorDocumento, setErrorDocumento] = useState<string | null>(null);
  const [consultando, setConsultando] = useState(false);
  const [previos, setPrevios] = useState<AnimalDeInscriptor[] | null>(null);

  const [nombrePersona, setNombrePersona] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [nombre, setNombre] = useState('');
  const [especie, setEspecie] = useState<Especie>('PERRO');
  const [sexo, setSexo] = useState<Sexo>('MACHO');
  const [tamano, setTamano] = useState<Tamano>('MEDIANO');
  const [edad, setEdad] = useState('');
  const [barrio, setBarrio] = useState('');
  const [comunidadId, setComunidadId] = useState<number | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [ubicacion, setUbicacion] = useState<UbicacionSeleccionada | null>(null);
  const [aceptaDatos, setAceptaDatos] = useState(false);
  const [sitioWeb, setSitioWeb] = useState('');
  const [errores, setErrores] = useState<ErroresInscripcionPublica>({});
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<InscripcionPublicaRespuesta | null>(null);

  useEffect(() => {
    encabezado.current?.focus();
  }, [paso]);

  async function consultarDocumento(evento: FormEvent) {
    evento.preventDefault();
    const error = validarDocumento(numeroDocumento);
    setErrorDocumento(error);
    if (error) {
      return;
    }
    setConsultando(true);
    try {
      const respuesta = await verificarInscriptor({
        tipo_documento: tipoDocumento,
        numero_documento: numeroDocumento,
      });
      setPrevios(respuesta.animales);
      if (respuesta.total === 0) {
        setPaso('datos');
      }
    } catch (fallo) {
      setErrorDocumento(
        fallo instanceof ErrorApi && fallo.estado === 429
          ? MENSAJE_LIMITE
          : mensajeError(fallo, 'No pudimos consultar el documento. Inténtalo de nuevo.'),
      );
    } finally {
      setConsultando(false);
    }
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const formulario = {
      tipoDocumento,
      numeroDocumento,
      nombrePersona,
      telefono,
      correo,
      aceptaDatos,
      nombre,
      especie,
      sexo,
      tamano,
      edadEstimada: edad,
      descripcion,
      barrio,
      comunidadId,
      ubicacion,
      foto,
      sitioWeb,
    };
    const nuevos = validarInscripcionPublica(formulario);
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) {
      return;
    }
    setEnviando(true);
    setErrorEnvio(null);
    try {
      setResultado(await inscribirComoPublico(armarEnvioInscripcionPublica(formulario)));
      setPaso('listo');
    } catch (fallo) {
      setErrorEnvio(
        fallo instanceof ErrorApi && fallo.estado === 429
          ? 'Ya enviaste varias inscripciones seguidas. Inténtalo de nuevo más tarde.'
          : mensajeError(fallo, 'No pudimos enviar la inscripción. Inténtalo de nuevo.'),
      );
    } finally {
      setEnviando(false);
    }
  }

  const titulos: Record<Paso, string> = {
    documento: 'Primero, tu documento',
    datos: 'Cuéntanos del animal',
    listo: 'Recibimos la inscripción',
  };

  return (
    <div className="contenedor max-w-[860px] py-10">
      <EncabezadoPagina
        titulo="Inscribir un animal"
        descripcion="Cualquier persona puede inscribir a un perro o gato del barrio, sin crear una cuenta. Un veterinario lo revisa después."
        migas={[{ texto: 'Inicio', a: '/' }, { texto: 'Inscribir un animal' }]}
      />

      <div ref={encabezado} tabIndex={-1} className="mb-6 outline-none">
        <p className="text-pequeno text-tinta-suave" aria-live="polite">
          {paso === 'documento' && 'Paso 1 de 2'}
          {paso === 'datos' && 'Paso 2 de 2'}
        </p>
        <h2 className="text-h3">{titulos[paso]}</h2>
      </div>

      {paso === 'documento' && (
        <div className="space-y-6">
          <form
            onSubmit={consultarDocumento}
            noValidate
            className="grid gap-4 sm:grid-cols-[14rem_1fr_auto] sm:items-end"
          >
            <Campo id="doc-tipo" etiqueta="Tipo de documento" obligatorio>
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
              id="doc-numero"
              etiqueta="Número de documento"
              obligatorio
              ayuda="Con o sin puntos. Lo usamos para saber si ya registraste otros animales."
              error={errorDocumento}
            >
              {(props) => (
                <Entrada
                  {...props}
                  inputMode="text"
                  autoComplete="off"
                  value={numeroDocumento}
                  onChange={(e) => {
                    setNumeroDocumento(e.target.value);
                    setPrevios(null);
                  }}
                />
              )}
            </Campo>
            {previos === null && (
              <Boton type="submit" cargando={consultando} movilCompleto>
                Continuar
              </Boton>
            )}
          </form>

          {previos !== null && previos.length > 0 && (
            <div className="space-y-6">
              <AvisoInscripcionesPrevias animales={previos} />
              <div className="flex flex-wrap gap-3">
                <Boton onClick={() => setPaso('datos')}>Es un animal distinto, continuar</Boton>
                <BotonEnlace to="/" variante="secundario">
                  Cancelar
                </BotonEnlace>
              </div>
            </div>
          )}
        </div>
      )}

      {paso === 'datos' && (
        <form onSubmit={enviar} noValidate className="space-y-10">
          <fieldset className="space-y-4">
            <legend className="text-h5">Tus datos</legend>
            <Campo
              id="pub-nombre-persona"
              etiqueta="Nombre completo"
              obligatorio
              error={errores.nombrePersona}
            >
              {(props) => (
                <Entrada
                  {...props}
                  autoComplete="name"
                  value={nombrePersona}
                  onChange={(e) => setNombrePersona(e.target.value)}
                />
              )}
            </Campo>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo id="pub-telefono" etiqueta="Teléfono" obligatorio error={errores.telefono}>
                {(props) => (
                  <Entrada
                    {...props}
                    type="tel"
                    autoComplete="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                  />
                )}
              </Campo>
              <Campo
                id="pub-correo"
                etiqueta="Correo"
                obligatorio
                error={errores.correo}
                ayuda="Ahí te enviamos la confirmación."
              >
                {(props) => (
                  <Entrada
                    {...props}
                    type="email"
                    autoComplete="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                  />
                )}
              </Campo>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-h5">El animal</legend>
            <Campo id="pub-nombre" etiqueta="Nombre del animal" obligatorio error={errores.nombre}>
              {(props) => (
                <Entrada {...props} value={nombre} onChange={(e) => setNombre(e.target.value)} />
              )}
            </Campo>
            <div className="grid gap-4 sm:grid-cols-3">
              <Campo id="pub-especie" etiqueta="Especie" obligatorio>
                {(props) => (
                  <Selector
                    {...props}
                    value={especie}
                    onChange={(e) => setEspecie(e.target.value as Especie)}
                  >
                    <option value="PERRO">Perro</option>
                    <option value="GATO">Gato</option>
                  </Selector>
                )}
              </Campo>
              <Campo id="pub-sexo" etiqueta="Sexo" obligatorio>
                {(props) => (
                  <Selector
                    {...props}
                    value={sexo}
                    onChange={(e) => setSexo(e.target.value as Sexo)}
                  >
                    <option value="MACHO">Macho</option>
                    <option value="HEMBRA">Hembra</option>
                  </Selector>
                )}
              </Campo>
              <Campo id="pub-tamano" etiqueta="Tamaño" obligatorio>
                {(props) => (
                  <Selector
                    {...props}
                    value={tamano}
                    onChange={(e) => setTamano(e.target.value as Tamano)}
                  >
                    <option value="PEQUENO">Pequeño</option>
                    <option value="MEDIANO">Mediano</option>
                    <option value="GRANDE">Grande</option>
                  </Selector>
                )}
              </Campo>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo
                id="pub-edad"
                etiqueta="Edad estimada en años"
                ayuda="Opcional. Escribe 0 si es menor de un año."
                error={errores.edad}
              >
                {(props) => (
                  <Entrada
                    {...props}
                    inputMode="numeric"
                    value={edad}
                    onChange={(e) => setEdad(e.target.value)}
                  />
                )}
              </Campo>
              <Campo id="pub-barrio" etiqueta="Barrio" obligatorio error={errores.barrio}>
                {(props) => (
                  <Entrada {...props} value={barrio} onChange={(e) => setBarrio(e.target.value)} />
                )}
              </Campo>
            </div>
            <Campo
              id="pub-comunidad"
              etiqueta="Comunidad que lo acompaña"
              obligatorio
              error={errores.comunidad}
              ayuda="El grupo, junta o fundación que representa a este animal. Su líder podrá hacerle seguimiento."
            >
              {(props) => (
                <Selector
                  {...props}
                  value={comunidadId ?? ''}
                  onChange={(e) =>
                    setComunidadId(e.target.value === '' ? null : Number(e.target.value))
                  }
                >
                  <option value="">
                    {comunidades.cargando ? 'Cargando comunidades...' : 'Elige una comunidad'}
                  </option>
                  {(comunidades.datos ?? []).map((comunidad) => (
                    <option key={comunidad.id} value={comunidad.id}>
                      {comunidad.nombre} ({comunidad.barrio})
                    </option>
                  ))}
                </Selector>
              )}
            </Campo>
            <Campo
              id="pub-descripcion"
              etiqueta="Descripción"
              ayuda="Opcional. Cómo es, cómo lo reconocen."
            >
              {(props) => (
                <AreaTexto
                  {...props}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              )}
            </Campo>
            <Campo
              id="pub-foto"
              etiqueta="Foto"
              obligatorio
              error={errores.foto}
              ayuda="JPG, PNG o WEBP de hasta 10 MB."
            >
              {(props) => (
                <Entrada
                  {...props}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
                />
              )}
            </Campo>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-h5">Dónde vive</legend>
            <p className="text-pequeno text-tinta-suave">
              Toca el mapa para marcar el punto donde suele estar.
            </p>
            <div className="overflow-hidden rounded-tarjeta border border-black/15">
              <MapaTerritorio
                seleccionable
                altura="360px"
                zoom={13}
                descripcion="Mapa para marcar dónde vive el animal"
                alSeleccionarUbicacion={setUbicacion}
              />
            </div>
            {ubicacion && (
              <p className="text-minimo text-tinta-suave">
                Punto marcado: {ubicacion.lat.toFixed(5)}, {ubicacion.lng.toFixed(5)}
              </p>
            )}
            {errores.ubicacion && (
              <p role="alert" className="text-minimo text-peligro">
                {errores.ubicacion}
              </p>
            )}
          </fieldset>

          <div className="space-y-2">
            <Opcion
              id="pub-acepta"
              tipo="checkbox"
              checked={aceptaDatos}
              onChange={(e) => setAceptaDatos(e.target.checked)}
              etiqueta={
                <>
                  Autorizo el tratamiento de mis datos personales según la Ley 1581 de 2012 y la{' '}
                  <Link
                    to="/politica-de-datos"
                    target="_blank"
                    className="font-semibold text-azul underline"
                  >
                    política de tratamiento de datos
                  </Link>
                  .
                </>
              }
            />
            {errores.aceptaDatos && (
              <p role="alert" className="text-minimo text-peligro">
                {errores.aceptaDatos}
              </p>
            )}
          </div>

          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label htmlFor="pub-sitio-web">Sitio web (déjalo vacío)</label>
            <input
              id="pub-sitio-web"
              name="sitio_web"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={sitioWeb}
              onChange={(e) => setSitioWeb(e.target.value)}
            />
          </div>

          {errorEnvio && <Alerta tipo="error">{errorEnvio}</Alerta>}
          <div className="flex flex-wrap gap-3">
            <Boton type="submit" tamano="grande" cargando={enviando} movilCompleto>
              Enviar inscripción
            </Boton>
            <Boton
              variante="secundario"
              tamano="grande"
              onClick={() => setPaso('documento')}
              movilCompleto
            >
              Volver
            </Boton>
          </div>
        </form>
      )}

      {paso === 'listo' && resultado && (
        <div className="space-y-6">
          <Alerta tipo="exito" titulo="Inscripción enviada">
            <p className="flex items-start gap-2">
              <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                {resultado.nombre} quedó como candidato. Te enviaremos la confirmación al correo que
                escribiste.
              </span>
            </p>
          </Alerta>
          <p>
            Tu número de radicado es <strong className="text-h5">{resultado.radicado}</strong>.
            Guárdalo por si necesitas consultar el trámite.
          </p>
          <p className="max-w-[62ch] text-tinta-suave">
            Lo que sigue: un veterinario revisará al animal. Si cumple los criterios del programa
            (esterilización, microchip y buena convivencia), el líder de la comunidad lo formaliza y
            recibe su collar con código QR.
          </p>
          <BotonEnlace to="/">Volver al inicio</BotonEnlace>
        </div>
      )}
    </div>
  );
}
