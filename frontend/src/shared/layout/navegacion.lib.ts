import type { RolUsuario } from '@/core/modelos/enums';

export interface EnlaceNavegacion {
  a: string;
  texto: string;
}

export const ENLACES_PUBLICOS: EnlaceNavegacion[] = [
  { a: '/', texto: 'Inicio' },
  { a: '/#como-funciona', texto: 'Cómo funciona' },
];

export function enlacesGestion(rol: RolUsuario): EnlaceNavegacion[] {
  const enlaces: EnlaceNavegacion[] = [{ a: '/mapa', texto: 'Mapa' }];

  enlaces.push({ a: '/animales/inscribir', texto: 'Inscribir' });
  if (rol === 'COMUNIDAD' || rol === 'LIDER') {
    enlaces.push({ a: '/mis-perritos', texto: 'Mis perritos' });
  }
  if (rol === 'VETERINARIO' || rol === 'ADMIN') {
    enlaces.push({ a: '/validacion', texto: 'Validar' });
  }
  if (rol === 'LIDER' || rol === 'ADMIN') {
    enlaces.push({ a: '/formalizacion', texto: 'Formalizar' });
  }
  enlaces.push(
    { a: '/reportes', texto: 'Reportes' },
    { a: '/indicadores', texto: 'Indicadores' },
    { a: '/notificaciones', texto: 'Notificaciones' },
  );
  if (rol === 'UNIDAD_ESPECIAL' || rol === 'ADMIN') {
    enlaces.push({ a: '/seguimiento/panel', texto: 'Seguimiento' });
  }
  if (rol === 'ADMIN') {
    enlaces.push({ a: '/usuarios', texto: 'Usuarios' });
  }

  return enlaces;
}
