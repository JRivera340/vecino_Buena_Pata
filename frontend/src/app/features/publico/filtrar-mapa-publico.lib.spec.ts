import { AnimalMapaPublico } from '../../core/models/publico.model';
import { CriteriosFiltroMapaPublico, filtrarMapaPublico } from './filtrar-mapa-publico.lib';

function crearAnimal(datos: Partial<AnimalMapaPublico>): AnimalMapaPublico {
  return {
    id: 1,
    nombre: 'Rocky',
    especie: 'PERRO',
    foto_principal: null,
    barrio: 'La Esperanza',
    latitud: 4.6095,
    longitud: -74.0805,
    ...datos,
  };
}

function criteriosBase(): CriteriosFiltroMapaPublico {
  return { busqueda: '', especie: 'TODAS', barrio: 'TODOS' };
}

describe('filtrarMapaPublico', () => {
  it('sin criterios devuelve todos los animales', () => {
    const animales = [crearAnimal({ id: 1 }), crearAnimal({ id: 2 })];
    expect(filtrarMapaPublico(animales, criteriosBase()).map((a) => a.id)).toEqual([1, 2]);
  });

  it('busca por nombre sin distinguir mayusculas ni tildes', () => {
    const animales = [crearAnimal({ id: 1, nombre: 'Lulu' }), crearAnimal({ id: 2, nombre: 'Rocky' })];
    const resultado = filtrarMapaPublico(animales, { ...criteriosBase(), busqueda: 'LULÚ' });
    expect(resultado.map((a) => a.id)).toEqual([1]);
  });

  it('ignora los espacios alrededor de la busqueda', () => {
    const animales = [crearAnimal({ id: 1, nombre: 'Rocky' })];
    const resultado = filtrarMapaPublico(animales, { ...criteriosBase(), busqueda: '  rock  ' });
    expect(resultado.map((a) => a.id)).toEqual([1]);
  });

  it('filtra por especie', () => {
    const animales = [crearAnimal({ id: 1, especie: 'PERRO' }), crearAnimal({ id: 2, especie: 'GATO' })];
    const resultado = filtrarMapaPublico(animales, { ...criteriosBase(), especie: 'GATO' });
    expect(resultado.map((a) => a.id)).toEqual([2]);
  });

  it('filtra por barrio', () => {
    const animales = [crearAnimal({ id: 1, barrio: 'Bosa' }), crearAnimal({ id: 2, barrio: 'Usme' })];
    const resultado = filtrarMapaPublico(animales, { ...criteriosBase(), barrio: 'Usme' });
    expect(resultado.map((a) => a.id)).toEqual([2]);
  });

  it('combina los criterios', () => {
    const animales = [
      crearAnimal({ id: 1, nombre: 'Lulu', especie: 'PERRO', barrio: 'Bosa' }),
      crearAnimal({ id: 2, nombre: 'Lulu', especie: 'GATO', barrio: 'Bosa' }),
      crearAnimal({ id: 3, nombre: 'Lulu', especie: 'PERRO', barrio: 'Usme' }),
    ];
    const resultado = filtrarMapaPublico(animales, { busqueda: 'lulu', especie: 'PERRO', barrio: 'Bosa' });
    expect(resultado.map((a) => a.id)).toEqual([1]);
  });

  it('devuelve una lista vacia si nada coincide', () => {
    const resultado = filtrarMapaPublico([crearAnimal({})], { ...criteriosBase(), busqueda: 'zzz' });
    expect(resultado).toEqual([]);
  });
});
