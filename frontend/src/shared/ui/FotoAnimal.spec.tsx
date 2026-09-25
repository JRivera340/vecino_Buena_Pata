import { fireEvent, render, screen } from '@testing-library/react';
import { FotoAnimal } from './FotoAnimal';

describe('FotoAnimal', () => {
  it('muestra la foto con un texto alternativo que nombra al animal', () => {
    render(<FotoAnimal ruta="lulu.jpg" nombre="Lulú" especie="PERRO" />);

    const imagen = screen.getByRole('img', { name: 'Foto de Lulú' });
    expect(imagen).toHaveAttribute('src', 'http://localhost:8000/media/lulu.jpg');
    expect(imagen).toHaveAttribute('loading', 'lazy');
  });

  it('carga de inmediato cuando es la imagen principal', () => {
    render(<FotoAnimal ruta="lulu.jpg" nombre="Lulú" especie="PERRO" prioridad />);

    expect(screen.getByRole('img', { name: 'Foto de Lulú' })).toHaveAttribute('loading', 'eager');
  });

  it('muestra un aviso en lugar de una imagen rota cuando no hay foto', () => {
    render(<FotoAnimal ruta={null} nombre="Mailo" especie="PERRO" />);

    expect(screen.getByRole('img', { name: 'Todavía no hay foto de Mailo' })).toBeInTheDocument();
    expect(screen.getByText('Sin foto todavía')).toBeInTheDocument();
    expect(document.querySelector('img')).toBeNull();
  });

  it('cambia al aviso si la imagen no se puede cargar', () => {
    render(<FotoAnimal ruta="borrada.jpg" nombre="Monacho" especie="GATO" />);

    fireEvent.error(screen.getByRole('img', { name: 'Foto de Monacho' }));

    expect(screen.getByRole('img', { name: 'Todavía no hay foto de Monacho' })).toBeInTheDocument();
    expect(document.querySelector('img')).toBeNull();
  });
});
