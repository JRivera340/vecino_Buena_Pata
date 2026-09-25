import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render } from '@testing-library/react';
import { vi } from 'vitest';
import { ErrorApi } from '@/core/api/cliente';
import { obtenerHojaVida } from '@/core/api/publico';
import type { HojaVidaPublica } from '@/core/modelos/publico';
import PaginaFicha from './PaginaFicha';

vi.mock('@/core/api/publico', () => ({ obtenerHojaVida: vi.fn() }));
const hojaMock = vi.mocked(obtenerHojaVida);

const HOJA: HojaVidaPublica = {
  id: 2,
  nombre: 'Lulú',
  especie: 'PERRO',
  sexo: 'HEMBRA',
  tamano: 'PEQUENO',
  edad_estimada: 4,
  descripcion: 'Sociable y tranquila.',
  foto_principal: 'lulu.jpg',
  barrio: 'Teusaquillo',
  fecha_inscripcion: '2026-09-25T15:00:00Z',
  esterilizado: true,
  tiene_microchip: true,
  ultima_visita: { fecha: '2026-09-20T15:00:00Z', estado_salud: 'BUENO', peso_kg: 22.5 },
};

function montar(ruta: string) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/vbp/:id" element={<PaginaFicha />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PaginaFicha', () => {
  beforeEach(() => {
    hojaMock.mockReset();
  });

  it('muestra la ficha completa de un animal activo', async () => {
    hojaMock.mockResolvedValue(HOJA);
    montar('/vbp/2');

    expect(await screen.findByRole('heading', { level: 1, name: 'Lulú' })).toBeInTheDocument();
    expect(screen.getByText('Perro hembra de tamaño pequeño, del barrio Teusaquillo.')).toBeInTheDocument();
    expect(screen.getByText('Sociable y tranquila.')).toBeInTheDocument();
    expect(screen.getByText('4 años')).toBeInTheDocument();
    expect(screen.getByText('25 de septiembre de 2026')).toBeInTheDocument();
    expect(screen.getByText('Esterilizado')).toBeInTheDocument();
    expect(screen.getByText('Con microchip')).toBeInTheDocument();
    expect(hojaMock).toHaveBeenCalledWith(2);
  });

  it('muestra la última visita con su salud y su peso', async () => {
    hojaMock.mockResolvedValue(HOJA);
    montar('/vbp/2');

    const seccion = (await screen.findByRole('heading', { name: 'Última visita de seguimiento' })).closest(
      'section',
    ) as HTMLElement;

    expect(within(seccion).getByText('20 de septiembre de 2026')).toBeInTheDocument();
    expect(within(seccion).getByText('Buena')).toBeInTheDocument();
    expect(within(seccion).getByText('Pesó 22,5 kg')).toBeInTheDocument();
  });

  it('no inventa datos cuando faltan: foto, descripción, edad, peso y visita', async () => {
    hojaMock.mockResolvedValue({
      ...HOJA,
      foto_principal: null,
      descripcion: null,
      edad_estimada: null,
      esterilizado: false,
      tiene_microchip: false,
      ultima_visita: null,
    });
    montar('/vbp/2');

    await screen.findByRole('heading', { level: 1, name: 'Lulú' });

    expect(screen.getByRole('img', { name: 'Todavía no hay foto de Lulú' })).toBeInTheDocument();
    expect(screen.getByText('Sin dato')).toBeInTheDocument();
    expect(screen.getByText('Sin esterilizar')).toBeInTheDocument();
    expect(screen.getByText('Sin microchip')).toBeInTheDocument();
    expect(screen.getByText('Todavía no tiene visitas de seguimiento registradas.')).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent('null');
    expect(document.body).not.toHaveTextContent('undefined');
  });

  it('omite el peso cuando la visita no lo registró', async () => {
    hojaMock.mockResolvedValue({
      ...HOJA,
      ultima_visita: { fecha: '2026-09-20T15:00:00Z', estado_salud: 'REGULAR', peso_kg: null },
    });
    montar('/vbp/2');

    await screen.findByText('Regular');

    expect(screen.queryByText(/Pesó/)).not.toBeInTheDocument();
  });

  it('indica que se reporta con el QR y no ofrece un formulario', async () => {
    hojaMock.mockResolvedValue(HOJA);
    montar('/vbp/2');

    expect(await screen.findByText(/escanea el código QR de su collar/)).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('dice que el animal no está disponible cuando el servidor responde 404', async () => {
    hojaMock.mockRejectedValue(new ErrorApi(404, 'Animal no disponible.'));
    montar('/vbp/9999');

    expect(await screen.findByRole('heading', { name: 'Este animal no está disponible' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver al mapa' })).toHaveAttribute('href', '/');
  });

  it('no consulta el servidor si el identificador no es un número válido', async () => {
    montar('/vbp/abc');

    expect(await screen.findByRole('heading', { name: 'Este animal no está disponible' })).toBeInTheDocument();
    expect(hojaMock).not.toHaveBeenCalled();
  });

  it('distingue un fallo de conexión de un animal inexistente y permite reintentar', async () => {
    hojaMock.mockRejectedValueOnce(new ErrorApi(503, null)).mockResolvedValueOnce(HOJA);
    montar('/vbp/2');

    expect(await screen.findByText('No pudimos cargar la ficha')).toBeInTheDocument();
    expect(screen.queryByText('Este animal no está disponible')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Lulú' })).toBeInTheDocument();
  });
});
