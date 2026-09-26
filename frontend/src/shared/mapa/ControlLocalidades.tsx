import { MapPin, Search } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { cx } from '@/shared/ui/clases';
import { filtrarNombres } from './localidades.lib';

interface ControlLocalidadesProps {
  nombres: string[];
  seleccionada: string | null;
  alElegir: (nombre: string | null) => void;
}

// Las localidades dibujadas en el mapa no se pueden alcanzar con el teclado, así que esta lista
// es el equivalente accesible: buscar, moverse con las flechas y elegir con Enter.
export function ControlLocalidades({ nombres, seleccionada, alElegir }: ControlLocalidadesProps) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const idPanel = useId();
  const boton = useRef<HTMLButtonElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const lista = useRef<HTMLUListElement>(null);
  const visibles = useMemo(() => filtrarNombres(nombres, busqueda), [nombres, busqueda]);

  useEffect(() => {
    if (abierto) {
      campo.current?.focus();
    }
  }, [abierto]);

  const cerrar = () => {
    setAbierto(false);
    setBusqueda('');
    boton.current?.focus();
  };

  const moverFoco = (evento: KeyboardEvent, direccion: 1 | -1) => {
    evento.preventDefault();
    const botones = Array.from(lista.current?.querySelectorAll<HTMLButtonElement>('button') ?? []);
    const actual = botones.indexOf(document.activeElement as HTMLButtonElement);
    const siguiente =
      actual === -1 ? (direccion === 1 ? 0 : botones.length - 1) : actual + direccion;
    if (siguiente >= 0 && siguiente < botones.length) {
      botones[siguiente].focus();
    } else if (siguiente < 0) {
      campo.current?.focus();
    }
  };

  const alTeclear = (evento: KeyboardEvent) => {
    if (evento.key === 'Escape') {
      evento.stopPropagation();
      cerrar();
    } else if (evento.key === 'ArrowDown') {
      moverFoco(evento, 1);
    } else if (evento.key === 'ArrowUp') {
      moverFoco(evento, -1);
    }
  };

  return (
    <div role="presentation" className="relative" onKeyDown={alTeclear}>
      <button
        ref={boton}
        type="button"
        aria-expanded={abierto}
        aria-controls={abierto ? idPanel : undefined}
        onClick={() => (abierto ? cerrar() : setAbierto(true))}
        className="flex min-h-[44px] items-center gap-2 rounded bg-white px-3 text-pequeno font-semibold text-tinta shadow-medio hover:bg-verde-tenue sm:min-h-[36px]"
      >
        <MapPin className="h-4 w-4" aria-hidden="true" />
        <span className="max-w-[22ch] truncate">
          Localidades{seleccionada ? `: ${seleccionada}` : ''}
        </span>
      </button>

      {abierto && (
        <div
          id={idPanel}
          role="group"
          aria-label="Localidades de Bogotá"
          className="absolute right-0 z-[600] mt-2 w-64 rounded-tarjeta border border-black/15 bg-white p-3 shadow-fuerte"
        >
          <label htmlFor={`${idPanel}-buscar`} className="solo-lectores">
            Buscar una localidad
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-suave"
              aria-hidden="true"
            />
            <input
              id={`${idPanel}-buscar`}
              ref={campo}
              type="search"
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Buscar una localidad"
              className="block w-full rounded border border-lienzo-borde py-2 pl-9 pr-3 text-pequeno"
            />
          </div>
          <ul ref={lista} className="mt-2 max-h-64 overflow-y-auto" aria-label="Resultados">
            {visibles.map((nombre) => {
              const activa = nombre === seleccionada;
              return (
                <li key={nombre}>
                  <button
                    type="button"
                    aria-pressed={activa}
                    onClick={() => {
                      alElegir(activa ? null : nombre);
                      cerrar();
                    }}
                    className={cx(
                      'flex min-h-[44px] w-full items-center rounded px-3 text-left text-pequeno hover:bg-verde-tenue sm:min-h-[36px]',
                      activa && 'bg-[#fdf1c4] font-semibold',
                    )}
                  >
                    {nombre}
                  </button>
                </li>
              );
            })}
            {visibles.length === 0 && (
              <li className="px-3 py-2 text-pequeno text-tinta-suave">
                Ninguna localidad coincide.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
