import { resumirMapa } from './resumen-mapa.lib';

describe('resumirMapa', () => {
  it('avisa cuando todavía no hay animales', () => {
    expect(resumirMapa([])).toBe('Todavía no hay animales activos en el mapa.');
  });

  it('usa el singular con un solo animal', () => {
    expect(resumirMapa([{ barrio: 'Bosa' }])).toBe(
      'Hoy hay 1 Vecino Buena Pata activo en 1 barrio.',
    );
  });

  it('cuenta animales y barrios distintos en plural', () => {
    const animales = [{ barrio: 'Bosa' }, { barrio: 'Bosa' }, { barrio: 'Usme' }];
    expect(resumirMapa(animales)).toBe('Hoy hay 3 Vecinos Buena Pata activos en 2 barrios.');
  });

  it('no cuenta dos veces un barrio repetido', () => {
    const animales = [{ barrio: 'Bosa' }, { barrio: 'Bosa' }];
    expect(resumirMapa(animales)).toBe('Hoy hay 2 Vecinos Buena Pata activos en 1 barrio.');
  });
});
