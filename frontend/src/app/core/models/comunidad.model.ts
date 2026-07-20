import { TipoComunidad } from './enums';

export interface Comunidad {
  id: number;
  nombre: string;
  tipo: TipoComunidad;
  barrio: string;
  telefono_contacto: string;
  email_contacto: string;
  activa: boolean;
  fecha_registro: string;
}
