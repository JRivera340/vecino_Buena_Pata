import type { HTMLAttributes } from 'react';
import { cx } from './clases';

interface TarjetaProps extends HTMLAttributes<HTMLDivElement> {
  destacada?: boolean;
  interactiva?: boolean;
}

export function Tarjeta({ destacada, interactiva, className, ...resto }: TarjetaProps) {
  return (
    <div
      className={cx(
        'rounded-tarjeta border border-black/15 bg-white shadow-sutil',
        destacada && 'border-l-4 border-l-verde',
        interactiva && 'transition-all duration-300 hover:-translate-y-1 hover:shadow-medio',
        className,
      )}
      {...resto}
    />
  );
}

export function TarjetaEncabezado({ className, ...resto }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx('rounded-t-tarjeta border-b border-black/10 bg-lienzo-gris px-6 py-4', className)}
      {...resto}
    />
  );
}

export function TarjetaCuerpo({ className, ...resto }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('p-6', className)} {...resto} />;
}

export function TarjetaPie({ className, ...resto }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx('flex flex-wrap items-center gap-3 border-t border-black/10 px-6 py-4', className)}
      {...resto}
    />
  );
}
