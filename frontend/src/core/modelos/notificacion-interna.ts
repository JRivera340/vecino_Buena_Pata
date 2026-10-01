export interface NotificacionInterna {
  id: number;
  animal_id: number;
  origen_tipo: 'REPORTE' | 'VISITA_PREOCUPANTE' | 'VISITA_VENCIDA';
  origen_id: number | null;
  creada_en: string;
  leida_en: string | null;
}
