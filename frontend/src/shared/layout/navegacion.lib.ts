import type { RolUsuario } from '@/core/modelos/enums';

export interface EnlaceNavegacion {
  a: string;
  texto: string;
}

export const ENLACES_PUBLICOS: EnlaceNavegacion[] = [
  { a: '/', texto: 'Inicio' },
  { a: '/#como-funciona', texto: 'Cómo funciona' },
  { a: '/inscribir', texto: 'Inscribir un animal' },
];

export function enlacesGestion(rol: RolUsuario): EnlaceNavegacion[] {
  const enlaces: EnlaceNavegacion[] = [{ a: '/mapa', texto: 'Mapa' }];

  if (rol !== 'UNIDAD_ESPECIAL') {
    enlaces.push({ a: '/animales/inscribir', texto: 'Inscribir' });
  }
  if (rol === 'VETERINARIO' || rol === 'ADMIN') {
    enlaces.push({ a: '/validacion', texto: 'Validar' });
  }
  if (rol === 'LIDER' || rol === 'ADMIN') {
    enlaces.push({ a: '/formalizacion', texto: 'Formalizar' });
  }
  enlaces.push({ a: '/reportes', texto: 'Reportes' }, { a: '/indicadores', texto: 'Indicadores' });
  if (rol === 'ADMIN') {
    enlaces.push({ a: '/usuarios', texto: 'Usuarios' });
  }

  return enlaces;
}
