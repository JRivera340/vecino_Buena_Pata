import type { EscalaCoropletica } from './escala-coropletica.lib';
import { COLOR_SIN_ANIMALES } from './escala-coropletica.lib';

interface LeyendaCoropleticaProps {
  escala: EscalaCoropletica;
}

// La leyenda nunca depende solo del color: cada muestra lleva su rango escrito.
export function LeyendaCoropletica({ escala }: LeyendaCoropleticaProps) {
  const muestras = [
    { color: COLOR_SIN_ANIMALES, etiqueta: 'Sin animales' },
    ...escala.rangos.map((rango) => ({ color: rango.color, etiqueta: rango.etiqueta })),
  ];
  return (
    <figure aria-label="Leyenda: animales por localidad" className="space-y-2">
      <figcaption className="text-pequeno font-semibold">Animales por localidad</figcaption>
      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        {muestras.map((muestra) => (
          <li key={muestra.etiqueta} className="flex items-center gap-2 text-pequeno">
            <span
              aria-hidden="true"
              className="h-4 w-8 rounded-sm border border-black/25"
              style={{ backgroundColor: muestra.color }}
            />
            {muestra.etiqueta}
          </li>
        ))}
      </ul>
    </figure>
  );
}
