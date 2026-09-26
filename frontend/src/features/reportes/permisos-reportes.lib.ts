export function puedeAtenderReportes(rol: string | undefined): boolean {
  return rol === 'VETERINARIO' || rol === 'ADMIN';
}
