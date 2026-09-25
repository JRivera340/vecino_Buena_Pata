import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import { iniciarSesion } from '@/core/api/autenticacion';
import { ErrorApi } from '@/core/api/cliente';
import { useSesion } from '@/core/sesion/sesion.store';
import PaginaIngreso from './PaginaIngreso';

vi.mock('@/core/api/autenticacion', () => ({ iniciarSesion: vi.fn() }));
const ingresoMock = vi.mocked(iniciarSesion);

function montar(entrada: string | { pathname: string; state: unknown } = '/ingreso') {
  return render(
    <MemoryRouter initialEntries={[entrada]}>
      <Routes>
        <Route path="/ingreso" element={<PaginaIngreso />} />
        <Route path="/mapa" element={<p>Mapa de gestión</p>} />
        <Route path="/reportes" element={<p>Bandeja de reportes</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function escribirCredenciales(usuario = 'dr.rojas', clave = 'secreto') {
  await userEvent.type(screen.getByLabelText(/Usuario/), usuario);
  await userEvent.type(screen.getByLabelText(/Contraseña/), clave);
}

describe('PaginaIngreso', () => {
  beforeEach(() => {
    ingresoMock.mockReset();
    localStorage.clear();
    useSesion.getState().cerrar();
  });

  it('pide usuario y contraseña antes de enviar', async () => {
    montar();

    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(screen.getByText('Escribe tu usuario.')).toBeInTheDocument();
    expect(screen.getByText('Escribe tu contraseña.')).toBeInTheDocument();
    expect(ingresoMock).not.toHaveBeenCalled();
  });

  it('inicia sesión y lleva al mapa de gestión', async () => {
    ingresoMock.mockResolvedValue(undefined);
    montar();

    await escribirCredenciales(' dr.rojas ', 'secreto');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByText('Mapa de gestión')).toBeInTheDocument();
    expect(ingresoMock).toHaveBeenCalledWith('dr.rojas', 'secreto');
  });

  it('vuelve a la pantalla que se intentó abrir antes de ingresar', async () => {
    ingresoMock.mockResolvedValue(undefined);
    montar({ pathname: '/ingreso', state: { desde: '/reportes' } });

    await escribirCredenciales();
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByText('Bandeja de reportes')).toBeInTheDocument();
  });

  it('explica sin dar pistas cuando las credenciales no coinciden', async () => {
    ingresoMock.mockRejectedValue(new ErrorApi(401, 'Usuario o contrasena incorrectos'));
    montar();

    await escribirCredenciales();
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByText(/no coinciden/)).toBeInTheDocument();
    expect(screen.queryByText('Mapa de gestión')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeEnabled();
  });

  it('distingue un fallo de conexión de unas credenciales incorrectas', async () => {
    ingresoMock.mockRejectedValue(new ErrorApi(503, null));
    montar();

    await escribirCredenciales();
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByText(/No pudimos iniciar tu sesión/)).toBeInTheDocument();
  });

  it('permite mostrar y ocultar la contraseña', async () => {
    montar();
    const campo = screen.getByLabelText(/Contraseña/);
    expect(campo).toHaveAttribute('type', 'password');

    await userEvent.click(screen.getByRole('button', { name: 'Mostrar la contraseña' }));
    expect(campo).toHaveAttribute('type', 'text');

    await userEvent.click(screen.getByRole('button', { name: 'Ocultar la contraseña' }));
    expect(campo).toHaveAttribute('type', 'password');
  });

  it('manda directo al mapa a quien ya tiene sesión', () => {
    useSesion.getState().iniciar({ token: 't', rol: 'ADMIN', nombre: 'Admin' });

    montar();

    expect(screen.getByText('Mapa de gestión')).toBeInTheDocument();
  });
});
