import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { listarMapa } from '@/core/api/publico';
import type { AnimalMapaPublico } from '@/core/modelos/publico';
import { renderizarConRutas } from '@/pruebas/render';
import PaginaInicio from './PaginaInicio';

vi.mock('@/core/api/publico', () => ({ listarMapa: vi.fn() }));
vi.mock('@/shared/mapa/MapaTerritorio', () => ({
  MapaTerritorio: ({
    marcadores,
    alHacerClicEnMarcador,
    seleccionadoId,
  }: {
    marcadores: { id: number; etiqueta: string; lat: number; lng: number }[];
    alHacerClicEnMarcador?: (id: number) => void;
    seleccionadoId?: number | null;
  }) => (
    <div data-testid="mapa">
      {marcadores.map((marcador) => (
        <button
          key={marcador.id}
          type="button"
          data-posicion={`${marcador.lat}|${marcador.lng}`}
          data-seleccionado={seleccionadoId === marcador.id}
          onClick={() => alHacerClicEnMarcador?.(marcador.id)}
        >
          Marcador de {marcador.etiqueta}
        </button>
      ))}
    </div>
  ),
}));

const mapaMock = vi.mocked(listarMapa);

function animal(
  datos: Partial<AnimalMapaPublico> & { id: number; nombre: string },
): AnimalMapaPublico {
  return {
    especie: 'PERRO',
    foto_principal: null,
    barrio: 'Bosa',
    latitud: 4.6,
    longitud: -74.1,
    ...datos,
  };
}

const ANIMALES = [
  animal({ id: 1, nombre: 'Lulú', barrio: 'Teusaquillo', foto_principal: 'lulu.jpg' }),
  animal({
    id: 2,
    nombre: 'Monacho',
    especie: 'GATO',
    barrio: 'Chapinero',
    latitud: 4.65,
    longitud: -74.06,
  }),
  animal({ id: 3, nombre: 'Pirata', barrio: 'Bosa', latitud: 4.57, longitud: -74.11 }),
];

const lista = () => screen.getByRole('list', { name: 'Animales en el mapa' });

describe('PaginaInicio', () => {
  beforeEach(() => {
    mapaMock.mockReset();
  });

  it('resume el mapa y lista a los animales cuando llegan los datos', async () => {
    mapaMock.mockResolvedValue(ANIMALES);
    renderizarConRutas(<PaginaInicio />);

    expect(
      await screen.findByText('Hoy hay 3 Vecinos Buena Pata activos en 3 barrios.'),
    ).toBeInTheDocument();
    expect(within(lista()).getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Marcador de Lulú' })).toBeInTheDocument();
    expect(screen.getByText('3 animales en la lista')).toBeInTheDocument();
  });

  it('enlaza cada tarjeta con la ficha del animal', async () => {
    mapaMock.mockResolvedValue(ANIMALES);
    renderizarConRutas(<PaginaInicio />);

    const enlace = await screen.findByRole('link', { name: 'Ver la ficha de Monacho' });

    expect(enlace).toHaveAttribute('href', '/vbp/2');
  });

  it('filtra por nombre sin distinguir mayúsculas ni tildes', async () => {
    mapaMock.mockResolvedValue(ANIMALES);
    renderizarConRutas(<PaginaInicio />);
    await screen.findByText('3 animales en la lista');

    await userEvent.type(screen.getByLabelText('Buscar por nombre'), 'LULU');

    expect(within(lista()).getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByText('1 animal en la lista')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Marcador de Pirata' })).not.toBeInTheDocument();
  });

  it('filtra por especie y por barrio', async () => {
    mapaMock.mockResolvedValue(ANIMALES);
    renderizarConRutas(<PaginaInicio />);
    await screen.findByText('3 animales en la lista');

    await userEvent.selectOptions(screen.getByLabelText('Especie'), 'GATO');
    expect(within(lista()).getAllByRole('listitem')).toHaveLength(1);

    await userEvent.selectOptions(screen.getByLabelText('Especie'), 'TODAS');
    await userEvent.selectOptions(screen.getByLabelText('Barrio'), 'Bosa');
    expect(within(lista()).getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Marcador de Pirata' })).toBeInTheDocument();
  });

  it('ofrece quitar los filtros cuando nada coincide', async () => {
    mapaMock.mockResolvedValue(ANIMALES);
    renderizarConRutas(<PaginaInicio />);
    await screen.findByText('3 animales en la lista');

    await userEvent.type(screen.getByLabelText('Buscar por nombre'), 'zzz');
    expect(screen.getByText('Ningún animal coincide con tu búsqueda.')).toBeInTheDocument();

    await userEvent.click(screen.getAllByRole('button', { name: 'Quitar los filtros' })[0]);

    expect(within(lista()).getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByLabelText('Buscar por nombre')).toHaveValue('');
  });

  it('marca la tarjeta cuando se toca su punto en el mapa', async () => {
    mapaMock.mockResolvedValue(ANIMALES);
    renderizarConRutas(<PaginaInicio />);
    await screen.findByText('3 animales en la lista');

    await userEvent.click(screen.getByRole('button', { name: 'Marcador de Monacho' }));

    const tarjeta = within(lista()).getByRole('button', { name: /Monacho/ });
    expect(tarjeta).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Marcador de Monacho' })).toHaveAttribute(
      'data-seleccionado',
      'true',
    );
  });

  it('separa en el mapa a los animales que comparten el mismo punto', async () => {
    mapaMock.mockResolvedValue([
      animal({ id: 5, nombre: 'Viejito', latitud: 4.5975, longitud: -74.0715 }),
      animal({ id: 6, nombre: 'Manchito', latitud: 4.5975, longitud: -74.0715 }),
    ]);
    renderizarConRutas(<PaginaInicio />);

    const uno = await screen.findByRole('button', { name: 'Marcador de Viejito' });
    const otro = screen.getByRole('button', { name: 'Marcador de Manchito' });

    expect(uno.dataset.posicion).not.toBe(otro.dataset.posicion);
  });

  it('invita a volver pronto cuando todavía no hay animales activos', async () => {
    mapaMock.mockResolvedValue([]);
    renderizarConRutas(<PaginaInicio />);

    expect(
      await screen.findByText('Todavía no hay animales activos en el mapa.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Aún no hay animales activos en el mapa/)).toBeInTheDocument();
  });

  it('explica el fallo y permite reintentar', async () => {
    mapaMock.mockRejectedValueOnce(new Error('sin red')).mockResolvedValueOnce(ANIMALES);
    renderizarConRutas(<PaginaInicio />);

    expect(await screen.findByText('No pudimos cargar el mapa')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    await waitFor(() => expect(within(lista()).getAllByRole('listitem')).toHaveLength(3));
    expect(mapaMock).toHaveBeenCalledTimes(2);
  });

  it('explica que los puntos son aproximados', async () => {
    mapaMock.mockResolvedValue(ANIMALES);
    renderizarConRutas(<PaginaInicio />);

    expect(await screen.findByText(/unos 300 metros de margen/)).toBeInTheDocument();
  });

  it('presenta los cuatro pasos del programa', async () => {
    mapaMock.mockResolvedValue(ANIMALES);
    renderizarConRutas(<PaginaInicio />);

    const seccion = await screen.findByRole('region', { name: 'Cómo llega un animal al mapa' });

    expect(within(seccion).getAllByRole('listitem')).toHaveLength(4);
    expect(within(seccion).getByText('Validación veterinaria')).toBeInTheDocument();
  });
});
