import type { Especie, EstadoAnimal, Sexo, Tamano, TipoComunidad, TipoDocumento } from './enums';

export interface AnimalDeInscriptor {
  id: number;
  nombre: string;
  especie: Especie;
  sexo: Sexo;
  tamano: Tamano;
  edad_estimada: number | null;
  descripcion: string | null;
  foto_principal: string | null;
  estado: EstadoAnimal;
  esterilizado: boolean;
  tiene_microchip: boolean;
  barrio: string;
  fecha_inscripcion: string;
}

export interface VerificarInscriptorRespuesta {
  total: number;
  animales: AnimalDeInscriptor[];
}

export interface ComunidadPublica {
  id: number;
  nombre: string;
  tipo: TipoComunidad;
  barrio: string;
}

export interface InscripcionPublicaRespuesta {
  animal_id: number;
  radicado: string;
  nombre: string;
  estado: EstadoAnimal;
}

export interface DocumentoConsulta {
  tipo_documento: TipoDocumento;
  numero_documento: string;
}
