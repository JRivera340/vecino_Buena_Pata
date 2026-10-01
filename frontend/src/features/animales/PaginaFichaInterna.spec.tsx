import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSesion } from '@/core/sesion/sesion.store';
import PaginaFichaInterna from './PaginaFichaInterna';

vi.mock('@/core/api/animales', () => ({
  obtenerAnimal: vi.fn().mockResolvedValue({
    id: 17,
    nombre: 'Bruno',
    especie: 'PERRO',
    sexo: 'MACHO',
    edad_estimada: 0,
    tamano: 'PEQUENO',
    descripcion: 'Cachorro de bulldog.',
    foto_principal: 'foto.jpg',
    estado: 'CANDIDATO',
    esterilizado: false,
    numero_microchip: null,
    barrio: 'Santa Fe',
    latitud: 4.6,
    longitud: -74.07,
    comunidad_id: 1,
    causal_salida: null,
    fecha_salida: null,
    notas_salida: null,
    fecha_inscripcion: '2026-09-25T20:43:30.334759Z',
    inscrito_por: 'demo',
    codigo_collar: 'vbp-abc123',
  }),
  obtenerHistorial: vi.fn().mockResolvedValue([
    {
      id: 1,
      animal_id: 17,
      fecha: '2026-09-25T20:43:30Z',
      tipo_evento: 'INSCRIPCION',
      usuario: 'demo',
      detalle: { barrio: 'Santa Fe', comunidad_id: 1 },
    },
  ]),
  obtenerVisitas: vi.fn().mockResolvedValue([]),
  obtenerValidaciones: vi.fn().mockResolvedValue([]),
}));

describe('PaginaFichaInterna', () => {
  beforeEach(() => {
    useSesion.getState().iniciar({ token: 't', rol: 'ADMIN', nombre: 'Admin' });
  });

  it('muestra la ficha de un candidato sin visitas ni validaciones', async () => {
    render(
      <MemoryRouter initialEntries={['/animales/17']}>
        <Routes>
          <Route path="/animales/:id" element={<PaginaFichaInterna />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Bruno', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Todavía no tiene visitas.')).toBeInTheDocument();
    expect(screen.getByText('Inscripción')).toBeInTheDocument();
  });

  it('abre el formulario de reporte al hacer clic en Reportar novedad', async () => {
    const usuario = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/animales/17']}>
        <Routes>
          <Route path="/animales/:id" element={<PaginaFichaInterna />} />
        </Routes>
      </MemoryRouter>,
    );

    const boton = await screen.findByRole('button', { name: 'Reportar novedad' });
    await usuario.click(boton);

    expect(await screen.findByRole('dialog', { name: 'Reportar novedad' })).toBeInTheDocument();
    expect(screen.getByText(/Si ves a Bruno enfermo/)).toBeInTheDocument();
  });
});
