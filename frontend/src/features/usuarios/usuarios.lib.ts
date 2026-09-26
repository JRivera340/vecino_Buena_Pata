import type { TipoComunidad, RolUsuario, TipoDocumento } from '@/core/modelos/enums';
import type { UsuarioCrear } from '@/core/modelos/usuario';
import { validarDocumento } from '@/features/publico/inscripcion/documento.lib';

export interface FormularioUsuario {
  nombre: string;
  username: string;
  password: string;
  rol: RolUsuario;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  // Para un líder: 'existente' usa comunidadId; 'nueva' crea la comunidad con los datos de abajo.
  origenComunidad: 'existente' | 'nueva';
  comunidadId: number | null;
  comunidadNombre: string;
  comunidadTipo: TipoComunidad;
  comunidadBarrio: string;
  comunidadTelefono: string;
  comunidadCorreo: string;
}

export interface ErroresUsuario {
  nombre?: string;
  username?: string;
  password?: string;
  documento?: string;
  comunidad?: string;
}

const USUARIO = /^[a-z0-9._-]{3,60}$/;

export const ROLES_CREABLES: { valor: RolUsuario; texto: string }[] = [
  { valor: 'LIDER', texto: 'Líder de comunidad' },
  { valor: 'VETERINARIO', texto: 'Veterinario' },
  { valor: 'ADMIN', texto: 'Administrador' },
];

export function validarUsuario(f: FormularioUsuario): ErroresUsuario {
  const errores: ErroresUsuario = {};
  if (f.nombre.trim() === '') {
    errores.nombre = 'Escribe el nombre completo.';
  }
  if (!USUARIO.test(f.username)) {
    errores.username =
      'Usa entre 3 y 60 caracteres: minúsculas, números, punto, guion o guion bajo.';
  }
  if (f.password.length < 8) {
    errores.password = 'La contraseña debe tener al menos 8 caracteres.';
  }
  if (f.rol === 'LIDER') {
    const documento = validarDocumento(f.numeroDocumento);
    if (documento) {
      errores.documento = documento;
    }
    if (f.origenComunidad === 'existente' && f.comunidadId === null) {
      errores.comunidad = 'Elige la comunidad que representa.';
    }
    if (f.origenComunidad === 'nueva') {
      if (f.comunidadNombre.trim() === '' || f.comunidadBarrio.trim() === '') {
        errores.comunidad = 'Escribe el nombre y el barrio de la comunidad.';
      } else if (f.comunidadTelefono.trim() === '' || f.comunidadCorreo.trim() === '') {
        errores.comunidad = 'Escribe el teléfono y el correo de contacto de la comunidad.';
      }
    }
  } else if (f.numeroDocumento.trim() !== '') {
    const documento = validarDocumento(f.numeroDocumento);
    if (documento) {
      errores.documento = documento;
    }
  }
  return errores;
}

export function armarUsuario(f: FormularioUsuario): UsuarioCrear {
  const conDocumento = f.numeroDocumento.trim() !== '';
  const lider = f.rol === 'LIDER';
  return {
    nombre: f.nombre.trim(),
    username: f.username.trim(),
    password: f.password,
    rol: f.rol,
    tipo_documento: conDocumento ? f.tipoDocumento : null,
    numero_documento: conDocumento ? f.numeroDocumento.trim() : null,
    comunidad_id: lider && f.origenComunidad === 'existente' ? f.comunidadId : null,
    comunidad_nueva:
      lider && f.origenComunidad === 'nueva'
        ? {
            nombre: f.comunidadNombre.trim(),
            tipo: f.comunidadTipo,
            barrio: f.comunidadBarrio.trim(),
            telefono_contacto: f.comunidadTelefono.trim(),
            email_contacto: f.comunidadCorreo.trim(),
          }
        : null,
  };
}
