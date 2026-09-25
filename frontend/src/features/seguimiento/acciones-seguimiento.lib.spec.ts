import { Animal } from '@/core/modelos/animal';
import { puedeReactivar, puedeRegistrarSalida, puedeRegistrarVisita } from './acciones-seguimiento.lib';

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

describe('puedeRegistrarVisita', () => {
  it('permite a VETERINARIO cuando el animal esta VBP_ACTIVO', () => {
    const animal = crearAnimal({ estado: 'VBP_ACTIVO' });
    expect(puedeRegistrarVisita(animal, 'VETERINARIO')).toBe(true);
  });

  it('permite a ADMIN cuando el animal esta VBP_ACTIVO', () => {
    const animal = crearAnimal({ estado: 'VBP_ACTIVO' });
    expect(puedeRegistrarVisita(animal, 'ADMIN')).toBe(true);
  });

  it('rechaza a LIDER', () => {
    const animal = crearAnimal({ estado: 'VBP_ACTIVO' });
    expect(puedeRegistrarVisita(animal, 'LIDER')).toBe(false);
  });

  it('rechaza si el animal no esta VBP_ACTIVO', () => {
    const animal = crearAnimal({ estado: 'CANDIDATO' });
    expect(puedeRegistrarVisita(animal, 'VETERINARIO')).toBe(false);
  });
});

describe('puedeRegistrarSalida', () => {
  it('permite a LIDER cuando el animal esta VBP_ACTIVO', () => {
    const animal = crearAnimal({ estado: 'VBP_ACTIVO' });
    expect(puedeRegistrarSalida(animal, 'LIDER')).toBe(true);
  });

  it('permite a VETERINARIO y ADMIN', () => {
    const animal = crearAnimal({ estado: 'VBP_ACTIVO' });
    expect(puedeRegistrarSalida(animal, 'VETERINARIO')).toBe(true);
    expect(puedeRegistrarSalida(animal, 'ADMIN')).toBe(true);
  });

  it('rechaza a COMUNIDAD', () => {
    const animal = crearAnimal({ estado: 'VBP_ACTIVO' });
    expect(puedeRegistrarSalida(animal, 'COMUNIDAD')).toBe(false);
  });

  it('rechaza si el animal no esta VBP_ACTIVO', () => {
    const animal = crearAnimal({ estado: 'PERDIDO' });
    expect(puedeRegistrarSalida(animal, 'LIDER')).toBe(false);
  });
});

describe('puedeReactivar', () => {
  it('permite a VETERINARIO y ADMIN cuando el animal esta PERDIDO', () => {
    const animal = crearAnimal({ estado: 'PERDIDO' });
    expect(puedeReactivar(animal, 'VETERINARIO')).toBe(true);
    expect(puedeReactivar(animal, 'ADMIN')).toBe(true);
  });

  it('rechaza a LIDER', () => {
    const animal = crearAnimal({ estado: 'PERDIDO' });
    expect(puedeReactivar(animal, 'LIDER')).toBe(false);
  });

  it('rechaza si el animal no esta PERDIDO', () => {
    const animal = crearAnimal({ estado: 'VBP_ACTIVO' });
    expect(puedeReactivar(animal, 'VETERINARIO')).toBe(false);
  });

  it('rechaza cuando el rol es indefinido', () => {
    const animal = crearAnimal({ estado: 'PERDIDO' });
    expect(puedeReactivar(animal, undefined)).toBe(false);
  });
});
