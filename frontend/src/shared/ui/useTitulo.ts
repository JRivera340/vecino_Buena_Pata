import { useEffect } from 'react';

export function useTitulo(titulo: string) {
  useEffect(() => {
    document.title = `${titulo} | Vecino Buena Pata`;
  }, [titulo]);
}

export function useDesplazarAlHash(hash: string) {
  useEffect(() => {
    if (!hash) {
      return;
    }
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [hash]);
}
