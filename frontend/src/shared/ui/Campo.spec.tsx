import { render, screen } from '@testing-library/react';
import { Campo, Entrada } from './Campo';

describe('Campo', () => {
  it('asocia la etiqueta con el control', () => {
    render(<Campo id="usuario" etiqueta="Usuario">{(p) => <Entrada {...p} />}</Campo>);

    expect(screen.getByLabelText('Usuario')).toBeInTheDocument();
  });

  it('marca el control como inválido y enlaza el mensaje de error', () => {
    render(
      <Campo id="telefono" etiqueta="Teléfono" error="Escribe 10 dígitos.">
        {(p) => <Entrada {...p} />}
      </Campo>,
    );

    const control = screen.getByLabelText('Teléfono');
    expect(control).toHaveAttribute('aria-invalid', 'true');
    expect(control).toHaveAccessibleDescription('Escribe 10 dígitos.');
  });

  it('enlaza la ayuda como descripción accesible', () => {
    render(
      <Campo id="nombre" etiqueta="Nombre" ayuda="Como lo conocen en el barrio.">
        {(p) => <Entrada {...p} />}
      </Campo>,
    );

    expect(screen.getByLabelText('Nombre')).toHaveAccessibleDescription('Como lo conocen en el barrio.');
  });

  it('no marca error cuando el campo está bien', () => {
    render(<Campo id="ok" etiqueta="Correo">{(p) => <Entrada {...p} />}</Campo>);

    expect(screen.getByLabelText('Correo')).not.toHaveAttribute('aria-invalid');
  });

  it('indica los campos obligatorios sin depender del asterisco', () => {
    render(
      <Campo id="clave" etiqueta="Contraseña" obligatorio>
        {(p) => <Entrada {...p} />}
      </Campo>,
    );

    expect(screen.getByLabelText(/Contraseña/)).toHaveAttribute('aria-required', 'true');
  });
});
