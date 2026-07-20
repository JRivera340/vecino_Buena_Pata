import { estadoVisual } from './estado-visual.lib';

describe('estadoVisual', () => {
  it('devuelve ambar y activo para CANDIDATO', () => {
    const resultado = estadoVisual('CANDIDATO');
    expect(resultado.color).toBe('var(--color-ambar)');
    expect(resultado.esActivo).toBe(true);
  });

  it('devuelve ambar oscuro para EN_PROCESO', () => {
    const resultado = estadoVisual('EN_PROCESO');
    expect(resultado.color).toBe('var(--color-ambar-oscuro)');
    expect(resultado.esActivo).toBe(true);
  });

  it('devuelve verde oliva para VBP_ACTIVO', () => {
    const resultado = estadoVisual('VBP_ACTIVO');
    expect(resultado.color).toBe('var(--color-secundario)');
    expect(resultado.esActivo).toBe(true);
  });

  it('marca ADOPTADO PERDIDO y FALLECIDO como inactivos con gris calido', () => {
    for (const estado of ['ADOPTADO', 'PERDIDO', 'FALLECIDO'] as const) {
      const resultado = estadoVisual(estado);
      expect(resultado.esActivo).toBe(false);
      expect(resultado.color).toBe('var(--color-neutro-600)');
    }
  });

  it('no indica reporte abierto por defecto', () => {
    expect(estadoVisual('VBP_ACTIVO').indicadorReporte).toBe(false);
  });

  it('indica reporte abierto cuando se pasa el flag', () => {
    expect(estadoVisual('VBP_ACTIVO', true).indicadorReporte).toBe(true);
  });
});
