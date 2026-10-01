import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listarReportes } from '@/core/api/reportes';
import { useSesion } from '@/core/sesion/sesion.store';
import PaginaReportes from './PaginaReportes';

vi.mock('@/core/api/reportes', () => ({
  listarReportes: vi.fn(),
  registrarAtencion: vi.fn(),
}));
const listarMock = vi.mocked(listarReportes);

function reporte(id: number) {
  return {
    id,
    animal_id: 1,
    fecha: '2026-01-01T00:00:00Z',
    reportante_nombre: 'Vecino',
    comunidad_id: null,
    descripcion: 'No esta comiendo.',
    foto: null,
    latitud: null,
    longitud: null,
    estado: 'NUEVO' as const,
  };
}

describe('PaginaReportes', () => {
  beforeEach(() => {
    listarMock.mockReset();
    useSesion.getState().iniciar({ token: 't', rol: 'ADMIN', nombre: 'Admin' });
  });

  it('muestra los reportes de la primera pagina', async () => {
    listarMock.mockResolvedValue({ total: 1, items: [reporte(1)] });
    render(
      <MemoryRouter>
        <PaginaReportes />
      </MemoryRouter>,
    );

    expect((await screen.findAllByText('Vecino')).length).toBeGreaterThan(0);
    expect(listarMock).toHaveBeenCalledWith({ limit: 20, offset: 0, desde: '', hasta: '', estado: '' });
  });

  it('no muestra la paginacion cuando cabe todo en una pagina', async () => {
    listarMock.mockResolvedValue({ total: 1, items: [reporte(1)] });
    render(
      <MemoryRouter>
        <PaginaReportes />
      </MemoryRouter>,
    );

    await screen.findAllByText('Vecino');
    expect(screen.queryByRole('navigation', { name: /paginación/i })).not.toBeInTheDocument();
  });

  it('pide la segunda pagina al hacer clic en siguiente', async () => {
    listarMock.mockResolvedValue({ total: 25, items: [reporte(1)] });
    render(
      <MemoryRouter>
        <PaginaReportes />
      </MemoryRouter>,
    );

    await screen.findAllByText('Vecino');
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }));

    await waitFor(() => {
      expect(listarMock).toHaveBeenLastCalledWith({ limit: 20, offset: 20, desde: '', hasta: '', estado: '' });
    });
  });

  it('filtra por estado', async () => {
    listarMock.mockResolvedValue({ total: 1, items: [reporte(1)] });
    render(
      <MemoryRouter>
        <PaginaReportes />
      </MemoryRouter>,
    );

    await screen.findAllByText('Vecino');
    await userEvent.selectOptions(screen.getByLabelText(/estado/i), 'CERRADO');

    await waitFor(() => {
      expect(listarMock).toHaveBeenLastCalledWith({ limit: 20, offset: 0, desde: '', hasta: '', estado: 'CERRADO' });
    });
  });
});
