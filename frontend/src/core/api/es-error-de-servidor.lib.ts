export function esErrorDeServidor(estado: number): boolean {
  return estado === 0 || estado >= 500;
}
