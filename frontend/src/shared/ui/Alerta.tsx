import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cx } from './clases';

export type TipoAlerta = 'info' | 'exito' | 'advertencia' | 'error';

const ESTILOS = {
  info: { caja: 'border-azul bg-azul-suave text-azul-tinta', Icono: Info },
  exito: { caja: 'border-verde bg-verde-suave text-verde-tinta', Icono: CircleCheck },
  advertencia: { caja: 'border-alerta bg-alerta-suave text-alerta-tinta', Icono: TriangleAlert },
  error: { caja: 'border-peligro bg-peligro-suave text-peligro-tinta', Icono: CircleAlert },
} as const;

interface AlertaProps {
  tipo?: TipoAlerta;
  titulo?: string;
  alCerrar?: () => void;
  className?: string;
  children: ReactNode;
}

export function Alerta({ tipo = 'info', titulo, alCerrar, className, children }: AlertaProps) {
  const { caja, Icono } = ESTILOS[tipo];
  return (
    <div
      role={tipo === 'error' ? 'alert' : 'status'}
      className={cx('flex items-start gap-3 rounded border-l-4 px-5 py-4', caja, className)}
    >
      <Icono className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="flex-1 text-pequeno">
        {titulo && <p className="font-semibold">{titulo}</p>}
        <div>{children}</div>
      </div>
      {alCerrar && (
        <button
          type="button"
          onClick={alCerrar}
          aria-label="Cerrar aviso"
          className="-m-2 flex h-11 w-11 items-center justify-center rounded hover:bg-black/5 sm:h-8 sm:w-8"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
