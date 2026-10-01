import type { EstadoSeguimiento } from '@/features/seguimiento/seguimiento-visual.lib';

export interface AnimalSeguimiento {
  id: number;
  nombre: string;
  barrio: string;
  comunidad_id: number;
  latitud: number;
  longitud: number;
  estado_seguimiento: EstadoSeguimiento;
  visita_en_camino_por: string | null;
  proxima_visita_vence: string;
}
