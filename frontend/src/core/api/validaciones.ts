import type { ValidacionCrear } from '@/core/modelos/validacion';
import { solicitar } from './cliente';

export const crearValidacion = (animalId: number, datos: ValidacionCrear) =>
  solicitar<unknown>(`/animales/${animalId}/validaciones`, { metodo: 'POST', cuerpo: { ...datos } });
