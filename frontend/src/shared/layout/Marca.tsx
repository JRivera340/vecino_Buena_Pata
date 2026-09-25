import { cx } from '@/shared/ui/clases';

export function MarcaIcono({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false" className={cx('h-9 w-9 shrink-0', className)}>
      <rect width="32" height="32" rx="7" fill="#719d15" />
      <path
        d="M16 5.5c-4.4 0-8 3.4-8 7.7 0 5.6 8 13.3 8 13.3s8-7.7 8-13.3c0-4.3-3.6-7.7-8-7.7z"
        fill="#ffffff"
      />
      <circle cx="16" cy="13" r="3.2" fill="#719d15" />
    </svg>
  );
}

export function Marca({ claro = false }: { claro?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <MarcaIcono />
      <span className="flex flex-col leading-tight">
        <span className={cx('text-h5 font-semibold', claro ? 'text-white' : 'text-tinta')}>
          Vecino Buena Pata
        </span>
        <span className={cx('text-minimo', claro ? 'text-white/85' : 'text-tinta-suave')}>
          Observatorio PYBA
        </span>
      </span>
    </span>
  );
}
