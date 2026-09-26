import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RutaProtegida } from './RutaProtegida';
import { useSesion } from './sesion.store';

function montar(ruta: string, roles?: Parameters<typeof RutaProtegida>[0]['roles']) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/ingreso" element={<p>Pantalla de ingreso</p>} />
        <Route path="/mapa" element={<p>Mapa de gestión</p>} />
        <Route
          path="/validacion"
          element={
            <RutaProtegida roles={roles}>
              <p>Bandeja de validación</p>
            </RutaProtegida>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RutaProtegida', () => {
  beforeEach(() => {
    sessionStorage.clear();
    useSesion.getState().cerrar();
  });

  it('manda al ingreso cuando no hay sesión', () => {
    montar('/validacion', ['VETERINARIO']);

    expect(screen.getByText('Pantalla de ingreso')).toBeInTheDocument();
  });

  it('muestra la pantalla cuando el rol está permitido', () => {
    useSesion.getState().iniciar({ token: 't', rol: 'VETERINARIO', nombre: 'Dr. Rojas' });

    montar('/validacion', ['VETERINARIO', 'ADMIN']);

    expect(screen.getByText('Bandeja de validación')).toBeInTheDocument();
  });

  it('manda al mapa cuando el rol no está permitido', () => {
    useSesion.getState().iniciar({ token: 't', rol: 'COMUNIDAD', nombre: 'Vecina' });

    montar('/validacion', ['VETERINARIO', 'ADMIN']);

    expect(screen.getByText('Mapa de gestión')).toBeInTheDocument();
  });

  it('deja pasar a cualquier sesión cuando no se piden roles', () => {
    useSesion.getState().iniciar({ token: 't', rol: 'LIDER', nombre: 'Lider' });

    montar('/validacion');

    expect(screen.getByText('Bandeja de validación')).toBeInTheDocument();
  });
});
