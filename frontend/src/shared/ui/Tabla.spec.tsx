import { render, screen } from '@testing-library/react';
import { Alerta } from './Alerta';
import { Tabla } from './Tabla';

const COLUMNAS = [
  { clave: 'nombre', titulo: 'Nombre', celda: (f: { id: number; nombre: string }) => f.nombre },
];

describe('Tabla', () => {
  it('muestra una fila por elemento y una cabecera con alcance de columna', () => {
    render(
      <Tabla
        descripcion="Animales"
        columnas={COLUMNAS}
        filas={[
          { id: 1, nombre: 'Lulú' },
          { id: 2, nombre: 'Mailo' },
        ]}
        claveFila={(f) => f.id}
      />,
    );

    expect(screen.getByRole('columnheader', { name: 'Nombre' })).toHaveAttribute('scope', 'col');
    expect(screen.getAllByText('Lulú').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Mailo').length).toBeGreaterThan(0);
  });

  it('muestra el mensaje vacío cuando no hay filas', () => {
    render(
      <Tabla
        descripcion="Animales"
        columnas={COLUMNAS}
        filas={[]}
        claveFila={(f) => f.id}
        vacio={<p>Todavía no hay animales.</p>}
      />,
    );

    expect(screen.getByText('Todavía no hay animales.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('muestra un estado de carga en lugar de la tabla', () => {
    render(<Tabla descripcion="Animales" columnas={COLUMNAS} filas={[]} claveFila={(f) => f.id} cargando />);

    expect(screen.getByRole('status', { name: 'Cargando datos' })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});

describe('Alerta', () => {
  it('anuncia los errores de forma inmediata', () => {
    render(<Alerta tipo="error">No pudimos guardar.</Alerta>);
    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos guardar.');
  });

  it('anuncia el resto de avisos sin interrumpir', () => {
    render(<Alerta tipo="exito">Listo.</Alerta>);
    expect(screen.getByRole('status')).toHaveTextContent('Listo.');
  });
});
