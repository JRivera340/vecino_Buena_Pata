export function resumirMapa(animales: { barrio: string }[]): string {
  const total = animales.length;
  if (total === 0) {
    return 'Todavía no hay animales activos en el mapa.';
  }
  const barrios = new Set(animales.map((animal) => animal.barrio)).size;
  const sujeto =
    total === 1
      ? 'Hoy hay 1 Vecino Buena Pata activo'
      : `Hoy hay ${total} Vecinos Buena Pata activos`;
  const lugar = barrios === 1 ? 'en 1 barrio' : `en ${barrios} barrios`;
  return `${sujeto} ${lugar}.`;
}
