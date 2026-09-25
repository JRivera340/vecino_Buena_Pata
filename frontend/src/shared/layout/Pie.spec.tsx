import { screen } from '@testing-library/react';
import { renderizarConRutas } from '@/pruebas/render';
import { Pie } from './Pie';

describe('Pie', () => {
  it('muestra el crédito de quienes desarrollaron el sitio', () => {
    renderizarConRutas(<Pie />);

    expect(screen.getByText('Desarrollado por: Jairo Julian Rivera y Joshua Rivera')).toBeInTheDocument();
  });

  it('nombra a la entidad y al observatorio', () => {
    renderizarConRutas(<Pie />);

    expect(screen.getAllByText(/Alcaldía Local de Santa Fe/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Observatorio de Protección y Bienestar Animal \(PYBA\)/)).toBeInTheDocument();
  });

  it('ofrece enlaces con nombre claro', () => {
    renderizarConRutas(<Pie />);

    expect(screen.getByRole('link', { name: 'Mapa de animales' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Ingreso del personal' })).toHaveAttribute('href', '/ingreso');
  });
});
