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

  it('da a COMUNIDAD solo mapa, inscripción, reportes e indicadores', () => {
    expect(rutas('COMUNIDAD')).toEqual(['/mapa', '/animales/inscribir', '/reportes', '/indicadores']);
  });

  it('nombra cada enlace en español claro', () => {
    const textos = enlacesGestion('ADMIN').map((enlace) => enlace.texto);
    expect(textos).toEqual(['Mapa', 'Inscribir', 'Validar', 'Formalizar', 'Reportes', 'Indicadores', 'Usuarios']);
  });
});
