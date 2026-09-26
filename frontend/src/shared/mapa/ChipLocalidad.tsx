import { CircleAlert, MapPin } from 'lucide-react';
import type { UbicacionSeleccionada } from './MapaTerritorio';

interface ChipLocalidadProps {
  ubicacion: UbicacionSeleccionada | null;
}

// Dice en qué localidad cayó el punto que la persona marcó, o avisa que quedó fuera de Bogotá.
export function ChipLocalidad({ ubicacion }: ChipLocalidadProps) {
  if (ubicacion === null || ubicacion.localidad === undefined) {
    return null;
  }
  if (ubicacion.localidad === null) {
    return (
      <p
        role="alert"
        className="inline-flex items-start gap-2 rounded bg-peligro-suave px-3 py-2 text-pequeno text-peligro-tinta"
      >
        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        Este punto está fuera de Bogotá. Marca un lugar dentro de la ciudad.
      </p>
    );
  }
  return (
    <p className="inline-flex items-center gap-2 rounded bg-[#fdf1c4] px-3 py-2 text-pequeno font-semibold text-tinta">
      <MapPin className="h-4 w-4" aria-hidden="true" />
      Localidad: {ubicacion.localidad}
    </p>
  );
}
