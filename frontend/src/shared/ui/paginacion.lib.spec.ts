import { rangoPaginas } from './paginacion.lib';

describe('rangoPaginas', () => {
  it('no devuelve nada si no hay páginas', () => {
    expect(rangoPaginas(1, 0)).toEqual([]);
  });

  it('muestra todas las páginas cuando son pocas', () => {
    expect(rangoPaginas(2, 4)).toEqual([1, 2, 3, 4]);
  });

  it('muestra una sola página', () => {
    expect(rangoPaginas(1, 1)).toEqual([1]);
  });

  it('resume el tramo lejano con un separador al inicio', () => {
    expect(rangoPaginas(9, 10)).toEqual([1, 'separador-inicio', 8, 9, 10]);
  });

  it('resume el tramo lejano con un separador al final', () => {
    expect(rangoPaginas(2, 10)).toEqual([1, 2, 3, 'separador-fin', 10]);
  });

  it('pone separador a ambos lados cuando la actual está en el medio', () => {
    expect(rangoPaginas(5, 10)).toEqual([1, 'separador-inicio', 4, 5, 6, 'separador-fin', 10]);
  });

  it('no usa separador para un hueco de una sola página', () => {
    expect(rangoPaginas(4, 6)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('acota una página actual fuera de rango', () => {
    expect(rangoPaginas(99, 5)).toEqual(rangoPaginas(5, 5));
    expect(rangoPaginas(-3, 5)).toEqual(rangoPaginas(1, 5));
  });
});
