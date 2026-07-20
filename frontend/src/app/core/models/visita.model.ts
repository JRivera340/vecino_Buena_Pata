import { EstadoSalud } from './enums';

export interface Visita {
  id: number;
  animal_id: number;
  fecha: string;
  responsable: string;
  estado_salud: EstadoSalud;
  estado_comportamiento: string;
  peso_kg: number | null;
  foto: string | null;
  observaciones: string | null;
}
