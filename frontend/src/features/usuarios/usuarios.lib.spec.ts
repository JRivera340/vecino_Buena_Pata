import { armarUsuario, validarUsuario, type FormularioUsuario } from './usuarios.lib';

function formulario(cambios: Partial<FormularioUsuario> = {}): FormularioUsuario {
  return {
    nombre: 'Luis Líder',
    username: 'luis.lider',
    password: 'clave-segura-1',
    rol: 'LIDER',
    tipoDocumento: 'CC',
    numeroDocumento: '80.123.456',
    origenComunidad: 'nueva',
    comunidadId: null,
    comunidadNombre: 'Junta Las Cruces',
    comunidadTipo: 'ACCION_COMUNAL',
    comunidadBarrio: 'Las Cruces',
    comunidadTelefono: '3001234567',
    comunidadCorreo: 'junta@correo.com',
    ...cambios,
  };
}

describe('validarUsuario', () => {
  it('acepta un líder completo con comunidad nueva', () => {
    expect(validarUsuario(formulario())).toEqual({});
  });

  it('exige documento a un líder', () => {
    expect(validarUsuario(formulario({ numeroDocumento: '' })).documento).toBeDefined();
  });

  it('no exige documento a un veterinario, pero si lo escribe lo valida', () => {
    expect(validarUsuario(formulario({ rol: 'VETERINARIO', numeroDocumento: '' }))).toEqual({});
    expect(
      validarUsuario(formulario({ rol: 'VETERINARIO', numeroDocumento: '12' })).documento,
    ).toBeDefined();
  });

  it('exige elegir una comunidad existente o completar los datos de una nueva', () => {
    expect(
      validarUsuario(formulario({ origenComunidad: 'existente', comunidadId: null })).comunidad,
    ).toBeDefined();
    expect(
      validarUsuario(formulario({ origenComunidad: 'existente', comunidadId: 4 })).comunidad,
    ).toBeUndefined();
    expect(validarUsuario(formulario({ comunidadNombre: ' ' })).comunidad).toBeDefined();
    expect(validarUsuario(formulario({ comunidadCorreo: '' })).comunidad).toBeDefined();
  });

  it('valida el usuario y la contraseña', () => {
    const errores = validarUsuario(formulario({ username: 'Luis Lider', password: 'corta' }));

    expect(errores.username).toBeDefined();
    expect(errores.password).toBeDefined();
  });
});

describe('armarUsuario', () => {
  it('arma un líder con comunidad nueva', () => {
    const datos = armarUsuario(formulario());

    expect(datos.tipo_documento).toBe('CC');
    expect(datos.numero_documento).toBe('80.123.456');
    expect(datos.comunidad_id).toBeNull();
    expect(datos.comunidad_nueva).toMatchObject({
      nombre: 'Junta Las Cruces',
      tipo: 'ACCION_COMUNAL',
    });
  });

  it('arma un líder con comunidad existente', () => {
    const datos = armarUsuario(formulario({ origenComunidad: 'existente', comunidadId: 4 }));

    expect(datos.comunidad_id).toBe(4);
    expect(datos.comunidad_nueva).toBeNull();
  });

  it('no manda documento ni comunidad a un veterinario sin documento', () => {
    const datos = armarUsuario(formulario({ rol: 'VETERINARIO', numeroDocumento: '' }));

    expect(datos.tipo_documento).toBeNull();
    expect(datos.numero_documento).toBeNull();
    expect(datos.comunidad_nueva).toBeNull();
  });
});
