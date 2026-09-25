import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cx } from './clases';
import { rangoPaginas } from './paginacion.lib';

interface PaginacionProps {
  pagina: number;
  totalPaginas: number;
  alCambiar: (pagina: number) => void;
}

const CAJA =
  'flex h-11 min-w-[44px] items-center justify-center rounded border border-lienzo-borde bg-white ' +
  'px-3 text-pequeno font-semibold transition-colors sm:h-10 sm:min-w-[40px]';

export function Paginacion({ pagina, totalPaginas, alCambiar }: PaginacionProps) {
  if (totalPaginas <= 1) {
    return null;
  }
  return (
    <nav aria-label="Paginación" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        className={cx(CAJA, 'gap-1 hover:border-verde disabled:cursor-not-allowed disabled:opacity-50')}
        disabled={pagina <= 1}
        onClick={() => alCambiar(pagina - 1)}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Anterior
      </button>
      {rangoPaginas(pagina, totalPaginas).map((item) =>
        typeof item === 'number' ? (
          <button
            key={item}
            type="button"
            aria-label={`Página ${item}`}
            aria-current={item === pagina ? 'page' : undefined}
            className={cx(
              CAJA,
              item === pagina
                ? 'border-verde-profundo bg-verde-profundo text-white'
                : 'hover:border-verde hover:bg-lienzo-gris',
            )}
            onClick={() => alCambiar(item)}
          >
            {item}
          </button>
        ) : (
          <span key={item} className="px-1 text-tinta-suave" aria-hidden="true">
            …
          </span>
        ),
      )}
      <button
        type="button"
        className={cx(CAJA, 'gap-1 hover:border-verde disabled:cursor-not-allowed disabled:opacity-50')}
        disabled={pagina >= totalPaginas}
        onClick={() => alCambiar(pagina + 1)}
      >
        Siguiente
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </nav>
  );
}
