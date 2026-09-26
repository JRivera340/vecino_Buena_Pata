import { describe, expect, it } from 'vitest';
import { COLOR_SIN_ANIMALES, crearEscala, TONOS_VERDES } from './escala-coropletica.lib';

describe('crearEscala', () => {
  it('sin animales no hay rangos y todo va en gris', () => {
    const escala = crearEscala([0, 0, 0]);

    expect(escala.rangos).toEqual([]);
    expect(escala.colorDe(0)).toBe(COLOR_SIN_ANIMALES);
  });

  it('con un solo valor posible usa un rango y un tono medio', () => {
    const escala = crearEscala([0, 1, 1]);

    expect(escala.rangos).toHaveLength(1);
    expect(escala.rangos[0]).toMatchObject({
      desde: 1,
      hasta: 1,
      etiqueta: '1',
      color: TONOS_VERDES[3],
    });
  });

  it('reparte los valores en cinco rangos iguales cuando hay muchos', () => {
    const escala = crearEscala([0, 3, 12, 20]);

    expect(escala.rangos.map((r) => r.etiqueta)).toEqual([
      '1 a 4',
      '5 a 8',
      '9 a 12',
      '13 a 16',
      '17 o más',
    ]);
    expect(escala.rangos.map((r) => r.color)).toEqual([...TONOS_VERDES]);
  });

  it('cubre todos los valores sin huecos ni solapes', () => {
    const escala = crearEscala([7, 23, 0, 41]);

    for (let i = 1; i < escala.rangos.length; i += 1) {
      expect(escala.rangos[i].desde).toBe(escala.rangos[i - 1].hasta + 1);
    }
    expect(escala.rangos[0].desde).toBe(1);
    expect(escala.rangos[escala.rangos.length - 1].hasta).toBe(41);
  });

  it('con pocos animales usa menos rangos y tonos repartidos de claro a oscuro', () => {
    const escala = crearEscala([0, 2, 3]);

    expect(escala.rangos).toHaveLength(3);
    expect(escala.rangos.map((r) => r.color)).toEqual([
      TONOS_VERDES[0],
      TONOS_VERDES[2],
      TONOS_VERDES[4],
    ]);
  });

  it('colorDe da cada valor el tono de su rango y el gris al cero', () => {
    const escala = crearEscala([0, 10, 20]);

    expect(escala.colorDe(0)).toBe(COLOR_SIN_ANIMALES);
    expect(escala.colorDe(1)).toBe(TONOS_VERDES[0]);
    expect(escala.colorDe(20)).toBe(TONOS_VERDES[4]);
  });

  it('los tonos se oscurecen de forma continua', () => {
    const luminancia = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const valores = TONOS_VERDES.map(luminancia);

    expect([...valores].sort((a, b) => b - a)).toEqual(valores);
  });
});
