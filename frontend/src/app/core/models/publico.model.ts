import { Especie, EstadoSalud, Sexo, Tamano } from './enums';

export interface AnimalMapaPublico {
  id: number;
  nombre: string;
  especie: Especie;
  foto_principal: string | null;
  barrio: string;
  latitud: number;
  longitud: number;
}

export interface UltimaVisitaPublica {
  fecha: string;
  estado_salud: EstadoSalud;
  peso_kg: number | null;
}

export interface HojaVidaPublica {
  id: number;
  nombre: string;
  especie: Especie;
  sexo: Sexo;
  tamano: Tamano;
  edad_estimada: number | null;
  descripcion: string | null;
  foto_principal: string | null;
  barrio: string;
  fecha_inscripcion: string;
  esterilizado: boolean;
  tiene_microchip: boolean;
  ultima_visita: UltimaVisitaPublica | null;
}
