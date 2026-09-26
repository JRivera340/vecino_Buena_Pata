import type { EspecieFiltro } from '@/features/indicadores/filtros-indicadores.lib';

export interface IndicadorLocalidad {
  codigo: string;
  nombre: string;
  total: number;
  por_estado: Record<string, number>;
  inscripciones_periodo: number;
  reportes: number;
  reportes_abiertos: number;
}

export interface InscripcionesDelMes {
  mes: string;
  santa_fe: number;
  otras: number;
  total: number;
}

export interface Difusion {
  total_inscripciones: number;
  en_santa_fe: number;
  fuera_de_santa_fe: number;
  sin_localidad: number;
  peso_fuera_de_santa_fe: number;
  mensual: InscripcionesDelMes[];
}

export interface IndicadoresLocalidades {
  desde: string | null;
  hasta: string | null;
  total_animales: number;
  sin_localidad: number;
  localidades: IndicadorLocalidad[];
  difusion: Difusion;
}

export type { EspecieFiltro };
