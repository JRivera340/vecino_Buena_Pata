import type { EstadoReporte } from './enums';

export interface Reporte {
  id: number;
  animal_id: number;
  fecha: string;
  reportante_nombre: string;
  comunidad_id: number | null;
  descripcion: string;
  foto: string | null;
  latitud: number | null;
  longitud: number | null;
  estado: EstadoReporte;
}

export interface AtencionCrear {
  acciones_realizadas: string;
  resultado: string;
}

export interface Atencion {
  id: number;
  reporte_id: number;
  fecha: string;
  responsable: string;
  acciones_realizadas: string;
  resultado: string;
}
