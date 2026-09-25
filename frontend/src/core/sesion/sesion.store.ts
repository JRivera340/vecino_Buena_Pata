import { create } from 'zustand';
import type { RolUsuario } from '@/core/modelos/enums';

export const CLAVE_SESION = 'vbp_sesion';

export interface Sesion {
  token: string;
  rol: RolUsuario;
  nombre: string;
}

function leerSesionGuardada(): Sesion | null {
  try {
    const guardada = sessionStorage.getItem(CLAVE_SESION);
    return guardada ? (JSON.parse(guardada) as Sesion) : null;
  } catch {
    return null;
  }
}

interface EstadoSesion {
  sesion: Sesion | null;
  iniciar: (sesion: Sesion) => void;
  cerrar: () => void;
}

export const useSesion = create<EstadoSesion>((set) => ({
  sesion: leerSesionGuardada(),
  iniciar: (sesion) => {
    try {
      sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    } catch {
      // Sin almacenamiento disponible la sesión dura solo mientras la página siga abierta.
    }
    set({ sesion });
  },
  cerrar: () => {
    try {
      sessionStorage.removeItem(CLAVE_SESION);
    } catch {
      // Nada que limpiar si el almacenamiento no está disponible.
    }
    set({ sesion: null });
  },
}));
