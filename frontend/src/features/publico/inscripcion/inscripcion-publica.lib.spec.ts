import {
  armarEnvioInscripcionPublica,
  validarInscripcionPublica,
  type FormularioInscripcionPublica,
} from './inscripcion-publica.lib';

function formulario(
  cambios: Partial<FormularioInscripcionPublica> = {},
): FormularioInscripcionPublica {
  return {
    tipoDocumento: 'CC',
    numeroDocumento: '1.234.567',
    nombrePersona: 'Ana Pérez',
    telefono: '300 123 4567',
    correo: 'ana@correo.com',
    aceptaDatos: true,
    nombre: 'Copito',
    especie: 'PERRO',
    sexo: 'MACHO',
    tamano: 'PEQUENO',
    edadEstimada: '',
    descripcion: '',
    barrio: 'Las Cruces',
    comunidadId: 3,
    ubicacion: { lat: 4.6, lng: -74.08 },
    foto: new File(['x'], 'foto.jpg', { type: 'image/jpeg' }),
    sitioWeb: '',
    ...cambios,
  };
}

describe('validarInscripcionPublica', () => {
  it('no marca errores en un formulario completo', () => {
    expect(validarInscripcionPublica(formulario())).toEqual({});
  });

  it('pide los datos de la persona', () => {
    const errores = validarInscripcionPublica(
      formulario({
        numeroDocumento: '',
        nombrePersona: ' ',
        telefono: 'abc',
        correo: 'sin-arroba',
      }),
    );

    expect(errores.documento).toBeDefined();
    expect(errores.nombrePersona).toBe('Escribe tu nombre completo.');
    expect(errores.telefono).toBeDefined();
    expect(errores.correo).toBeDefined();
  });

  it('acepta un teléfono con espacios, guiones o prefijo', () => {
    expect(
      validarInscripcionPublica(formulario({ telefono: '+57 300-123-4567' })).telefono,
    ).toBeUndefined();
  });

  it('exige aceptar el tratamiento de datos', () => {
    expect(validarInscripcionPublica(formulario({ aceptaDatos: false })).aceptaDatos).toMatch(
      /tratamiento/,
    );
  });

  it('reutiliza las reglas del animal: comunidad, ubicación y foto son obligatorias', () => {
    const errores = validarInscripcionPublica(
      formulario({ comunidadId: null, ubicacion: null, foto: null }),
    );

    expect(errores.comunidad).toBeDefined();
    expect(errores.ubicacion).toBeDefined();
    expect(errores.foto).toBeDefined();
  });
});

describe('armarEnvioInscripcionPublica', () => {
  it('manda los nombres de campo que espera el servidor', () => {
    const datos = armarEnvioInscripcionPublica(
      formulario({ edadEstimada: '4', descripcion: ' Tranquilo ' }),
    );

    expect(datos.get('tipo_documento')).toBe('CC');
    expect(datos.get('numero_documento')).toBe('1.234.567');
    expect(datos.get('acepta_datos')).toBe('true');
    expect(datos.get('edad_estimada')).toBe('4');
    expect(datos.get('descripcion')).toBe('Tranquilo');
    expect(datos.get('latitud')).toBe('4.6');
    expect(datos.get('comunidad_id')).toBe('3');
    expect(datos.get('foto')).toBeInstanceOf(File);
    expect(datos.get('sitio_web')).toBe('');
  });

  it('omite la edad y la descripción cuando están vacías', () => {
    const datos = armarEnvioInscripcionPublica(formulario());

    expect(datos.has('edad_estimada')).toBe(false);
    expect(datos.has('descripcion')).toBe(false);
  });
});
