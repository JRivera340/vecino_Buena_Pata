import type { AnimalSeguimiento } from '@/core/modelos/seguimiento-estado';
import { solicitar } from './cliente';

export const listarSeguimiento = () => solicitar<AnimalSeguimiento[]>('/animales/seguimiento');

export const marcarEnCamino = (animalId: number) =>
  solicitar(`/animales/${animalId}/visitas/en-camino`, { metodo: 'POST' });

export const cancelarEnCamino = (animalId: number) =>
  solicitar(`/animales/${animalId}/visitas/en-camino`, { metodo: 'DELETE' });
