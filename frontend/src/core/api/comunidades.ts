import type { Comunidad } from '@/core/modelos/comunidad';
import { solicitar } from './cliente';

export const listarComunidades = () => solicitar<Comunidad[]>('/comunidades');
