import { useState, type FormEvent } from 'react';
import { ErrorApi } from '@/core/api/cliente';
import { crearReportePublico } from '@/core/api/publico';
import { Alerta } from '@/shared/ui/Alerta';
import { Boton } from '@/shared/ui/Boton';
import { AreaTexto, Campo, Entrada } from '@/shared/ui/Campo';
import { Tarjeta, TarjetaCuerpo } from '@/shared/ui/Tarjeta';

const MAXIMO_DESCRIPCION = 1000;

interface Errores {
  nombre?: string;
  descripcion?: string;
}

export function FormularioReporte({ codigo, animal }: { codigo: string; animal: string }) {
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
