import type { MiembroComunidadCrear } from '@/core/modelos/usuario';

export interface FormularioMiembro {
  nombre: string;
  username: string;
  password: string;
}

export interface ErroresMiembro {
  nombre?: string;
  username?: string;
  password?: string;
}

const USUARIO = /^[a-z0-9._-]{3,60}$/;

export function validarMiembro(f: FormularioMiembro): ErroresMiembro {
  const errores: ErroresMiembro = {};
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
  return errores;
}

export function armarMiembro(f: FormularioMiembro): MiembroComunidadCrear {
  return {
    nombre: f.nombre.trim(),
    username: f.username.trim(),
    password: f.password,
  };
}
