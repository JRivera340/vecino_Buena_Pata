import { useEffect, useRef } from 'react';

const ENFOCABLES =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), ' +
  'select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Mantiene el foco dentro del contenedor mientras está activo, cierra con Escape
// y devuelve el foco al elemento que lo tenía antes de abrirse.
export function useTrampaFoco(activo: boolean, alCerrar: () => void) {
  const contenedor = useRef<HTMLDivElement>(null);
  const cerrar = useRef(alCerrar);

  useEffect(() => {
    cerrar.current = alCerrar;
  }, [alCerrar]);

  useEffect(() => {
    if (!activo) {
      return undefined;
    }
    const anterior = document.activeElement as HTMLElement | null;
    const desbordeOriginal = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const enfocables = () =>
      Array.from(contenedor.current?.querySelectorAll<HTMLElement>(ENFOCABLES) ?? []);
    (enfocables()[0] ?? contenedor.current)?.focus();

    function alTeclear(evento: KeyboardEvent) {
      if (evento.key === 'Escape') {
        evento.stopPropagation();
        cerrar.current();
        return;
      }
      if (evento.key !== 'Tab') {
        return;
      }
      const lista = enfocables();
      if (lista.length === 0) {
        evento.preventDefault();
        return;
      }
      const primero = lista[0];
      const ultimo = lista[lista.length - 1];
      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primero.focus();
      }
    }

    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('keydown', alTeclear);
      document.body.style.overflow = desbordeOriginal;
      anterior?.focus();
    };
  }, [activo]);

  return contenedor;
}
