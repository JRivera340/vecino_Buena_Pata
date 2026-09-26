import { puedeAtenderReportes } from './permisos-reportes.lib';

describe('puedeAtenderReportes', () => {
  it('permite a VETERINARIO y ADMIN', () => {
    expect(puedeAtenderReportes('VETERINARIO')).toBe(true);
    expect(puedeAtenderReportes('ADMIN')).toBe(true);
  });

  it('no permite a los demás roles ni a una sesión ausente', () => {
    for (const rol of ['COMUNIDAD', 'LIDER', undefined]) {
      expect(puedeAtenderReportes(rol)).toBe(false);
    }
  });
});
