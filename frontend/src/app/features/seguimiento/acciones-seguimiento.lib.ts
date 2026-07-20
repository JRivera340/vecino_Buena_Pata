import { Animal } from '../../core/models/animal.model';

export function puedeRegistrarVisita(animal: Animal, rol: string | undefined): boolean {
  return animal.estado === 'VBP_ACTIVO' && (rol === 'VETERINARIO' || rol === 'ADMIN');
}

export function puedeRegistrarSalida(animal: Animal, rol: string | undefined): boolean {
  return animal.estado === 'VBP_ACTIVO' && (rol === 'LIDER' || rol === 'VETERINARIO' || rol === 'ADMIN');
}

export function puedeReactivar(animal: Animal, rol: string | undefined): boolean {
  return animal.estado === 'PERDIDO' && (rol === 'VETERINARIO' || rol === 'ADMIN');
}
