import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { vi } from 'vitest';
import { Modal } from './Modal';

describe('Modal', () => {
  it('no muestra nada cuando está cerrado', () => {
    render(
      <Modal abierto={false} titulo="Salida" alCerrar={() => undefined}>
        Contenido
      </Modal>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('se anuncia como diálogo con su título', () => {
    render(
      <Modal abierto titulo="Registrar la salida" alCerrar={() => undefined}>
        Contenido
      </Modal>,
    );

    expect(screen.getByRole('dialog', { name: 'Registrar la salida' })).toBeInTheDocument();
  });

  it('se cierra con la tecla Escape', async () => {
    const alCerrar = vi.fn();
    render(
      <Modal abierto titulo="Salida" alCerrar={alCerrar}>
        Contenido
      </Modal>,
    );

    await userEvent.keyboard('{Escape}');

    expect(alCerrar).toHaveBeenCalledTimes(1);
  });

  it('se cierra con el botón de cerrar', async () => {
    const alCerrar = vi.fn();
    render(
      <Modal abierto titulo="Salida" alCerrar={alCerrar}>
        Contenido
      </Modal>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }));

    expect(alCerrar).toHaveBeenCalled();
  });

  it('mantiene el foco dentro con la tecla Tab', async () => {
    render(
      <Modal abierto titulo="Salida" alCerrar={() => undefined} pie={<button type="button">Confirmar</button>}>
        <input aria-label="Notas" />
      </Modal>,
    );

    for (let i = 0; i < 6; i += 1) {
      await userEvent.tab();
      expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement);
    }
  });

  it('devuelve el foco al botón que lo abrió', async () => {
    function Prueba() {
      const [abierto, setAbierto] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setAbierto(true)}>
            Abrir
          </button>
          <Modal abierto={abierto} titulo="Salida" alCerrar={() => setAbierto(false)}>
            Contenido
          </Modal>
        </>
      );
    }
    render(<Prueba />);
    const abrir = screen.getByRole('button', { name: 'Abrir' });

    await userEvent.click(abrir);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(abrir).toHaveFocus();
  });
});
