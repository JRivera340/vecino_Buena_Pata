import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChipLocalidad } from './ChipLocalidad';

describe('ChipLocalidad', () => {
  it('no muestra nada sin punto o mientras las localidades cargan', () => {
    const { container, rerender } = render(<ChipLocalidad ubicacion={null} />);
    expect(container).toBeEmptyDOMElement();

    rerender(<ChipLocalidad ubicacion={{ lat: 4.6, lng: -74.07 }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('dice la localidad donde cayó el punto', () => {
    render(<ChipLocalidad ubicacion={{ lat: 4.6, lng: -74.07, localidad: 'Santa Fe' }} />);

    expect(screen.getByText('Localidad: Santa Fe')).toBeInTheDocument();
  });

  it('avisa cuando el punto queda fuera de Bogotá', () => {
    render(<ChipLocalidad ubicacion={{ lat: 6.2, lng: -75.5, localidad: null }} />);

    expect(screen.getByRole('alert')).toHaveTextContent('fuera de Bogotá');
  });
});
