import { describirEvento } from './nombre-evento.lib';

describe('describirEvento', () => {
  it('nombra cada tipo de evento en español', () => {
    expect(describirEvento('INSCRIPCION', {}).titulo).toBe('Inscripción');
    expect(describirEvento('VALIDACION', {}).titulo).toBe('Validación veterinaria');
    expect(describirEvento('FORMALIZACION', {}).titulo).toBe('Formalización');
    expect(describirEvento('VISITA_SEGUIMIENTO', {}).titulo).toBe('Visita de seguimiento');
    expect(describirEvento('SALIDA', {}).titulo).toBe('Salida del programa');
    expect(describirEvento('REACTIVACION', {}).titulo).toBe('Reactivación');
    expect(describirEvento('ATENCION_ESPECIAL', {}).titulo).toBe('Atención a un reporte');
  });

  it('muestra el veredicto y los pendientes de una validación', () => {
    const evento = describirEvento('VALIDACION', {
      veredicto: 'CON_PENDIENTES',
      pendientes: ['SIN_CHIP', 'SALUD'],
    });

    expect(evento.detalle).toBe('Con pendientes: sin microchip, salud.');
  });

  it('muestra que una validación fue aprobada', () => {
    expect(describirEvento('VALIDACION', { veredicto: 'APROBADO', pendientes: [] }).detalle).toBe(
      'Aprobada.',
    );
  });

  it('muestra el barrio de una inscripción', () => {
    expect(describirEvento('INSCRIPCION', { barrio: 'Bosa', comunidad_id: 3 }).detalle).toBe(
      'Barrio Bosa.',
    );
  });

  it('muestra el código del collar sin cambiarlo', () => {
    expect(describirEvento('FORMALIZACION', { codigo_collar: 'vbp-abc123' }).detalle).toBe(
      'Collar vbp-abc123.',
    );
  });

  it('muestra el estado de salud de una visita', () => {
    expect(describirEvento('VISITA_SEGUIMIENTO', { estado_salud: 'REGULAR' }).detalle).toBe(
      'Salud regular.',
    );
  });

  it('muestra la causal de una salida', () => {
    expect(describirEvento('SALIDA', { causal: 'PERDIDA' }).detalle).toBe('Motivo: pérdida.');
  });

  it('no inventa detalle cuando faltan datos', () => {
    expect(describirEvento('VALIDACION', {}).detalle).toBeNull();
    expect(describirEvento('SALIDA', {}).detalle).toBeNull();
  });

  it('muestra un tipo desconocido tal cual, sin romper', () => {
    expect(describirEvento('OTRO_EVENTO', {})).toEqual({ titulo: 'OTRO_EVENTO', detalle: null });
  });
});
