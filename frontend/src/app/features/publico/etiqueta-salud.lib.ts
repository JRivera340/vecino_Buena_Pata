import { EstadoSalud } from '../../core/models/enums';

const ETIQUETAS: Record<EstadoSalud, string> = {
  BUENO: 'Buena',
  REGULAR: 'Regular',
  MALO: 'Mala',
};

export function etiquetaSalud(estado: EstadoSalud): string {
  return ETIQUETAS[estado];
}
