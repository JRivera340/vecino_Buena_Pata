import type { Usuario, UsuarioCrear, UsuarioEditar } from '@/core/modelos/usuario';
import { solicitar } from './cliente';

export const listarUsuarios = () => solicitar<Usuario[]>('/usuarios');

export const crearUsuario = (datos: UsuarioCrear) =>
  solicitar<Usuario>('/usuarios', { metodo: 'POST', cuerpo: { ...datos } });

export const editarUsuario = (id: number, datos: UsuarioEditar) =>
  solicitar<Usuario>(`/usuarios/${id}`, { metodo: 'PATCH', cuerpo: { ...datos } });
