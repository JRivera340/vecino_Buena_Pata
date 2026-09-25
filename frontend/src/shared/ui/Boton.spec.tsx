import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { renderizarConRutas } from '@/pruebas/render';
import { Boton, BotonEnlace } from './Boton';

describe('Boton', () => {
  it('llama al manejador al hacer clic', async () => {
    const alClic = vi.fn();
    render(<Boton onClick={alClic}>Guardar</Boton>);

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(alClic).toHaveBeenCalledTimes(1);
  });

  it('no es de tipo submit salvo que se pida', () => {
    render(<Boton>Aceptar</Boton>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('se bloquea y avisa que está ocupado mientras carga', async () => {
    const alClic = vi.fn();
    render(
      <Boton cargando onClick={alClic}>
        Enviando
      </Boton>,
    );
    const boton = screen.getByRole('button', { name: 'Enviando' });

    await userEvent.click(boton);

    expect(boton).toBeDisabled();
    expect(boton).toHaveAttribute('aria-busy', 'true');
    expect(alClic).not.toHaveBeenCalled();
  });

  it('no responde cuando está deshabilitado', async () => {
    const alClic = vi.fn();
    render(
      <Boton disabled onClick={alClic}>
        No disponible
      </Boton>,
    );

    await userEvent.click(screen.getByRole('button'));

    expect(alClic).not.toHaveBeenCalled();
  });
});

describe('BotonEnlace', () => {
  it('se muestra como enlace con su destino', () => {
    renderizarConRutas(<BotonEnlace to="/ingreso">Ingresar</BotonEnlace>);

    expect(screen.getByRole('link', { name: 'Ingresar' })).toHaveAttribute('href', '/ingreso');
  });
});
