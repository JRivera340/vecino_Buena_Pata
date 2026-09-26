import type { RolUsuario, TipoDocumento } from './enums';

export interface Usuario {
  id: number;
  nombre: string;
  username: string;
  rol: RolUsuario;
  tipo_documento: TipoDocumento | null;
  numero_documento: string | null;
  comunidad_id: number | null;
  comunidad_nombre: string | null;
}

export interface ComunidadNueva {
  nombre: string;
  tipo: string;
  barrio: string;
  telefono_contacto: string;
  email_contacto: string;
}

export interface UsuarioCrear {
  nombre: string;
  username: string;
  password: string;
  rol: RolUsuario;
  tipo_documento: TipoDocumento | null;
  numero_documento: string | null;
  comunidad_id: number | null;
  comunidad_nueva: ComunidadNueva | null;
}

export interface UsuarioEditar {
  nombre?: string;
  tipo_documento?: TipoDocumento;
  numero_documento?: string;
  password?: string;
}
