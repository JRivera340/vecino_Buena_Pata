import type { Animal, AnimalCrear } from '@/core/modelos/animal';
import type { EventoHistorial } from '@/core/modelos/historial';
import type { Validacion } from '@/core/modelos/validacion';
import type { Visita } from '@/core/modelos/visita';
import { solicitar } from './cliente';

export const listarAnimales = () => solicitar<Animal[]>('/animales');

export const obtenerAnimal = (id: number) => solicitar<Animal>(`/animales/${id}`);

export const crearAnimal = (datos: AnimalCrear) =>
  solicitar<Animal>('/animales', { metodo: 'POST', cuerpo: { ...datos } });

export const obtenerHistorial = (id: number) =>
  solicitar<EventoHistorial[]>(`/animales/${id}/historial`);

export const obtenerVisitas = (id: number) => solicitar<Visita[]>(`/animales/${id}/visitas`);

export const obtenerValidaciones = (id: number) =>
  solicitar<Validacion[]>(`/animales/${id}/validaciones`);
