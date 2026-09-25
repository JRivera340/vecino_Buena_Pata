import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { Paginacion } from './Paginacion';

describe('Paginacion', () => {
  it('no se muestra si hay una sola página', () => {
    render(<Paginacion pagina={1} totalPaginas={1} alCambiar={() => undefined} />);
    expect(screen.queryByRole('navigation', { name: 'Paginación' })).not.toBeInTheDocument();
  });

  it('marca la página actual', () => {
    render(<Paginacion pagina={3} totalPaginas={5} alCambiar={() => undefined} />);
    expect(screen.getByRole('button', { name: 'Página 3' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Página 2' })).not.toHaveAttribute('aria-current');
  });

  it('cambia de página con los números y con Anterior y Siguiente', async () => {
    const alCambiar = vi.fn();
    render(<Paginacion pagina={3} totalPaginas={5} alCambiar={alCambiar} />);

    await userEvent.click(screen.getByRole('button', { name: 'Página 5' }));
    await userEvent.click(screen.getByRole('button', { name: /Anterior/ }));
    await userEvent.click(screen.getByRole('button', { name: /Siguiente/ }));

    expect(alCambiar.mock.calls.map(([pagina]) => pagina)).toEqual([5, 2, 4]);
  });

  it('desactiva Anterior en la primera página y Siguiente en la última', () => {
    const { rerender } = render(<Paginacion pagina={1} totalPaginas={4} alCambiar={() => undefined} />);
    expect(screen.getByRole('button', { name: /Anterior/ })).toBeDisabled();

    rerender(<Paginacion pagina={4} totalPaginas={4} alCambiar={() => undefined} />);
    expect(screen.getByRole('button', { name: /Siguiente/ })).toBeDisabled();
  });
});
