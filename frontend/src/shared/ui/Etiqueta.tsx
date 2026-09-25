import type { HTMLAttributes } from 'react';
import type { EstadoAnimal } from '@/core/modelos/enums';
import { estadoVisual } from '@/shared/estado-visual/estado-visual.lib';
import { cx } from './clases';
import { IconoEstadoAnimal } from './IconoEstado';

export type TonoEtiqueta = 'neutra' | 'info' | 'exito' | 'aviso' | 'error';

const TONOS: Record<TonoEtiqueta, string> = {
  neutra: 'bg-verde-profundo text-white',
  info: 'bg-azul text-white',
  exito: 'bg-verde-suave text-verde-tinta',
  aviso: 'bg-alerta-suave text-alerta-tinta',
  error: 'bg-peligro-suave text-peligro-tinta',
};

interface EtiquetaProps extends HTMLAttributes<HTMLSpanElement> {
  tono?: TonoEtiqueta;
}

export function Etiqueta({ tono = 'neutra', className, ...resto }: EtiquetaProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-minimo font-semibold',
        TONOS[tono],
        className,
      )}
      {...resto}
    />
  );
}

export function EtiquetaEstado({ estado, className }: { estado: EstadoAnimal; className?: string }) {
  const visual = estadoVisual(estado);
  return (
    <span
      className={cx(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-minimo font-semibold',
        className,
      )}
      style={{ color: visual.colorTexto, borderColor: visual.color, backgroundColor: `${visual.color}14` }}
    >
      <IconoEstadoAnimal icono={visual.icono} color={visual.color} tamano={16} />
      {visual.etiqueta}
    </span>
  );
}
