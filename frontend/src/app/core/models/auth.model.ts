import { RolUsuario } from './enums';

export interface TokenRespuesta {
  access_token: string;
  token_type: string;
  rol: RolUsuario;
  nombre: string;
}
