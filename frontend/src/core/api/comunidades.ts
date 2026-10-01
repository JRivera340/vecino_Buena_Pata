import type { Comunidad } from '@/core/modelos/comunidad';
import type { MiembroComunidadCrear, Usuario } from '@/core/modelos/usuario';
import { solicitar } from './cliente';

export const listarComunidades = () => solicitar<Comunidad[]>('/comunidades');

export const agregarMiembroComunidad = (datos: MiembroComunidadCrear) =>
  solicitar<Usuario>('/comunidades/mis-miembros', { metodo: 'POST', cuerpo: { ...datos } });
