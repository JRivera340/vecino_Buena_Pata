export interface EventoHistorial {
  id: number;
  animal_id: number;
  fecha: string;
  tipo_evento: string;
  usuario: string;
  detalle: Record<string, unknown>;
}
