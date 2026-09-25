import type { TokenRespuesta } from '@/core/modelos/sesion';
import { useSesion } from '@/core/sesion/sesion.store';
import { solicitar } from './cliente';

export async function iniciarSesion(usuario: string, clave: string): Promise<void> {
  const cuerpo = new URLSearchParams();
  cuerpo.set('username', usuario);
  cuerpo.set('password', clave);

  const respuesta = await solicitar<TokenRespuesta>('/auth/login', { metodo: 'POST', cuerpo });
  useSesion.getState().iniciar({
    token: respuesta.access_token,
    rol: respuesta.rol,
    nombre: respuesta.nombre,
  });
}

export function cerrarSesion(): void {
  useSesion.getState().cerrar();
}
