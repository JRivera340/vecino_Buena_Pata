import { puedeAtenderReportes } from './permisos-reportes.lib';

describe('puedeAtenderReportes', () => {
  it('permite a UNIDAD_ESPECIAL y ADMIN', () => {
    expect(puedeAtenderReportes('UNIDAD_ESPECIAL')).toBe(true);
    expect(puedeAtenderReportes('ADMIN')).toBe(true);
  });

  it('no permite a los demás roles ni a una sesión ausente', () => {
    for (const rol of ['COMUNIDAD', 'VETERINARIO', 'LIDER', undefined]) {
      expect(puedeAtenderReportes(rol)).toBe(false);
    }
  });
});
