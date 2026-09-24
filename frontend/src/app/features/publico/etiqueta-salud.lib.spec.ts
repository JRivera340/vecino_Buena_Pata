import { etiquetaSalud } from './etiqueta-salud.lib';

describe('etiquetaSalud', () => {
  it('traduce cada estado de salud a un texto para el publico', () => {
    expect(etiquetaSalud('BUENO')).toBe('Buena');
    expect(etiquetaSalud('REGULAR')).toBe('Regular');
    expect(etiquetaSalud('MALO')).toBe('Mala');
  });
});
