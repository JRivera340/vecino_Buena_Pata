import { describe, expect, it } from 'vitest';
import { seguimientoVisual } from './seguimiento-visual.lib';

describe('seguimientoVisual', () => {
  it('vencido es rojo', () => {
    expect(seguimientoVisual('VENCIDO').color).toBe('#b02a37');
  });
  it('en camino es azul', () => {
    expect(seguimientoVisual('EN_CAMINO').color).toBe('#0345bf');
  });
});
