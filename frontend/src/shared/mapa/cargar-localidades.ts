import urlLocalidades from '@/geo/localidades.geojson?url';
import type { ColeccionLocalidades } from './localidades.lib';

let pendiente: Promise<ColeccionLocalidades> | null = null;

// El archivo pesa unos 100 KB y es el mismo para todos los mapas: se descarga una sola vez.
export function cargarLocalidades(): Promise<ColeccionLocalidades> {
  if (pendiente === null) {
    pendiente = fetch(urlLocalidades)
      .then((respuesta) => {
        if (!respuesta.ok) {
          throw new Error(`No se pudieron cargar las localidades (${respuesta.status})`);
        }
        return respuesta.json() as Promise<ColeccionLocalidades>;
      })
      .catch((error: unknown) => {
        pendiente = null;
        throw error;
      });
  }
  return pendiente;
}
