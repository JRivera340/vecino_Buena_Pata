import type { EstadoAnimal } from '@/core/modelos/enums';
import { contraste, estadoVisual } from './estado-visual.lib';

const ESTADOS: EstadoAnimal[] = ['CANDIDATO', 'EN_PROCESO', 'VBP_ACTIVO', 'ADOPTADO', 'PERDIDO', 'FALLECIDO'];

describe('estadoVisual', () => {
  it('usa el verde de marca para VBP_ACTIVO', () => {
    const resultado = estadoVisual('VBP_ACTIVO');
    expect(resultado.color).toBe('#719d15');
    expect(resultado.etiqueta).toBe('Vecino Buena Pata activo');
    expect(resultado.esActivo).toBe(true);
  });

  it('usa azul para CANDIDATO y ámbar para EN_PROCESO', () => {
    expect(estadoVisual('CANDIDATO').color).toBe('#0345bf');
    expect(estadoVisual('EN_PROCESO').color).toBe('#b45309');
    expect(estadoVisual('CANDIDATO').esActivo).toBe(true);
    expect(estadoVisual('EN_PROCESO').esActivo).toBe(true);
  });

  it('marca ADOPTADO, PERDIDO y FALLECIDO como fuera del programa', () => {
    for (const estado of ['ADOPTADO', 'PERDIDO', 'FALLECIDO'] as const) {
      expect(estadoVisual(estado).esActivo).toBe(false);
    }
  });

  it('da a cada estado un color y un icono distintos, para no depender solo del color', () => {
    const colores = new Set(ESTADOS.map((estado) => estadoVisual(estado).color));
    const iconos = new Set(ESTADOS.map((estado) => estadoVisual(estado).icono));
    expect(colores.size).toBe(ESTADOS.length);
    expect(iconos.size).toBe(ESTADOS.length);
  });

  it('no indica reporte abierto por defecto', () => {
    expect(estadoVisual('VBP_ACTIVO').indicadorReporte).toBe(false);
  });

  it('indica reporte abierto cuando se pasa el flag', () => {
    expect(estadoVisual('VBP_ACTIVO', true).indicadorReporte).toBe(true);
  });

  it('mantiene al menos 3:1 entre cada color de marcador y el blanco del icono', () => {
    for (const estado of ESTADOS) {
      expect(contraste(estadoVisual(estado).color, '#ffffff')).toBeGreaterThanOrEqual(3);
    }
  });

  it('mantiene al menos 4,5:1 entre cada color de texto y el blanco', () => {
    for (const estado of ESTADOS) {
      expect(contraste(estadoVisual(estado).colorTexto, '#ffffff')).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('contraste', () => {
  it('da 21:1 entre negro y blanco', () => {
    expect(contraste('#000000', '#ffffff')).toBeCloseTo(21, 1);
  });

  it('da 1:1 entre dos colores iguales', () => {
    expect(contraste('#719d15', '#719d15')).toBeCloseTo(1, 5);
  });

  it('confirma que el verde de marca no alcanza 4,5:1 sobre blanco pero el profundo sí', () => {
    expect(contraste('#719d15', '#ffffff')).toBeLessThan(4.5);
    expect(contraste('#55711f', '#ffffff')).toBeGreaterThanOrEqual(4.5);
  });
});
