import { etiquetaEspecie, etiquetaSexo, etiquetaTamano, formatearEdad, formatearFecha, formatearPeso } from './formato.lib';

describe('formatearFecha', () => {
  it('escribe la fecha completa en español de Colombia', () => {
    expect(formatearFecha('2026-09-25T15:00:00Z')).toBe('25 de septiembre de 2026');
  });

  it('usa la hora de Bogotá, no la del servidor', () => {
    expect(formatearFecha('2026-09-26T03:00:00Z')).toBe('25 de septiembre de 2026');
  });

  it('devuelve un texto vacío si la fecha no es válida', () => {
    expect(formatearFecha('no es una fecha')).toBe('');
  });
});

describe('formatearPeso', () => {
  it('usa coma decimal', () => {
    expect(formatearPeso(22.5)).toBe('22,5 kg');
  });

  it('no agrega decimales innecesarios', () => {
    expect(formatearPeso(18)).toBe('18 kg');
  });

  it('devuelve null cuando no hay peso', () => {
    expect(formatearPeso(null)).toBeNull();
  });
});

describe('formatearEdad', () => {
  it('escribe años en plural', () => {
    expect(formatearEdad(4)).toBe('4 años');
  });

  it('escribe un año en singular', () => {
    expect(formatearEdad(1)).toBe('1 año');
  });

  it('describe a los menores de un año', () => {
    expect(formatearEdad(0)).toBe('Menos de un año');
  });

  it('avisa cuando no hay dato', () => {
    expect(formatearEdad(null)).toBe('Sin dato');
  });
});

describe('etiquetas de la ficha', () => {
  it('traduce la especie', () => {
    expect(etiquetaEspecie('PERRO')).toBe('Perro');
    expect(etiquetaEspecie('GATO')).toBe('Gato');
  });

  it('traduce el sexo', () => {
    expect(etiquetaSexo('MACHO')).toBe('Macho');
    expect(etiquetaSexo('HEMBRA')).toBe('Hembra');
  });

  it('traduce el tamaño con eñe', () => {
    expect(etiquetaTamano('PEQUENO')).toBe('Pequeño');
    expect(etiquetaTamano('MEDIANO')).toBe('Mediano');
    expect(etiquetaTamano('GRANDE')).toBe('Grande');
  });

  it('devuelve el valor original si llega uno desconocido', () => {
    expect(etiquetaTamano('GIGANTE')).toBe('GIGANTE');
  });
});
