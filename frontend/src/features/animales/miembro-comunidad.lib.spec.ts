import { armarMiembro, validarMiembro, type FormularioMiembro } from './miembro-comunidad.lib';

function formulario(cambios: Partial<FormularioMiembro> = {}): FormularioMiembro {
  return {
    nombre: 'Ana Vecina',
    username: 'ana.vecina',
    password: 'clave-segura-1',
    ...cambios,
  };
}

describe('validarMiembro', () => {
  it('acepta un formulario completo', () => {
    expect(validarMiembro(formulario())).toEqual({});
  });

  it('exige nombre', () => {
    expect(validarMiembro(formulario({ nombre: ' ' })).nombre).toBeDefined();
  });

  it('valida el usuario', () => {
    expect(validarMiembro(formulario({ username: 'Ana Vecina' })).username).toBeDefined();
  });

  it('exige contraseña de al menos 8 caracteres', () => {
    expect(validarMiembro(formulario({ password: 'corta' })).password).toBeDefined();
  });
});

describe('armarMiembro', () => {
  it('arma los datos del miembro recortando espacios', () => {
    const datos = armarMiembro(formulario({ nombre: '  Ana Vecina  ', username: ' ana.vecina ' }));
    expect(datos).toEqual({
      nombre: 'Ana Vecina',
      username: 'ana.vecina',
      password: 'clave-segura-1',
    });
  });
});
