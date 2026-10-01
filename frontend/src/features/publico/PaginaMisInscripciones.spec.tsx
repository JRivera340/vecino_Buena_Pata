import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { verificarInscriptor } from '@/core/api/inscripcion-publica';
import PaginaMisInscripciones from './PaginaMisInscripciones';

vi.mock('@/core/api/inscripcion-publica', () => ({ verificarInscriptor: vi.fn() }));
const verificarMock = vi.mocked(verificarInscriptor);

describe('PaginaMisInscripciones', () => {
  beforeEach(() => {
    verificarMock.mockReset();
  });

  it('muestra los animales de la cedula consultada', async () => {
    verificarMock.mockResolvedValue({
      total: 1,
      animales: [
        {
          id: 1,
          nombre: 'Rocky',
          especie: 'PERRO',
          sexo: 'MACHO',
          tamano: 'MEDIANO',
          edad_estimada: 2,
          descripcion: null,
          foto_principal: null,
          estado: 'VBP_ACTIVO',
          esterilizado: true,
          tiene_microchip: true,
          barrio: 'X',
          fecha_inscripcion: '2026-01-01T00:00:00Z',
        },
      ],
    });
    render(<PaginaMisInscripciones />);

    await userEvent.type(screen.getByLabelText(/número de documento/i), '1020304050');
    await userEvent.click(screen.getByRole('button', { name: /consultar/i }));

    expect(await screen.findByText('Rocky')).toBeInTheDocument();
    expect(verificarMock).toHaveBeenCalledWith({
      tipo_documento: 'CC',
      numero_documento: '1020304050',
    });
  });

  it('muestra un mensaje cuando no hay inscripciones', async () => {
    verificarMock.mockResolvedValue({ total: 0, animales: [] });
    render(<PaginaMisInscripciones />);

    await userEvent.type(screen.getByLabelText(/número de documento/i), '1020304050');
    await userEvent.click(screen.getByRole('button', { name: /consultar/i }));

    expect(await screen.findByText(/no encontramos inscripciones/i)).toBeInTheDocument();
  });

  it('valida el documento antes de consultar', async () => {
    render(<PaginaMisInscripciones />);

    await userEvent.click(screen.getByRole('button', { name: /consultar/i }));

    expect(await screen.findByText(/escribe tu número de documento/i)).toBeInTheDocument();
    expect(verificarMock).not.toHaveBeenCalled();
  });
});
