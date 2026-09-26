import { describe, expect, it } from 'vitest';
import {
  estiloLocalidad,
  MIEL,
  opacidadRelleno,
  opacidadSeleccion,
  TINTA,
  VERDE_BORDE,
} from './estilo-localidad.lib';
import { estadoVisual } from '@/shared/estado-visual/estado-visual.lib';

const base = { nombre: 'Kennedy', seleccionada: null, enHover: false, zoom: 12 } as const;

describe('opacidadRelleno', () => {
  it('baja con el zoom para no tapar las calles', () => {
    expect(opacidadRelleno(10)).toBe(0.1);
    expect(opacidadRelleno(12)).toBe(0.1);
    expect(opacidadRelleno(15)).toBe(0.03);
    expect(opacidadRelleno(18)).toBe(0.03);
    expect(opacidadRelleno(13.5)).toBeCloseTo(0.065);
  });
});

describe('opacidadSeleccion', () => {
  it('se aclara al acercarse para que se lean las calles', () => {
    expect(opacidadSeleccion(12)).toBe(0.3);
    expect(opacidadSeleccion(13)).toBe(0.3);
    expect(opacidadSeleccion(16)).toBe(0.1);
    expect(opacidadSeleccion(19)).toBe(0.1);
    expect(opacidadSeleccion(14.5)).toBeCloseTo(0.2);
  });
});

describe('estiloLocalidad', () => {
  it('en reposo usa borde verde profundo y relleno tenue', () => {
    const estilo = estiloLocalidad(base);

    expect(estilo.color).toBe(VERDE_BORDE);
    expect(estilo.opacity).toBe(0.6);
    expect(estilo.fillOpacity).toBe(0.1);
  });

  it('al pasar el cursor engrosa el borde y sube el relleno', () => {
    const estilo = estiloLocalidad({ ...base, enHover: true });

    expect(estilo.weight).toBe(3);
    expect(estilo.opacity).toBe(0.95);
    expect(estilo.fillOpacity).toBe(0.24);
  });

  it('la localidad elegida va en amarillo miel con borde de tinta', () => {
    const estilo = estiloLocalidad({ ...base, seleccionada: 'Kennedy' });

    expect(estilo).toMatchObject({
      fillColor: MIEL,
      fillOpacity: 0.3,
      color: TINTA,
      weight: 3,
      opacity: 1,
    });
  });

  it('las demás se atenúan y quedan sin relleno cuando hay una elegida', () => {
    const estilo = estiloLocalidad({ ...base, seleccionada: 'Suba' });

    expect(estilo.fillOpacity).toBe(0);
    expect(estilo.opacity).toBe(0.35);
  });

  it('Santa Fe lleva el borde un poco más grueso', () => {
    expect(estiloLocalidad({ ...base, nombre: 'Santa Fe' }).weight).toBeGreaterThan(
      estiloLocalidad(base).weight,
    );
  });

  it('con color propio (coroplético) usa ese relleno', () => {
    const estilo = estiloLocalidad({ ...base, colorRelleno: '#a5c95b' });

    expect(estilo.fillColor).toBe('#a5c95b');
    expect(estilo.fillOpacity).toBeGreaterThan(0.5);
  });

  it('el amarillo miel no coincide con ningún color de estado de animal', () => {
    const estados = [
      'CANDIDATO',
      'EN_PROCESO',
      'VBP_ACTIVO',
      'ADOPTADO',
      'PERDIDO',
      'FALLECIDO',
    ] as const;

    for (const estado of estados) {
      expect(estadoVisual(estado).color.toLowerCase()).not.toBe(MIEL);
    }
  });
});
