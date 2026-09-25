import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import { ErrorApi } from '@/core/api/cliente';
import { crearReportePublico, obtenerAnimalPorCodigo } from '@/core/api/publico';
import type { AnimalPublico } from '@/core/modelos/publico';
import PaginaQr from './PaginaQr';

vi.mock('@/core/api/publico', () => ({
  obtenerAnimalPorCodigo: vi.fn(),
  crearReportePublico: vi.fn(),
}));
const animalMock = vi.mocked(obtenerAnimalPorCodigo);
const reporteMock = vi.mocked(crearReportePublico);

const ANIMAL: AnimalPublico = {
  id: 2,
  nombre: 'Lulú',
  especie: 'PERRO',
  sexo: 'HEMBRA',
  tamano: 'MEDIANO',
  descripcion: 'Sociable.',
  foto_principal: null,
  estado: 'VBP_ACTIVO',
  barrio: 'Teusaquillo',
  fecha_inscripcion: '2026-09-25T15:00:00Z',
};

function montar() {
  return render(
    <MemoryRouter initialEntries={['/v/vbp-abc123']}>
      <Routes>
        <Route path="/v/:codigo" element={<PaginaQr />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PaginaQr', () => {
  beforeEach(() => {
    animalMock.mockReset();
    reporteMock.mockReset();
  });

  it('abre la ficha del animal a partir del código del collar', async () => {
    animalMock.mockResolvedValue(ANIMAL);
    montar();

    expect(await screen.findByRole('heading', { level: 1, name: 'Lulú' })).toBeInTheDocument();
    expect(animalMock).toHaveBeenCalledWith('vbp-abc123');
    expect(screen.getByText('Perro hembra de tamaño mediano, del barrio Teusaquillo.')).toBeInTheDocument();
  });

  it('no muestra coordenadas ni datos internos del animal', async () => {
    animalMock.mockResolvedValue(ANIMAL);
    montar();

    await screen.findByRole('heading', { level: 1, name: 'Lulú' });

    expect(document.body).not.toHaveTextContent(/latitud|longitud|inscrito_por/i);
  });

  it('pide los dos campos obligatorios antes de enviar', async () => {
    animalMock.mockResolvedValue(ANIMAL);
    montar();
    await screen.findByRole('heading', { level: 1, name: 'Lulú' });

    await userEvent.click(screen.getByRole('button', { name: 'Enviar reporte' }));

    expect(screen.getByText('Escribe tu nombre para que sepamos quién avisa.')).toBeInTheDocument();
    expect(screen.getByText('Cuéntanos qué observaste.')).toBeInTheDocument();
    expect(reporteMock).not.toHaveBeenCalled();
  });

  it('trata como vacío un texto de solo espacios', async () => {
    animalMock.mockResolvedValue(ANIMAL);
    montar();
    await screen.findByRole('heading', { level: 1, name: 'Lulú' });

    await userEvent.type(screen.getByLabelText(/Tu nombre/), '   ');
    await userEvent.type(screen.getByLabelText(/Qué observaste/), '   ');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar reporte' }));

    expect(reporteMock).not.toHaveBeenCalled();
  });

  it('envía el reporte al código del collar y confirma', async () => {
    animalMock.mockResolvedValue(ANIMAL);
    reporteMock.mockResolvedValue({ id: 1, animal_id: 2, fecha: '2026-09-25T15:00:00Z', estado: 'NUEVO' });
    montar();
    await screen.findByRole('heading', { level: 1, name: 'Lulú' });

    await userEvent.type(screen.getByLabelText(/Tu nombre/), '  Vecina Marta ');
    await userEvent.type(screen.getByLabelText(/Qué observaste/), 'Tiene una pata lastimada.');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar reporte' }));

    expect(await screen.findByText('Gracias, recibimos tu reporte')).toBeInTheDocument();
    expect(reporteMock).toHaveBeenCalledWith('vbp-abc123', {
      reportante_nombre: 'Vecina Marta',
      descripcion: 'Tiene una pata lastimada.',
      foto: null,
      latitud: null,
      longitud: null,
    });
    expect(screen.queryByRole('button', { name: 'Enviar reporte' })).not.toBeInTheDocument();
  });

  it('cuenta los caracteres de la descripción', async () => {
    animalMock.mockResolvedValue(ANIMAL);
    montar();
    await screen.findByRole('heading', { level: 1, name: 'Lulú' });

    await userEvent.type(screen.getByLabelText(/Qué observaste/), 'Hola');

    expect(screen.getByText('4 de 1000 caracteres')).toBeInTheDocument();
  });

  it('explica el error y conserva lo escrito cuando el envío falla', async () => {
    animalMock.mockResolvedValue(ANIMAL);
    reporteMock.mockRejectedValue(new ErrorApi(503, null));
    montar();
    await screen.findByRole('heading', { level: 1, name: 'Lulú' });

    await userEvent.type(screen.getByLabelText(/Tu nombre/), 'Marta');
    await userEvent.type(screen.getByLabelText(/Qué observaste/), 'Cojea.');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar reporte' }));

    expect(await screen.findByText(/No pudimos enviar tu reporte/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Qué observaste/)).toHaveValue('Cojea.');
  });

  it('dice que el código ya no está activo si el collar fue dado de baja', async () => {
    animalMock.mockResolvedValue(ANIMAL);
    reporteMock.mockRejectedValue(new ErrorApi(404, 'Codigo no encontrado.'));
    montar();
    await screen.findByRole('heading', { level: 1, name: 'Lulú' });

    await userEvent.type(screen.getByLabelText(/Tu nombre/), 'Marta');
    await userEvent.type(screen.getByLabelText(/Qué observaste/), 'Cojea.');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar reporte' }));

    expect(await screen.findByText(/Este código ya no está activo/)).toBeInTheDocument();
  });

  it('explica cuando el código no existe', async () => {
    animalMock.mockRejectedValue(new ErrorApi(404, 'Codigo no encontrado.'));
    montar();

    expect(await screen.findByRole('heading', { name: 'No encontramos este código' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('distingue un fallo de conexión de un código inexistente', async () => {
    animalMock.mockRejectedValue(new ErrorApi(503, null));
    montar();

    expect(await screen.findByRole('heading', { name: 'No pudimos abrir la ficha' })).toBeInTheDocument();
  });
});
