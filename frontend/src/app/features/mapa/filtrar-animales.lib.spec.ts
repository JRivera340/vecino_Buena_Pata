import { Animal } from '../../core/models/animal.model';
import { CriteriosFiltroAnimales, filtrarAnimales } from './filtrar-animales.lib';

function crearAnimal(datos: Partial<Animal>): Animal {
  return {
    id: 1,
    nombre: 'Rocky',
    especie: 'PERRO',
    sexo: 'MACHO',
    edad_estimada: null,
    tamano: 'MEDIANO',
    descripcion: null,
    foto_principal: null,
    estado: 'VBP_ACTIVO',
    esterilizado: true,
    numero_microchip: null,
    barrio: 'El Poblado',
    latitud: 4.65,
    longitud: -74.1,
    comunidad_id: 1,
    causal_salida: null,
    fecha_salida: null,
    notas_salida: null,
    fecha_inscripcion: '2026-01-01T00:00:00Z',
    inscrito_por: 'maria.comunidad',
    ...datos,
  };
}

function criteriosBase(): CriteriosFiltroAnimales {
  return { busqueda: '', estado: 'TODOS', barrio: 'TODOS', comunidadId: 'TODOS', mostrarSalidos: false };
}

describe('filtrarAnimales', () => {
  it('excluye animales salidos por defecto', () => {
    const animales = [crearAnimal({ id: 1, estado: 'VBP_ACTIVO' }), crearAnimal({ id: 2, estado: 'ADOPTADO' })];
    const resultado = filtrarAnimales(animales, criteriosBase());
    expect(resultado.map((a) => a.id)).toEqual([1]);
  });

  it('incluye animales salidos cuando mostrarSalidos es true', () => {
    const animales = [crearAnimal({ id: 1, estado: 'VBP_ACTIVO' }), crearAnimal({ id: 2, estado: 'ADOPTADO' })];
    const resultado = filtrarAnimales(animales, { ...criteriosBase(), mostrarSalidos: true });
    expect(resultado.map((a) => a.id).sort()).toEqual([1, 2]);
  });

  it('filtra por texto de busqueda sin distinguir mayusculas', () => {
    const animales = [crearAnimal({ id: 1, nombre: 'Rocky' }), crearAnimal({ id: 2, nombre: 'Canela' })];
    const resultado = filtrarAnimales(animales, { ...criteriosBase(), busqueda: 'roc' });
    expect(resultado.map((a) => a.id)).toEqual([1]);
  });

  it('filtra por estado especifico', () => {
    const animales = [crearAnimal({ id: 1, estado: 'VBP_ACTIVO' }), crearAnimal({ id: 2, estado: 'CANDIDATO' })];
    const resultado = filtrarAnimales(animales, { ...criteriosBase(), estado: 'CANDIDATO' });
    expect(resultado.map((a) => a.id)).toEqual([2]);
  });

  it('filtra por barrio', () => {
    const animales = [crearAnimal({ id: 1, barrio: 'El Poblado' }), crearAnimal({ id: 2, barrio: 'Las Cruces' })];
    const resultado = filtrarAnimales(animales, { ...criteriosBase(), barrio: 'Las Cruces' });
    expect(resultado.map((a) => a.id)).toEqual([2]);
  });

  it('filtra por comunidad', () => {
    const animales = [crearAnimal({ id: 1, comunidad_id: 1 }), crearAnimal({ id: 2, comunidad_id: 2 })];
    const resultado = filtrarAnimales(animales, { ...criteriosBase(), comunidadId: 2 });
    expect(resultado.map((a) => a.id)).toEqual([2]);
  });

  it('combina varios criterios a la vez', () => {
    const animales = [
      crearAnimal({ id: 1, nombre: 'Rocky', barrio: 'El Poblado', estado: 'VBP_ACTIVO' }),
      crearAnimal({ id: 2, nombre: 'Rocky', barrio: 'Las Cruces', estado: 'VBP_ACTIVO' }),
    ];
    const resultado = filtrarAnimales(animales, { ...criteriosBase(), busqueda: 'rocky', barrio: 'El Poblado' });
    expect(resultado.map((a) => a.id)).toEqual([1]);
  });
});
