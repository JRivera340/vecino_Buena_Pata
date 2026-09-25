import type { CausalSalida, EstadoSalud } from './enums';

export interface VisitaCrear {
  estado_salud: EstadoSalud;
  estado_comportamiento: string;
  peso_kg: number | null;
  foto: string | null;
  observaciones: string | null;
}

export interface SalidaCrear {
  causal: CausalSalida;
  fecha: string;
  notas: string | null;
}

export interface ReactivacionCrear {
  estado_salud: EstadoSalud;
  estado_comportamiento: string;
}

export interface FormalizacionRespuesta {
  animal_id: number;
  estado: string;
  codigo_collar: string;
}
