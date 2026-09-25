import type { FormalizacionRespuesta } from '@/core/modelos/seguimiento';
import { solicitar } from './cliente';

export const formalizarAnimal = (animalId: number) =>
  solicitar<FormalizacionRespuesta>(`/animales/${animalId}/formalizacion`, {
    metodo: 'POST',
    cuerpo: {},
  });

export const descargarQr = (animalId: number) =>
  solicitar<Blob>(`/animales/${animalId}/collar/qr.png`, { como: 'blob' });
