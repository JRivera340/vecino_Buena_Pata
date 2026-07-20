import { Animal } from '../../core/models/animal.model';
import { Reporte } from '../../core/reportes/reportes.service';
import { calcularIndicadores } from './calcular-indicadores.lib';

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

function crearReporte(datos: Partial<Reporte>): Reporte {
  return {
    id: 1,
    animal_id: 1,
    fecha: '2026-01-01T00:00:00Z',
    reportante_nombre: 'Vecino anonimo',
    comunidad_id: null,
    descripcion: 'No esta comiendo.',
    foto: null,
    latitud: null,
    longitud: null,
    estado: 'NUEVO',
    ...datos,
  };
}

describe('calcularIndicadores', () => {
  it('cuenta el total de animales', () => {
    const animales = [crearAnimal({ id: 1 }), crearAnimal({ id: 2 })];
    const resultado = calcularIndicadores(animales, []);
    expect(resultado.totalAnimales).toBe(2);
  });

  it('cuenta los animales VBP_ACTIVO por separado', () => {
    const animales = [
      crearAnimal({ id: 1, estado: 'VBP_ACTIVO' }),
      crearAnimal({ id: 2, estado: 'CANDIDATO' }),
      crearAnimal({ id: 3, estado: 'VBP_ACTIVO' }),
    ];
    const resultado = calcularIndicadores(animales, []);
    expect(resultado.totalVbpActivos).toBe(2);
  });

  it('cuenta los reportes que no estan cerrados', () => {
    const reportes = [
      crearReporte({ id: 1, estado: 'NUEVO' }),
      crearReporte({ id: 2, estado: 'CERRADO' }),
      crearReporte({ id: 3, estado: 'EN_ATENCION' }),
    ];
    const resultado = calcularIndicadores([], reportes);
    expect(resultado.totalReportesAbiertos).toBe(2);
  });

  it('agrupa los animales por estado en el orden del ciclo de vida', () => {
    const animales = [
      crearAnimal({ id: 1, estado: 'CANDIDATO' }),
      crearAnimal({ id: 2, estado: 'ADOPTADO' }),
      crearAnimal({ id: 3, estado: 'CANDIDATO' }),
    ];
    const resultado = calcularIndicadores(animales, []);
    expect(resultado.conteoPorEstado).toEqual([
      { estado: 'CANDIDATO', cantidad: 2 },
      { estado: 'EN_PROCESO', cantidad: 0 },
      { estado: 'VBP_ACTIVO', cantidad: 0 },
      { estado: 'ADOPTADO', cantidad: 1 },
      { estado: 'PERDIDO', cantidad: 0 },
      { estado: 'FALLECIDO', cantidad: 0 },
    ]);
  });

  it('devuelve ceros cuando no hay animales ni reportes', () => {
    const resultado = calcularIndicadores([], []);
    expect(resultado.totalAnimales).toBe(0);
    expect(resultado.totalVbpActivos).toBe(0);
    expect(resultado.totalReportesAbiertos).toBe(0);
    expect(resultado.conteoPorEstado.every((c: any) => c.cantidad === 0)).toBe(true);
  });
});
