export type ItemPaginacion = number | 'separador-inicio' | 'separador-fin';

export function rangoPaginas(actual: number, total: number, vecinas = 1): ItemPaginacion[] {
  if (total <= 0) {
    return [];
  }
  const paginaActual = Math.min(Math.max(actual, 1), total);
  const visibles = new Set<number>([1, total]);
  for (let pagina = paginaActual - vecinas; pagina <= paginaActual + vecinas; pagina += 1) {
    if (pagina >= 1 && pagina <= total) {
      visibles.add(pagina);
    }
  }

  const ordenadas = Array.from(visibles).sort((a, b) => a - b);
  const resultado: ItemPaginacion[] = [];
  ordenadas.forEach((pagina, indice) => {
    const anterior = ordenadas[indice - 1];
    if (anterior !== undefined && pagina - anterior > 1) {
      if (pagina - anterior === 2) {
        resultado.push(anterior + 1);
      } else {
        resultado.push(indice < ordenadas.length / 2 ? 'separador-inicio' : 'separador-fin');
      }
    }
    resultado.push(pagina);
  });
  return resultado;
}
