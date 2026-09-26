import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ControlLocalidades } from './ControlLocalidades';

const NOMBRES = ['Bosa', 'Chapinero', 'Ciudad Bolívar', 'Santa Fe'];

function abrir(seleccionada: string | null = null) {
  const alElegir = vi.fn();
  render(<ControlLocalidades nombres={NOMBRES} seleccionada={seleccionada} alElegir={alElegir} />);
  return { alElegir, usuario: userEvent.setup() };
}

describe('ControlLocalidades', () => {
  it('empieza cerrado y se abre con el botón', async () => {
    const { usuario } = abrir();

    expect(screen.queryByRole('button', { name: 'Bosa' })).not.toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: /localidades/i }));

    expect(screen.getByRole('button', { name: 'Bosa' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toHaveFocus();
  });

  it('filtra al escribir, sin importar tildes', async () => {
    const { usuario } = abrir();
    await usuario.click(screen.getByRole('button', { name: /localidades/i }));

    await usuario.type(screen.getByRole('searchbox'), 'bolivar');

    expect(screen.getByRole('button', { name: 'Ciudad Bolívar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Bosa' })).not.toBeInTheDocument();
  });

  it('avisa cuando nada coincide', async () => {
    const { usuario } = abrir();
    await usuario.click(screen.getByRole('button', { name: /localidades/i }));

    await usuario.type(screen.getByRole('searchbox'), 'zzz');

    expect(screen.getByText('Ninguna localidad coincide.')).toBeInTheDocument();
  });

  it('elige con Enter después de moverse con las flechas y se cierra', async () => {
    const { usuario, alElegir } = abrir();
    await usuario.click(screen.getByRole('button', { name: /localidades/i }));

    await usuario.keyboard('{ArrowDown}{ArrowDown}{Enter}');

    expect(alElegir).toHaveBeenCalledWith('Chapinero');
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });

  it('vuelve al buscador con la flecha arriba desde la primera opción', async () => {
    const { usuario } = abrir();
    await usuario.click(screen.getByRole('button', { name: /localidades/i }));

    await usuario.keyboard('{ArrowDown}{ArrowUp}');

    expect(screen.getByRole('searchbox')).toHaveFocus();
  });

  it('Escape cierra y devuelve el foco al botón', async () => {
    const { usuario } = abrir();
    const disparador = screen.getByRole('button', { name: /localidades/i });
    await usuario.click(disparador);

    await usuario.keyboard('{Escape}');

    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(disparador).toHaveFocus();
  });

  it('marca la localidad elegida y la suelta al elegirla otra vez', async () => {
    const { usuario, alElegir } = abrir('Santa Fe');
    await usuario.click(screen.getByRole('button', { name: /localidades/i }));

    const activa = screen.getByRole('button', { name: 'Santa Fe', pressed: true });
    await usuario.click(activa);

    expect(alElegir).toHaveBeenCalledWith(null);
  });
});
