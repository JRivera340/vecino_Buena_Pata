import { validarReactivacion, validarSalida, validarVisita } from './validar-seguimiento.lib';

const HOY = new Date('2026-09-25T15:00:00Z');

describe('validarVisita', () => {
  it('acepta una visita con comportamiento y sin peso', () => {
    const resultado = validarVisita({ comportamiento: ' Tranquilo ', peso: '', observaciones: '' });

    expect(resultado.errores).toEqual({});
    expect(resultado.datos).toEqual({
      estado_comportamiento: 'Tranquilo',
      peso_kg: null,
      observaciones: null,
    });
  });

  it('pide describir el comportamiento', () => {
    const resultado = validarVisita({ comportamiento: '  ', peso: '', observaciones: '' });

    expect(resultado.datos).toBeNull();
    expect(resultado.errores.comportamiento).toBe('Describe cómo se comporta el animal.');
  });

  it('acepta el peso con coma o con punto', () => {
    expect(validarVisita({ comportamiento: 'x', peso: '22,5', observaciones: '' }).datos?.peso_kg).toBe(22.5);
    expect(validarVisita({ comportamiento: 'x', peso: '22.5', observaciones: '' }).datos?.peso_kg).toBe(22.5);
  });

  it('rechaza un peso cero, negativo, exagerado o que no es un número', () => {
    const mensaje = 'El peso debe ser un número mayor que 0 y menor o igual a 120 kg.';
    for (const peso of ['0', '-3', '500', 'pesado']) {
      expect(validarVisita({ comportamiento: 'x', peso, observaciones: '' }).errores.peso).toBe(mensaje);
    }
  });

  it('recorta las observaciones y manda null si quedan vacías', () => {
    expect(validarVisita({ comportamiento: 'x', peso: '', observaciones: ' Ok ' }).datos?.observaciones).toBe('Ok');
  });
});

describe('validarSalida', () => {
  it('convierte la fecha a una marca de tiempo válida', () => {
    const resultado = validarSalida({ causal: 'ADOPCION', fecha: '2026-09-20', notas: ' Adoptado. ' }, HOY);

    expect(resultado.errores).toEqual({});
    expect(resultado.datos?.causal).toBe('ADOPCION');
    expect(resultado.datos?.fecha.startsWith('2026-09-20')).toBe(true);
    expect(resultado.datos?.notas).toBe('Adoptado.');
  });

  it('pide una fecha válida', () => {
    expect(validarSalida({ causal: 'PERDIDA', fecha: '', notas: '' }, HOY).errores.fecha).toBe('Elige la fecha de la salida.');
    expect(validarSalida({ causal: 'PERDIDA', fecha: 'ayer', notas: '' }, HOY).errores.fecha).toBe('Elige la fecha de la salida.');
  });

  it('no acepta una fecha futura', () => {
    expect(validarSalida({ causal: 'PERDIDA', fecha: '2026-10-30', notas: '' }, HOY).errores.fecha).toBe(
      'La fecha de la salida no puede ser posterior a hoy.',
    );
  });

  it('acepta la fecha de hoy', () => {
    expect(validarSalida({ causal: 'PERDIDA', fecha: '2026-09-25', notas: '' }, HOY).errores).toEqual({});
  });

  it('manda null cuando no hay notas', () => {
    expect(validarSalida({ causal: 'FALLECIMIENTO', fecha: '2026-09-20', notas: '   ' }, HOY).datos?.notas).toBeNull();
  });
});

describe('validarReactivacion', () => {
  it('pide describir el comportamiento al reaparecer', () => {
    expect(validarReactivacion({ comportamiento: '' }).errores.comportamiento).toBe(
      'Describe cómo se comporta el animal.',
    );
  });

  it('acepta un comportamiento y lo recorta', () => {
    expect(validarReactivacion({ comportamiento: ' Asustado ' }).datos?.estado_comportamiento).toBe('Asustado');
  });
});
