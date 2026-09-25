import { X } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTrampaFoco } from './useTrampaFoco';

interface ModalProps {
  abierto: boolean;
  titulo: string;
  alCerrar: () => void;
  children: ReactNode;
  pie?: ReactNode;
}

export function Modal({ abierto, titulo, alCerrar, children, pie }: ModalProps) {
  const refDialogo = useTrampaFoco(abierto, alCerrar);
  const idTitulo = useId();

  if (!abierto) {
    return null;
  }

  return createPortal(
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) {
          alCerrar();
        }
      }}
    >
      <div
        ref={refDialogo}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        className="flex max-h-[90vh] w-full max-w-[600px] animate-aparecer flex-col rounded-seccion bg-white p-6 shadow-fuerte sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={idTitulo} className="text-h3 text-tinta">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={alCerrar}
            aria-label="Cerrar"
            className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded text-tinta-suave hover:bg-lienzo-gris"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-4 min-h-[100px] flex-1 overflow-y-auto">{children}</div>
        {pie && (
          <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-black/10 pt-6">{pie}</div>
        )}
      </div>
    </div>,
    document.body,
  );
}
