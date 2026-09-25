import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { esErrorDeCarga, LimiteError } from './LimiteError';

function Rompe(): never {
  throw new Error('fallo de prueba');
}

describe('esErrorDeCarga', () => {
  it('reconoce los errores de módulos que ya no existen', () => {
    expect(esErrorDeCarga(new TypeError('Failed to fetch dynamically imported module: /assets/x.js'))).toBe(true);
    expect(esErrorDeCarga(new TypeError('error loading dynamically imported module'))).toBe(true);
  });

  it('no confunde otros errores', () => {
    expect(esErrorDeCarga(new Error('Cannot read properties of undefined'))).toBe(false);
  });
});

describe('LimiteError', () => {
  afterEach(() => vi.restoreAllMocks());

  it('muestra un mensaje con opción de recargar en lugar de dejar la página en blanco', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <LimiteError>
        <Rompe />
      </LimiteError>,
    );

    expect(screen.getByRole('heading', { name: /algo salió mal/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Recargar la página' })).toBeInTheDocument();
  });

  it('muestra el contenido cuando no hay errores', () => {
    render(
      <LimiteError>
        <p>Todo bien</p>
      </LimiteError>,
    );

    expect(screen.getByText('Todo bien')).toBeInTheDocument();
  });
});
