import { armarValidacion, type FormularioValidacion } from './armar-validacion.lib';

function formulario(datos: Partial<FormularioValidacion> = {}): FormularioValidacion {
  return {
    veredicto: 'APROBADO',
    pendientes: [],
    observaciones: '',
    esterilizado: false,
    numeroMicrochip: '',
    ...datos,
  };
}

describe('armarValidacion', () => {
  it('arma una aprobación sin pendientes', () => {
    const resultado = armarValidacion(formulario({ esterilizado: true, numeroMicrochip: '985112345678901' }));

    expect(resultado.errores).toEqual({});
    expect(resultado.datos).toEqual({
      veredicto: 'APROBADO',
      pendientes: [],
      observaciones: null,
      esterilizado: true,
      numero_microchip: '985112345678901',
    });
  });

  it('descarta los pendientes marcados si el veredicto es APROBADO', () => {
    const resultado = armarValidacion(formulario({ pendientes: ['SALUD'] }));

    expect(resultado.datos?.pendientes).toEqual([]);
  });

  it('conserva los pendientes cuando el veredicto es CON_PENDIENTES', () => {
    const resultado = armarValidacion(formulario({ veredicto: 'CON_PENDIENTES', pendientes: ['SIN_CHIP', 'SALUD'] }));

    expect(resultado.errores).toEqual({});
    expect(resultado.datos?.pendientes).toEqual(['SIN_CHIP', 'SALUD']);
  });

  it('exige al menos un pendiente cuando el veredicto es CON_PENDIENTES', () => {
    const resultado = armarValidacion(formulario({ veredicto: 'CON_PENDIENTES', pendientes: [] }));

    expect(resultado.datos).toBeNull();
    expect(resultado.errores.pendientes).toBe('Marca al menos un pendiente o cambia el veredicto a aprobado.');
  });

  it('manda null en esterilizado cuando no se marcó, para no borrar un dato ya registrado', () => {
    expect(armarValidacion(formulario({ esterilizado: false })).datos?.esterilizado).toBeNull();
  });

  it('recorta los espacios y manda null si el microchip o las observaciones quedan vacíos', () => {
    const resultado = armarValidacion(formulario({ numeroMicrochip: '   ', observaciones: '  ' }));

    expect(resultado.datos?.numero_microchip).toBeNull();
    expect(resultado.datos?.observaciones).toBeNull();
  });

  it('recorta los espacios de un microchip y de unas observaciones reales', () => {
    const resultado = armarValidacion(formulario({ numeroMicrochip: ' 985112345 ', observaciones: ' Todo bien. ' }));

    expect(resultado.datos?.numero_microchip).toBe('985112345');
    expect(resultado.datos?.observaciones).toBe('Todo bien.');
  });

  it('rechaza un microchip con letras o con una longitud imposible', () => {
    expect(armarValidacion(formulario({ numeroMicrochip: 'ABC123' })).errores.numeroMicrochip).toBe(
      'El microchip debe tener entre 9 y 15 dígitos.',
    );
    expect(armarValidacion(formulario({ numeroMicrochip: '12345' })).errores.numeroMicrochip).toBe(
      'El microchip debe tener entre 9 y 15 dígitos.',
    );
  });

  it('acepta un microchip de 9 a 15 dígitos', () => {
    expect(armarValidacion(formulario({ numeroMicrochip: '123456789' })).errores).toEqual({});
    expect(armarValidacion(formulario({ numeroMicrochip: '123456789012345' })).errores).toEqual({});
  });
});
