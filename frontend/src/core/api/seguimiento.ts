import type { Animal } from '@/core/modelos/animal';
import type { ReactivacionCrear, SalidaCrear, VisitaCrear } from '@/core/modelos/seguimiento';
import type { Visita } from '@/core/modelos/visita';
import { solicitar } from './cliente';

export const crearVisita = (animalId: number, datos: VisitaCrear) =>
  solicitar<Visita>(`/animales/${animalId}/visitas`, { metodo: 'POST', cuerpo: { ...datos } });

export const registrarSalida = (animalId: number, datos: SalidaCrear) =>
  solicitar<Animal>(`/animales/${animalId}/salida`, { metodo: 'POST', cuerpo: { ...datos } });

export const reactivarAnimal = (animalId: number, datos: ReactivacionCrear) =>
  solicitar<Animal>(`/animales/${animalId}/reactivacion`, { metodo: 'POST', cuerpo: { ...datos } });
