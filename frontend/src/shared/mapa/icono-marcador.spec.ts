import { estadoVisual } from '@/shared/estado-visual/estado-visual.lib';
import { crearIconoMarcador, htmlMarcador } from './icono-marcador';

describe('htmlMarcador', () => {
  it('dibuja una huellita: una almohadilla y cuatro deditos', () => {
    const html = htmlMarcador(estadoVisual('VBP_ACTIVO'));

    expect(html.match(/<ellipse/g)).toHaveLength(4);
    expect(html.match(/<path d="M22 22\.5/g)).toHaveLength(1);
  });

  it('pinta la huellita con el color del estado', () => {
    expect(htmlMarcador(estadoVisual('VBP_ACTIVO'))).toContain('fill="#719d15"');
    expect(htmlMarcador(estadoVisual('PERDIDO'))).toContain('fill="#b02a37"');
  });

  it('lleva un borde blanco para separarse del mapa', () => {
    expect(htmlMarcador(estadoVisual('VBP_ACTIVO'))).toContain('stroke="#ffffff"');
  });

  it('incluye el glifo propio de cada estado en el distintivo', () => {
    const activo = htmlMarcador(estadoVisual('VBP_ACTIVO'));
    const fallecido = htmlMarcador(estadoVisual('FALLECIDO'));
    expect(activo).not.toEqual(fallecido);
    expect(activo).toContain('M7.2 12.6');
  });

  it('agrega un anillo rojo solo cuando hay reporte abierto', () => {
    expect(htmlMarcador(estadoVisual('VBP_ACTIVO'))).not.toContain('stroke="#b02a37"');
    expect(htmlMarcador(estadoVisual('VBP_ACTIVO', true))).toContain('stroke="#b02a37"');
  });

  it('marca la huellita elegida con un halo y un aro que solo animan al aparecer', () => {
    const normal = htmlMarcador(estadoVisual('VBP_ACTIVO'));
    const elegida = htmlMarcador(estadoVisual('VBP_ACTIVO'), true);

    expect(normal).not.toContain('huella-elegida');
    expect(elegida).toContain('huella-elegida');
    expect(elegida).toContain('huella-aro');
    expect(elegida).toContain('stroke-dasharray');
  });
});

describe('crearIconoMarcador', () => {
  it('usa el área táctil mínima de 44 px y centra el ancla', () => {
    const icono = crearIconoMarcador(estadoVisual('VBP_ACTIVO'));

    expect(icono.options.iconSize).toEqual([44, 44]);
    expect(icono.options.iconAnchor).toEqual([22, 22]);
    expect(icono.options.className).toBe('marcador-vbp');
  });
});
