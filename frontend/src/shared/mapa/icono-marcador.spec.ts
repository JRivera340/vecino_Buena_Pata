import { estadoVisual } from '@/shared/estado-visual/estado-visual.lib';
import { crearIconoMarcador, htmlMarcador } from './icono-marcador';

describe('htmlMarcador', () => {
  it('pinta el círculo con el color del estado', () => {
    expect(htmlMarcador(estadoVisual('VBP_ACTIVO'))).toContain('fill="#719d15"');
    expect(htmlMarcador(estadoVisual('PERDIDO'))).toContain('fill="#b02a37"');
  });

  it('incluye el glifo propio de cada estado', () => {
    const activo = htmlMarcador(estadoVisual('VBP_ACTIVO'));
    const fallecido = htmlMarcador(estadoVisual('FALLECIDO'));
    expect(activo).not.toEqual(fallecido);
    expect(activo).toContain('M7.2 12.6');
  });

  it('agrega un anillo rojo solo cuando hay reporte abierto', () => {
    expect(htmlMarcador(estadoVisual('VBP_ACTIVO'))).not.toContain('stroke="#b02a37"');
    expect(htmlMarcador(estadoVisual('VBP_ACTIVO', true))).toContain('stroke="#b02a37"');
  });

  it('agranda el marcador seleccionado y le pone un halo', () => {
    const normal = htmlMarcador(estadoVisual('VBP_ACTIVO'));
    const elegido = htmlMarcador(estadoVisual('VBP_ACTIVO'), true);
    expect(normal).toContain('width="36"');
    expect(elegido).toContain('width="46"');
    expect(elegido).toContain('stroke-dasharray');
  });
});

describe('crearIconoMarcador', () => {
  it('centra el ancla del icono', () => {
    const icono = crearIconoMarcador(estadoVisual('VBP_ACTIVO'));
    expect(icono.options.iconAnchor).toEqual([18, 18]);
    expect(icono.options.className).toBe('marcador-vbp');
  });

  it('usa un ancla mayor para el marcador seleccionado', () => {
    const icono = crearIconoMarcador(estadoVisual('VBP_ACTIVO'), true);
    expect(icono.options.iconAnchor).toEqual([23, 23]);
  });
});
