import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSesion } from '@/core/sesion/sesion.store';
import { renderizarConRutas } from '@/pruebas/render';
import { Encabezado } from './Encabezado';

const principal = () => screen.getAllByRole('navigation', { name: 'Principal' })[0];

describe('Encabezado', () => {
  beforeEach(() => {
    sessionStorage.clear();
    useSesion.getState().cerrar();
  });

  it('para el público muestra Inicio, Cómo funciona e Ingresar', () => {
    renderizarConRutas(<Encabezado />);

    expect(within(principal()).getByRole('link', { name: 'Inicio' })).toBeInTheDocument();
    expect(within(principal()).getByRole('link', { name: 'Cómo funciona' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Ingresar' }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Salir' })).not.toBeInTheDocument();
  });

  it('para el personal muestra los enlaces de su rol y su nombre', () => {
    useSesion.getState().iniciar({ token: 't', rol: 'VETERINARIO', nombre: 'Dr. Rojas' });
    renderizarConRutas(<Encabezado />, '/mapa');

    expect(within(principal()).getByRole('link', { name: 'Validar' })).toBeInTheDocument();
    expect(within(principal()).queryByRole('link', { name: 'Formalizar' })).not.toBeInTheDocument();
    expect(screen.getAllByText('Dr. Rojas').length).toBeGreaterThan(0);
  });

  it('marca la página actual', () => {
    useSesion.getState().iniciar({ token: 't', rol: 'ADMIN', nombre: 'Admin' });
    renderizarConRutas(<Encabezado />, '/reportes');

    expect(within(principal()).getByRole('link', { name: 'Reportes' })).toHaveAttribute('aria-current', 'page');
  });

  it('cierra la sesión y lleva al ingreso al pulsar Salir', async () => {
    useSesion.getState().iniciar({ token: 't', rol: 'ADMIN', nombre: 'Admin' });
    renderizarConRutas(<Encabezado />, '/mapa');

    await userEvent.click(screen.getAllByRole('button', { name: 'Salir' })[0]);

    expect(useSesion.getState().sesion).toBeNull();
    expect(screen.getByTestId('ubicacion')).toHaveTextContent('/ingreso');
  });

  it('abre y cierra el menú del celular con teclado', async () => {
    renderizarConRutas(<Encabezado />);

    await userEvent.click(screen.getByRole('button', { name: 'Abrir el menú' }));
    expect(screen.getByRole('dialog', { name: 'Menú' })).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Menú' })).not.toBeInTheDocument();
  });
});
