import { validarInscripcion, type FormularioInscripcion } from './validar-inscripcion.lib';

function formulario(datos: Partial<FormularioInscripcion> = {}): FormularioInscripcion {
  return {
    nombre: 'Rocky',
    barrio: 'Bosa',
    comunidadId: 1,
    ubicacion: { lat: 4.6, lng: -74.1 },
    foto: new File(['x'], 'foto.jpg', { type: 'image/jpeg' }),
    edadEstimada: '',
    ...datos,
  };
}

describe('validarInscripcion', () => {
  it('no encuentra errores en un formulario completo', () => {
    expect(validarInscripcion(formulario())).toEqual({});
  });

  it('pide el nombre y no acepta solo espacios', () => {
    expect(validarInscripcion(formulario({ nombre: '' })).nombre).toBe(
      'Escribe el nombre del animal.',
    );
    expect(validarInscripcion(formulario({ nombre: '   ' })).nombre).toBe(
      'Escribe el nombre del animal.',
    );
  });

  it('pide el barrio', () => {
    expect(validarInscripcion(formulario({ barrio: ' ' })).barrio).toBe(
      'Escribe el barrio donde vive.',
    );
  });

  it('pide elegir una comunidad', () => {
    expect(validarInscripcion(formulario({ comunidadId: null })).comunidad).toBe(
      'Elige la comunidad que lo cuida.',
    );
  });

  it('pide marcar la ubicación en el mapa', () => {
    expect(validarInscripcion(formulario({ ubicacion: null })).ubicacion).toBe(
      'Toca el mapa para marcar dónde vive.',
    );
  });

  it('pide una foto', () => {
    expect(validarInscripcion(formulario({ foto: null })).foto).toBe('Agrega una foto del animal.');
  });

  it('rechaza un archivo que no es una imagen', () => {
    const pdf = new File(['x'], 'ficha.pdf', { type: 'application/pdf' });

    expect(validarInscripcion(formulario({ foto: pdf })).foto).toBe(
      'El archivo debe ser una imagen (JPG, PNG o WEBP).',
    );
  });

  it('rechaza una foto de más de 10 MB', () => {
    const grande = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'grande.jpg', {
      type: 'image/jpeg',
    });

    expect(validarInscripcion(formulario({ foto: grande })).foto).toBe(
      'La foto pesa más de 10 MB. Elige una más liviana.',
    );
  });

  it('acepta la edad vacía o un número entero entre 0 y 30', () => {
    expect(validarInscripcion(formulario({ edadEstimada: '' })).edad).toBeUndefined();
    expect(validarInscripcion(formulario({ edadEstimada: '0' })).edad).toBeUndefined();
    expect(validarInscripcion(formulario({ edadEstimada: '12' })).edad).toBeUndefined();
  });

  it('rechaza una edad negativa, decimal, absurda o que no es un número', () => {
    const mensaje = 'La edad debe ser un número entero de años entre 0 y 30.';
    expect(validarInscripcion(formulario({ edadEstimada: '-1' })).edad).toBe(mensaje);
    expect(validarInscripcion(formulario({ edadEstimada: '2.5' })).edad).toBe(mensaje);
    expect(validarInscripcion(formulario({ edadEstimada: '99' })).edad).toBe(mensaje);
    expect(validarInscripcion(formulario({ edadEstimada: 'mucha' })).edad).toBe(mensaje);
  });

  it('reporta todos los errores a la vez', () => {
    const errores = validarInscripcion(
      formulario({ nombre: '', barrio: '', comunidadId: null, ubicacion: null, foto: null }),
    );

    expect(Object.keys(errores).sort()).toEqual([
      'barrio',
      'comunidad',
      'foto',
      'nombre',
      'ubicacion',
    ]);
  });

  it('rechaza un punto marcado fuera de Bogotá y acepta uno dentro o aún sin clasificar', () => {
    const fuera = validarInscripcion(
      formulario({ ubicacion: { lat: 6.2, lng: -75.5, localidad: null } }),
    );
    const dentro = validarInscripcion(
      formulario({ ubicacion: { lat: 4.6, lng: -74.07, localidad: 'Santa Fe' } }),
    );
    const sinClasificar = validarInscripcion(formulario({ ubicacion: { lat: 4.6, lng: -74.07 } }));

    expect(fuera.ubicacion).toMatch(/fuera de Bogotá/);
    expect(dentro.ubicacion).toBeUndefined();
    expect(sinClasificar.ubicacion).toBeUndefined();
  });
});
