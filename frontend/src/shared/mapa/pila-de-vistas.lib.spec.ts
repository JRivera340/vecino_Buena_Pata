import { describe, expect, it } from 'vitest';
import { PilaDeVistas } from './pila-de-vistas.lib';

describe('PilaDeVistas', () => {
  it('devuelve las vistas en orden inverso al que se guardaron', () => {
    const pila = new PilaDeVistas();
    pila.empujar({ centro: [4.6, -74.08], zoom: 11 });
    pila.empujar({ centro: [4.61, -74.07], zoom: 13 });

    expect(pila.sacar()).toEqual({ centro: [4.61, -74.07], zoom: 13 });
    expect(pila.sacar()).toEqual({ centro: [4.6, -74.08], zoom: 11 });
    expect(pila.sacar()).toBeUndefined();
  });

  it('no repite dos veces seguidas la misma vista', () => {
    const pila = new PilaDeVistas();
    pila.empujar({ centro: [4.6, -74.08], zoom: 11 });
    pila.empujar({ centro: [4.6, -74.08], zoom: 11 });

    expect(pila.tamano).toBe(1);
  });

  it('guarda una copia: cambiar el original no altera lo guardado', () => {
    const pila = new PilaDeVistas();
    const vista = { centro: [4.6, -74.08] as [number, number], zoom: 11 };
    pila.empujar(vista);
    vista.centro[0] = 0;

    expect(pila.sacar()?.centro[0]).toBe(4.6);
  });

  it('se puede vaciar', () => {
    const pila = new PilaDeVistas();
    pila.empujar({ centro: [1, 1], zoom: 1 });
    pila.limpiar();

    expect(pila.tamano).toBe(0);
  });
});
