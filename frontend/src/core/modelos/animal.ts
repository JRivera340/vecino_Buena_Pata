import { CausalSalida, Especie, EstadoAnimal, Sexo, Tamano, TipoDocumento } from './enums';

export interface Animal {
  id: number;
  nombre: string;
  especie: Especie;
  sexo: Sexo;
  edad_estimada: number | null;
  tamano: Tamano;
  descripcion: string | null;
  observacion_comportamiento: string | null;
  foto_principal: string | null;
  estado: EstadoAnimal;
  esterilizado: boolean;
  numero_microchip: string | null;
  barrio: string;
  localidad?: string | null;
  latitud: number;
  longitud: number;
  comunidad_id: number | null;
  causal_salida: CausalSalida | null;
  fecha_salida: string | null;
  notas_salida: string | null;
  fecha_inscripcion: string;
  inscrito_por: string;
  codigo_collar?: string | null;
  incompleto?: boolean;
}

export interface AnimalCrear {
  nombre: string;
  especie: Especie;
  sexo: Sexo;
  tamano: Tamano;
  edad_estimada: number | null;
  descripcion: string | null;
  foto_principal: string | null;
  barrio: string;
  latitud: number;
  longitud: number;
  comunidad_id: number | null;
  tipo_documento: TipoDocumento | null;
  numero_documento: string | null;
  nombre_inscriptor?: string | null;
  observacion_comportamiento: string | null;
}

export interface AnimalActualizar {
  comunidad_id?: number | null;
  tipo_documento?: TipoDocumento | null;
  numero_documento?: string | null;
  nombre_inscriptor?: string | null;
  barrio?: string;
  latitud?: number;
  longitud?: number;
  observacion_comportamiento?: string | null;
}
