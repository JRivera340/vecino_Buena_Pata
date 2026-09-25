export function puedeAtenderReportes(rol: string | undefined): boolean {
  return rol === 'UNIDAD_ESPECIAL' || rol === 'ADMIN';
}
