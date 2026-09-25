import { CircleAlert } from 'lucide-react';
import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cx } from './clases';

const CONTROL =
  'block w-full rounded border border-lienzo-borde bg-white px-4 py-3 text-cuerpo text-tinta ' +
  'placeholder:text-tinta-suave/70 transition-shadow focus:border-verde ' +
  'focus:shadow-[0_0_0_3px_rgba(113,157,21,0.2)] disabled:cursor-not-allowed disabled:bg-lienzo-gris';

const CONTROL_ERROR = 'border-peligro focus:border-peligro focus:shadow-[0_0_0_3px_rgba(220,53,69,0.2)]';

interface PropiedadesAccesibles {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
}

interface CampoProps {
  id: string;
  etiqueta: string;
  ayuda?: string;
  error?: string | null;
  obligatorio?: boolean;
  className?: string;
  children: (propiedades: PropiedadesAccesibles) => ReactNode;
}

export function Campo({ id, etiqueta, ayuda, error, obligatorio, className, children }: CampoProps) {
  const idAyuda = ayuda ? `${id}-ayuda` : undefined;
  const idError = error ? `${id}-error` : undefined;
  const descripcion = [idAyuda, idError].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cx('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="text-pequeno font-semibold text-tinta">
        {etiqueta}
        {obligatorio && (
          <span className="ml-1 text-peligro" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children({
        id,
        'aria-describedby': descripcion,
        'aria-invalid': error ? true : undefined,
        'aria-required': obligatorio || undefined,
      })}
      {ayuda && (
        <p id={idAyuda} className="text-minimo font-normal text-tinta-suave">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={idError} className="flex items-center gap-1 text-minimo text-peligro">
          <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

export const Entrada = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { invalido?: boolean }
>(function Entrada({ className, invalido, ...resto }, ref) {
  return (
    <input
      ref={ref}
      className={cx(CONTROL, (invalido || resto['aria-invalid']) && CONTROL_ERROR, className)}
      {...resto}
    />
  );
});

export const Selector = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { invalido?: boolean }
>(function Selector({ className, invalido, ...resto }, ref) {
  return (
    <select
      ref={ref}
      className={cx(CONTROL, (invalido || resto['aria-invalid']) && CONTROL_ERROR, className)}
      {...resto}
    />
  );
});

export const AreaTexto = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { invalido?: boolean }
>(function AreaTexto({ className, invalido, ...resto }, ref) {
  return (
    <textarea
      ref={ref}
      className={cx(
        CONTROL,
        'min-h-[6rem] resize-y',
        (invalido || resto['aria-invalid']) && CONTROL_ERROR,
        className,
      )}
      {...resto}
    />
  );
});

interface OpcionProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  tipo: 'checkbox' | 'radio';
  etiqueta: ReactNode;
}

export function Opcion({ tipo, etiqueta, className, id, ...resto }: OpcionProps) {
  return (
    <label
      htmlFor={id}
      className={cx('flex min-h-[44px] cursor-pointer items-center gap-3 text-cuerpo sm:min-h-0', className)}
    >
      <input
        id={id}
        type={tipo}
        className="h-5 w-5 shrink-0 cursor-pointer accent-verde-profundo"
        {...resto}
      />
      <span>{etiqueta}</span>
    </label>
  );
}
