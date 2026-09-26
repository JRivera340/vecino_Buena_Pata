import { Eye, EyeOff } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { iniciarSesion } from '@/core/api/autenticacion';
import { ErrorApi } from '@/core/api/cliente';
import { useSesion } from '@/core/sesion/sesion.store';
import { Alerta } from '@/shared/ui/Alerta';
import { Boton } from '@/shared/ui/Boton';
import { Campo, Entrada } from '@/shared/ui/Campo';
import { useTitulo } from '@/shared/ui/useTitulo';

interface EstadoDesde {
  desde?: string;
}

export default function PaginaIngreso() {
  useTitulo('Ingreso del personal');
  const sesion = useSesion((estado) => estado.sesion);
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [verClave, setVerClave] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [vacios, setVacios] = useState<{ usuario?: string; clave?: string }>({});

  if (sesion) {
    return <Navigate to="/mapa" replace />;
  }

  async function ingresar(evento: FormEvent) {
    evento.preventDefault();
    const nuevos: { usuario?: string; clave?: string } = {};
    if (usuario.trim() === '') {
      nuevos.usuario = 'Escribe tu usuario.';
    }
    if (clave === '') {
      nuevos.clave = 'Escribe tu contraseña.';
    }
    setVacios(nuevos);
    setMensaje(null);
    if (Object.keys(nuevos).length > 0) {
      return;
    }

    setEnviando(true);
    try {
      await iniciarSesion(usuario.trim(), clave);
      const destino = (ubicacion.state as EstadoDesde | null)?.desde ?? '/mapa';
      navegar(destino, { replace: true });
    } catch (error) {
      setMensaje(
        error instanceof ErrorApi && error.estado === 401
          ? 'El usuario o la contraseña no coinciden. Revísalos e inténtalo de nuevo.'
          : 'No pudimos iniciar tu sesión. Inténtalo de nuevo en un momento.',
      );
      setEnviando(false);
    }
  }

  return (
    <div className="contenedor py-10 lg:py-16">
      <div className="mx-auto grid max-w-[960px] overflow-hidden rounded-seccion border border-black/15 bg-white shadow-fuerte lg:grid-cols-[1fr_1fr]">
        <div className="hidden flex-col justify-end gap-3 bg-verde-profundo p-10 text-white lg:flex">
          <h2 className="text-h2 text-white">Ingreso del personal</h2>
          <p className="max-w-[34ch] text-white">
            Aquí trabajan las comunidades, los veterinarios, los líderes y los administradores del
            programa. Si buscas a un animal, el mapa público está abierto para todos.
          </p>
        </div>

        <form onSubmit={ingresar} noValidate className="space-y-5 p-6 sm:p-10">
          <div>
            <h1 className="text-h2">Ingresa a tu cuenta</h1>
            <p className="mt-1 text-pequeno text-tinta-suave">
              Usa el usuario que te dio el equipo del programa.
            </p>
          </div>

          <Campo id="usuario" etiqueta="Usuario" obligatorio error={vacios.usuario}>
            {(p) => (
              <Entrada
                {...p}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={usuario}
                onChange={(evento) => setUsuario(evento.target.value)}
              />
            )}
          </Campo>

          <Campo id="clave" etiqueta="Contraseña" obligatorio error={vacios.clave}>
            {(p) => (
              <div className="relative">
                <Entrada
                  {...p}
                  type={verClave ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="pr-12"
                  value={clave}
                  onChange={(evento) => setClave(evento.target.value)}
                />
                <button
                  type="button"
                  aria-pressed={verClave}
                  aria-label={verClave ? 'Ocultar la contraseña' : 'Mostrar la contraseña'}
                  onClick={() => setVerClave((actual) => !actual)}
                  className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded text-tinta-suave hover:text-tinta"
                >
                  {verClave ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            )}
          </Campo>

          {mensaje && <Alerta tipo="error">{mensaje}</Alerta>}

          <Boton type="submit" cargando={enviando} tamano="grande" anchoCompleto>
            {enviando ? 'Ingresando' : 'Ingresar'}
          </Boton>
        </form>
      </div>
    </div>
  );
}
