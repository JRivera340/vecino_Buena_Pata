import { CausalSalida, Especie, EstadoAnimal, Sexo, Tamano } from './enums';

export interface Animal {
  id: number;
  nombre: string;
  especie: Especie;
  sexo: Sexo;
  edad_estimada: number | null;
  tamano: Tamano;
  descripcion: string | null;
  foto_principal: string | null;
  estado: EstadoAnimal;
  esterilizado: boolean;
  numero_microchip: string | null;
  barrio: string;
  latitud: number;
  longitud: number;
  comunidad_id: number;
  causal_salida: CausalSalida | null;
  fecha_salida: string | null;
  notas_salida: string | null;
  fecha_inscripcion: string;
  inscrito_por: string;
}

export interface AnimalCrear {
  nombre: string;
  sexo: Sexo;
  tamano: Tamano;
  edad_estimada: number | null;
  descripcion: string | null;
  foto_principal: string | null;
  barrio: string;
  latitud: number;
  longitud: number;
  comunidad_id: number;
}
