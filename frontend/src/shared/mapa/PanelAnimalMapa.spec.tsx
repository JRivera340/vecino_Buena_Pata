import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { PanelAnimalMapa } from './PanelAnimalMapa';

function abrir(cambios: Partial<Parameters<typeof PanelAnimalMapa>[0]> = {}) {
  const alVolver = vi.fn();
  render(
    <MemoryRouter>
      <PanelAnimalMapa
        nombre="Copito"
        especie="PERRO"
        foto={null}
        estado="VBP_ACTIVO"
        localidad="Santa Fe"
        barrio="La Macarena"
        fechaInscripcion="2026-09-20T10:00:00Z"
        hrefFicha="/animales/11"
        alVolver={alVolver}
        {...cambios}
      />
    </MemoryRouter>,
  );
  return { alVolver };
}

describe('PanelAnimalMapa', () => {
  it('muestra nombre, estado con texto, localidad, barrio y fecha', () => {
    abrir();

    expect(screen.getByRole('heading', { name: 'Copito' })).toBeInTheDocument();
    expect(screen.getByText('Vecino Buena Pata activo')).toBeInTheDocument();
    expect(screen.getByText('Localidad: Santa Fe')).toBeInTheDocument();
    expect(screen.getByText('La Macarena')).toBeInTheDocument();
    expect(screen.getByText('20 de septiembre de 2026')).toBeInTheDocument();
  });

  it('lleva a la hoja de vida indicada', () => {
    abrir({ hrefFicha: '/vbp/11' });

    expect(screen.getByRole('link', { name: 'Ver hoja de vida' })).toHaveAttribute(
      'href',
      '/vbp/11',
    );
  });

  it('omite la localidad y la fecha cuando no se conocen', () => {
    abrir({ localidad: null, fechaInscripcion: undefined });

    expect(screen.queryByText(/Localidad:/)).not.toBeInTheDocument();
    expect(screen.queryByText('Inscrito')).not.toBeInTheDocument();
  });

  it('vuelve con el botón y recibe el foco al abrirse', async () => {
    const { alVolver } = abrir();

    expect(screen.getByRole('article', { name: 'Detalle de Copito' })).toHaveFocus();
    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));

    expect(alVolver).toHaveBeenCalledOnce();
  });
});
