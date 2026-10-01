import { enlacesGestion } from './navegacion.lib';

const rutas = (rol: Parameters<typeof enlacesGestion>[0]) => enlacesGestion(rol).map((enlace) => enlace.a);

describe('enlacesGestion', () => {
  it('da a ADMIN todos los enlaces', () => {
    expect(rutas('ADMIN')).toEqual([
      '/mapa',
      '/animales/inscribir',
      '/validacion',
      '/formalizacion',
      '/reportes',
      '/indicadores',
      '/notificaciones',
      '/seguimiento/panel',
      '/usuarios',
    ]);
  });

  it('da a VETERINARIO la validación pero no la formalización', () => {
    expect(rutas('VETERINARIO')).toContain('/validacion');
    expect(rutas('VETERINARIO')).not.toContain('/formalizacion');
  });

  it('da a LIDER la formalización pero no la validación', () => {
    expect(rutas('LIDER')).toContain('/formalizacion');
    expect(rutas('LIDER')).not.toContain('/validacion');
  });

  it('da a COMUNIDAD solo mapa, inscripción, reportes, indicadores y notificaciones', () => {
    expect(rutas('COMUNIDAD')).toEqual([
      '/mapa',
      '/animales/inscribir',
      '/reportes',
      '/indicadores',
      '/notificaciones',
    ]);
  });

  it('nombra cada enlace en español claro', () => {
    const textos = enlacesGestion('ADMIN').map((enlace) => enlace.texto);
    expect(textos).toEqual([
      'Mapa',
      'Inscribir',
      'Validar',
      'Formalizar',
      'Reportes',
      'Indicadores',
      'Notificaciones',
      'Seguimiento',
      'Usuarios',
    ]);
  });

  it('da a UNIDAD_ESPECIAL reportes y el panel de seguimiento, pero no validación ni formalización', () => {
    const rutas_especial = rutas('UNIDAD_ESPECIAL');
    expect(rutas_especial).toContain('/reportes');
    expect(rutas_especial).toContain('/seguimiento/panel');
    expect(rutas_especial).not.toContain('/validacion');
    expect(rutas_especial).not.toContain('/formalizacion');
  });

  it('no da a COMUNIDAD ni a LIDER el panel de seguimiento', () => {
    expect(rutas('COMUNIDAD')).not.toContain('/seguimiento/panel');
    expect(rutas('LIDER')).not.toContain('/seguimiento/panel');
  });
});
