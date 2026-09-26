import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorApi } from '@/core/api/cliente';
import PaginaInscribirPublico from './PaginaInscribirPublico';

const verificarInscriptor = vi.fn();
// Una función común (no un espía) para simular un rechazo sin promesas derivadas sin manejar.
let rechazo: (() => Promise<never>) | null = null;

vi.mock('@/core/api/inscripcion-publica', () => ({
  listarComunidadesPublicas: vi.fn().mockResolvedValue([]),
  verificarInscriptor: (...args: unknown[]) => (rechazo ? rechazo() : verificarInscriptor(...args)),
  inscribirComoPublico: vi.fn(),
}));

vi.mock('@/shared/mapa/MapaTerritorio', () => ({ MapaTerritorio: () => <div>mapa</div> }));

function abrir() {
  return render(
    <MemoryRouter>
      <PaginaInscribirPublico />
    </MemoryRouter>,
  );
}

async function escribirDocumento(numero: string) {
  const usuario = userEvent.setup();
  await usuario.type(screen.getByLabelText(/número de documento/i), numero);
  await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
}

const previo = {
  id: 1,
  nombre: 'Copito',
  especie: 'PERRO',
  sexo: 'MACHO',
  tamano: 'PEQUENO',
  edad_estimada: 4,
  descripcion: null,
  foto_principal: null,
  estado: 'CANDIDATO',
  esterilizado: false,
  tiene_microchip: false,
  barrio: 'Las Cruces',
  fecha_inscripcion: '2026-09-20T10:00:00Z',
};

describe('PaginaInscribirPublico', () => {
  beforeEach(() => {
    verificarInscriptor.mockReset();
    rechazo = null;
  });

  it('pide el documento antes que cualquier otro dato', () => {
    abrir();

    expect(screen.getByRole('heading', { name: 'Primero, tu documento' })).toBeInTheDocument();
    expect(screen.queryByLabelText(/nombre del animal/i)).not.toBeInTheDocument();
  });

  it('no consulta si el documento es inválido', async () => {
    abrir();

    await escribirDocumento('12');

    expect(verificarInscriptor).not.toHaveBeenCalled();
    expect(screen.getByText(/entre 4 y 20/)).toBeInTheDocument();
  });

  it('pasa directo al formulario cuando no hay inscripciones previas', async () => {
    verificarInscriptor.mockResolvedValue({ total: 0, animales: [] });
    abrir();

    await escribirDocumento('1.234.567');

    expect(await screen.findByLabelText(/nombre del animal/i)).toBeInTheDocument();
    expect(verificarInscriptor).toHaveBeenCalledWith({ tipo_documento: 'CC', numero_documento: '1.234.567' });
  });

  it('avisa cuántos animales ya registró y deja continuar', async () => {
    verificarInscriptor.mockResolvedValue({ total: 1, animales: [previo] });
    abrir();

    await escribirDocumento('1234567');

    expect(await screen.findByText('Ya has registrado 1 animal')).toBeInTheDocument();
    expect(screen.getByText('Copito')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /es un animal distinto/i }));
    expect(await screen.findByLabelText(/nombre del animal/i)).toBeInTheDocument();
  });

  it('explica el límite de consultas cuando el servidor responde 429', async () => {
    rechazo = () => Promise.reject(new ErrorApi(429, null));
    abrir();

    await escribirDocumento('1234567');

    expect(await screen.findByText(/espera un minuto/i)).toBeInTheDocument();
  });
});
