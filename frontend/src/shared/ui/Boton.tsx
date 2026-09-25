import { LoaderCircle } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cx } from './clases';

export type VarianteBoton = 'primario' | 'secundario' | 'fantasma' | 'peligro' | 'claro' | 'contornoClaro';
export type TamanoBoton = 'pequeno' | 'mediano' | 'grande';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded font-semibold no-underline ' +
  'transition-all duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50 ' +
  'min-h-[44px] sm:min-h-0';

const VARIANTES: Record<VarianteBoton, string> = {
  primario:
    'bg-verde-profundo text-white hover:bg-verde-oscuro active:bg-[#374815] active:shadow-inner',
  secundario:
    'border-2 border-verde-profundo bg-transparent text-verde-profundo ' +
    'hover:bg-verde-profundo hover:text-white',
  fantasma: 'bg-transparent text-azul hover:bg-azul/10',
  peligro: 'bg-peligro text-white hover:bg-peligro-oscuro',
  claro: 'bg-white text-verde-tinta hover:bg-verde-tenue',
  contornoClaro: 'border-2 border-white bg-transparent text-white hover:bg-white hover:text-verde-tinta',
};

const TAMANOS: Record<TamanoBoton, string> = {
  pequeno: 'sm:h-8 px-4 text-pequeno',
  mediano: 'sm:h-10 px-5 text-cuerpo',
  grande: 'sm:h-12 px-6 text-h6',
};

interface EstiloBoton {
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
  anchoCompleto?: boolean;
  movilCompleto?: boolean;
  className?: string;
}

export function estilosBoton({
  variante = 'primario',
  tamano = 'mediano',
  anchoCompleto,
  movilCompleto,
  className,
}: EstiloBoton): string {
  return cx(
    BASE,
    VARIANTES[variante],
    TAMANOS[tamano],
    anchoCompleto && 'w-full',
    movilCompleto && 'w-full sm:w-auto',
    className,
  );
}

interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement>, EstiloBoton {
  cargando?: boolean;
  icono?: ReactNode;
}

export function Boton({
  variante,
  tamano,
  anchoCompleto,
  movilCompleto,
  className,
  cargando = false,
  icono,
  children,
  disabled,
  type = 'button',
  ...resto
}: BotonProps) {
  return (
    <button
      type={type}
      className={estilosBoton({ variante, tamano, anchoCompleto, movilCompleto, className })}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      {...resto}
    >
      {cargando ? (
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        icono
      )}
      {children}
    </button>
  );
}

interface BotonEnlaceProps extends LinkProps, EstiloBoton {
  icono?: ReactNode;
}

export function BotonEnlace({
  variante,
  tamano,
  anchoCompleto,
  movilCompleto,
  className,
  icono,
  children,
  ...resto
}: BotonEnlaceProps) {
  return (
    <Link
      className={estilosBoton({ variante, tamano, anchoCompleto, movilCompleto, className })}
      {...resto}
    >
      {icono}
      {children}
    </Link>
  );
}
