import { LogOut, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cerrarSesion } from '@/core/api/autenticacion';
import { useSesion } from '@/core/sesion/sesion.store';
import { Boton, BotonEnlace } from '@/shared/ui/Boton';
import { cx } from '@/shared/ui/clases';
import { useTrampaFoco } from '@/shared/ui/useTrampaFoco';
import { Marca } from './Marca';
import { ENLACES_PUBLICOS, enlacesGestion } from './navegacion.lib';

const ENLACE =
  'relative flex min-h-[44px] items-center border-b-2 border-transparent px-1 text-cuerpo font-medium ' +
  'text-tinta transition-colors hover:text-verde-profundo lg:min-h-0 lg:py-[22px]';
const ENLACE_ACTIVO = '!border-verde !text-verde-profundo';

export function Encabezado() {
  const sesion = useSesion((estado) => estado.sesion);
  const navegar = useNavigate();
  const { pathname, hash } = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const refMenu = useTrampaFoco(menuAbierto, () => setMenuAbierto(false));

  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname, hash]);

  const enlaces = sesion ? enlacesGestion(sesion.rol) : ENLACES_PUBLICOS;

  function salir() {
    cerrarSesion();
    setMenuAbierto(false);
    navegar('/ingreso');
  }

  const listaEnlaces = (
    <ul className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-6">
      {enlaces.map((enlace) => (
        <li key={enlace.a}>
          <NavLink
            to={enlace.a}
            end={enlace.a === '/'}
            className={({ isActive }) =>
              cx(ENLACE, isActive && !enlace.a.includes('#') && ENLACE_ACTIVO)
            }
          >
            {enlace.texto}
          </NavLink>
        </li>
      ))}
    </ul>
  );

  const accion = sesion ? (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <span className="text-pequeno text-tinta-suave">{sesion.nombre}</span>
      <Boton variante="secundario" tamano="pequeno" onClick={salir} icono={<LogOut className="h-4 w-4" />}>
        Salir
      </Boton>
    </div>
  ) : (
    <BotonEnlace to="/ingreso" tamano="pequeno" variante="primario">
      Ingresar
    </BotonEnlace>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-white shadow-sutil">
      <div className="contenedor flex h-16 items-center justify-between gap-6">
        <Link to={sesion ? '/mapa' : '/'} aria-label="Vecino Buena Pata, ir al inicio">
          <Marca />
        </Link>

        <nav aria-label="Principal" className="hidden lg:block">
          {listaEnlaces}
        </nav>

        <div className="hidden lg:block">{accion}</div>

        <button
          type="button"
          className="-mr-2 flex h-11 w-11 items-center justify-center rounded text-tinta hover:bg-lienzo-gris lg:hidden"
          aria-label="Abrir el menú"
          aria-expanded={menuAbierto}
          aria-controls="menu-movil"
          onClick={() => setMenuAbierto(true)}
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>

      {menuAbierto && (
        <div
          role="presentation"
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) {
              setMenuAbierto(false);
            }
          }}
        >
          <div
            id="menu-movil"
            ref={refMenu}
            role="dialog"
            aria-modal="true"
            aria-label="Menú"
            tabIndex={-1}
            className="ml-auto flex h-full w-[85vw] max-w-[320px] animate-deslizar flex-col gap-6 bg-white p-6 shadow-fuerte"
          >
            <div className="flex items-center justify-between">
              <Marca />
              <button
                type="button"
                className="-mr-2 flex h-11 w-11 items-center justify-center rounded hover:bg-lienzo-gris"
                aria-label="Cerrar el menú"
                onClick={() => setMenuAbierto(false)}
              >
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <nav aria-label="Principal">{listaEnlaces}</nav>
            <div className="mt-auto">{accion}</div>
          </div>
        </div>
      )}
    </header>
  );
}
