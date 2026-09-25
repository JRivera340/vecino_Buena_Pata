import { create } from 'zustand';

interface EstadoAviso {
  mensaje: string | null;
  mostrar: (mensaje: string) => void;
  limpiar: () => void;
}

export const useAviso = create<EstadoAviso>((set) => ({
  mensaje: null,
  mostrar: (mensaje) => set({ mensaje }),
  limpiar: () => set({ mensaje: null }),
}));
