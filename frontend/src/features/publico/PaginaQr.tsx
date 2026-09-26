import { useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { ErrorApi } from '@/core/api/cliente';
import { crearReportePublico, obtenerAnimalPorCodigo } from '@/core/api/publico';
import { useCarga } from '@/core/api/useCarga';
import { etiquetaEspecie, etiquetaSexo, etiquetaTamano } from '@/core/formato.lib';
import { Alerta } from '@/shared/ui/Alerta';
import { Boton, BotonEnlace } from '@/shared/ui/Boton';
import { AreaTexto, Campo, Entrada } from '@/shared/ui/Campo';
import { Esqueleto } from '@/shared/ui/Esqueleto';
import { FotoAnimal } from '@/shared/ui/FotoAnimal';
import { Tarjeta, TarjetaCuerpo } from '@/shared/ui/Tarjeta';
import { useTitulo } from '@/shared/ui/useTitulo';

const MAXIMO_DESCRIPCION = 1000;

interface Errores {
  nombre?: string;
  descripcion?: string;
}

function FormularioReporte({ codigo, animal }: { codigo: string; animal: string }) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [errores, setErrores] = useState<Errores>({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [falloEnvio, setFalloEnvio] = useState<string | null>(null);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const nuevos: Errores = {};
    if (nombre.trim() === '') {
      nuevos.nombre = 'Escribe tu nombre para que sepamos quién avisa.';
    }
    if (descripcion.trim() === '') {
      nuevos.descripcion = 'Cuéntanos qué observaste.';
    }
    setErrores(nuevos);
    setFalloEnvio(null);
    if (Object.keys(nuevos).length > 0) {
      return;
    }

    setEnviando(true);
    try {
      await crearReportePublico(codigo, {
        reportante_nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        foto: null,
        latitud: null,
        longitud: null,
      });
      setEnviado(true);
    } catch (error) {
      setFalloEnvio(
        error instanceof ErrorApi && error.estado === 404
          ? 'Este código ya no está activo, así que no pudimos recibir el reporte.'
          : 'No pudimos enviar tu reporte. Inténtalo de nuevo en un momento.',
      );
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <Alerta tipo="exito" titulo="Gracias, recibimos tu reporte">
        El equipo del programa lo va a revisar y se pondrá en contacto con quien cuida a {animal}.
      </Alerta>
    );
  }

  return (
    <Tarjeta>
      <TarjetaCuerpo>
        <form onSubmit={enviar} noValidate className="space-y-5">
          <div>
            <h2 className="text-h4">Reportar una novedad</h2>
            <p className="mt-1 max-w-[52ch] text-pequeno text-tinta-suave">
              Si ves a {animal} enfermo, herido o en peligro, cuéntanos qué pasó y dónde.
            </p>
          </div>

          <Campo id="reportante" etiqueta="Tu nombre" obligatorio error={errores.nombre}>
            {(p) => (
              <Entrada
                {...p}
                autoComplete="name"
                maxLength={120}
                value={nombre}
                onChange={(evento) => setNombre(evento.target.value)}
              />
            )}
          </Campo>

          <Campo
            id="descripcion"
            etiqueta="Qué observaste"
            obligatorio
            error={errores.descripcion}
            ayuda={`${descripcion.length} de ${MAXIMO_DESCRIPCION} caracteres`}
          >
            {(p) => (
              <AreaTexto
                {...p}
                maxLength={MAXIMO_DESCRIPCION}
                value={descripcion}
                onChange={(evento) => setDescripcion(evento.target.value)}
              />
            )}
          </Campo>

          {falloEnvio && <Alerta tipo="error">{falloEnvio}</Alerta>}

          <Boton type="submit" cargando={enviando} tamano="grande" movilCompleto>
            {enviando ? 'Enviando el reporte' : 'Enviar reporte'}
          </Boton>
        </form>
      </TarjetaCuerpo>
    </Tarjeta>
  );
}

export default function PaginaQr() {
  const { codigo = '' } = useParams();
  const { datos: animal, cargando, error } = useCarga(() => obtenerAnimalPorCodigo(codigo), [codigo]);
  useTitulo(animal ? `Ficha de ${animal.nombre}` : 'Código del collar');

  if (cargando) {
    return (
      <div className="contenedor max-w-[720px] space-y-4 py-10" role="status" aria-label="Cargando la ficha">
        <Esqueleto className="h-56 w-full" />
        <Esqueleto className="h-8 w-1/2" />
      </div>
    );
  }

  if (!animal) {
    const noExiste = error instanceof ErrorApi && error.estado === 404;
    return (
      <div className="contenedor max-w-[56ch] space-y-4 py-14">
        <h1 className="text-h1">{noExiste ? 'No encontramos este código' : 'No pudimos abrir la ficha'}</h1>
        <p className="text-tinta-suave">
          {noExiste
            ? 'Revisa que el código del collar esté bien leído. Si el problema sigue, avísale a quien te lo compartió.'
            : 'Revisa tu conexión e inténtalo de nuevo.'}
        </p>
        <BotonEnlace to="/" tamano="grande">
          Ir al mapa
        </BotonEnlace>
      </div>
    );
  }

  return (
    <div className="contenedor max-w-[720px] space-y-8 py-10">
      <article className="overflow-hidden rounded-seccion border border-black/15 bg-white shadow-sutil">
        <FotoAnimal
          ruta={animal.foto_principal}
          nombre={animal.nombre}
          especie={animal.especie}
          prioridad
          className="aspect-[16/10] w-full"
        />
        <div className="space-y-2 p-6">
          <h1 className="text-h1">{animal.nombre}</h1>
          <p className="text-tinta-suave">
            {etiquetaEspecie(animal.especie)} {etiquetaSexo(animal.sexo).toLowerCase()} de tamaño{' '}
            {etiquetaTamano(animal.tamano).toLowerCase()}, del barrio {animal.barrio}.
          </p>
          {animal.descripcion && <p className="max-w-[62ch]">{animal.descripcion}</p>}
          <p className="pt-2 text-pequeno font-semibold text-verde-tinta">
            Vecino Buena Pata del programa de la Alcaldía Local de Santa Fe
          </p>
        </div>
      </article>

      <FormularioReporte codigo={codigo} animal={animal.nombre} />
    </div>
  );
}
