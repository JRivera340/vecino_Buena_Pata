import { describe, expect, it } from 'vitest';
import type { Animal } from '@/core/modelos/animal';
import {
  FILTROS_INICIALES,
  filtrarAnimalesIndicadores,
  parametrosIndicadores,
  validarRango,
} from './filtros-indicadores.lib';

function animal(cambios: Partial<Animal>): Animal {
  return {
    id: 1,
    nombre: 'A',
    especie: 'PERRO',
    sexo: 'MACHO',
    edad_estimada: null,
    tamano: 'MEDIANO',
    descripcion: null,
    foto_principal: null,
    estado: 'CANDIDATO',
    esterilizado: false,
    numero_microchip: null,
    barrio: 'b',
    latitud: 4.6,
    longitud: -74.07,
    comunidad_id: 1,
    causal_salida: null,
    fecha_salida: null,
    notas_salida: null,
    fecha_inscripcion: '2026-08-05T15:00:00Z',
    inscrito_por: 'demo',
    ...cambios,
  };
}

describe('parametrosIndicadores', () => {
  it('sin filtros no manda nada', () => {
    expect(parametrosIndicadores(FILTROS_INICIALES).toString()).toBe('');
  });

  it('manda solo los filtros elegidos', () => {
    const parametros = parametrosIndicadores({
      desde: '2026-08-01',
      hasta: '',
      estado: 'VBP_ACTIVO',
      especie: 'GATO',
    });

    expect(parametros.toString()).toBe('desde=2026-08-01&estado=VBP_ACTIVO&especie=GATO');
  });
});

describe('validarRango', () => {
  it('acepta rangos ordenados, abiertos o vacíos', () => {
    expect(
      validarRango({ ...FILTROS_INICIALES, desde: '2026-08-01', hasta: '2026-08-31' }),
    ).toBeNull();
    expect(validarRango({ ...FILTROS_INICIALES, desde: '2026-08-01' })).toBeNull();
    expect(validarRango(FILTROS_INICIALES)).toBeNull();
  });

  it('rechaza una fecha inicial posterior a la final', () => {
    expect(
      validarRango({ ...FILTROS_INICIALES, desde: '2026-09-01', hasta: '2026-08-01' }),
    ).toMatch(/no puede ser posterior/);
  });
});

describe('filtrarAnimalesIndicadores', () => {
  const animales = [
    animal({
      id: 1,
      estado: 'VBP_ACTIVO',
      especie: 'PERRO',
      fecha_inscripcion: '2026-07-10T15:00:00Z',
    }),
    animal({
      id: 2,
      estado: 'CANDIDATO',
      especie: 'GATO',
      fecha_inscripcion: '2026-08-20T15:00:00Z',
    }),
    animal({
      id: 3,
      estado: 'VBP_ACTIVO',
      especie: 'GATO',
      fecha_inscripcion: '2026-09-01T15:00:00Z',
    }),
  ];
  const ids = (lista: Animal[]) => lista.map((a) => a.id);

  it('sin filtros deja pasar a todos', () => {
    expect(ids(filtrarAnimalesIndicadores(animales, FILTROS_INICIALES))).toEqual([1, 2, 3]);
  });

  it('filtra por estado y por especie', () => {
    expect(
      ids(filtrarAnimalesIndicadores(animales, { ...FILTROS_INICIALES, estado: 'VBP_ACTIVO' })),
    ).toEqual([1, 3]);
    expect(
      ids(filtrarAnimalesIndicadores(animales, { ...FILTROS_INICIALES, especie: 'GATO' })),
    ).toEqual([2, 3]);
  });

  it('el último día del rango cuenta completo', () => {
    const rango = { ...FILTROS_INICIALES, desde: '2026-08-01', hasta: '2026-08-20' };

    expect(ids(filtrarAnimalesIndicadores(animales, rango))).toEqual([2]);
  });

  it('compara por día de Bogotá: una inscripción a las 2 a. m. UTC cae el día anterior', () => {
    const tarde = [animal({ id: 9, fecha_inscripcion: '2026-08-21T02:00:00Z' })];

    expect(
      ids(filtrarAnimalesIndicadores(tarde, { ...FILTROS_INICIALES, hasta: '2026-08-20' })),
    ).toEqual([9]);
  });
});
