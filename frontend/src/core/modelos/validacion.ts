import { VeredictoValidacion } from './enums';

export interface Validacion {
  id: number;
  animal_id: number;
  fecha: string;
  veterinario: string;
  veredicto: VeredictoValidacion;
  pendientes: string[];
  observaciones: string | null;
}

export interface ValidacionCrear {
  veredicto: VeredictoValidacion;
  pendientes: string[];
  observaciones: string | null;
  esterilizado: boolean | null;
  numero_microchip: string | null;
}
