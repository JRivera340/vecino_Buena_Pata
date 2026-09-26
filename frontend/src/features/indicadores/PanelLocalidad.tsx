import { ArrowLeft, MapPin } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { EstadoAnimal } from '@/core/modelos/enums';
import type { IndicadorLocalidad } from '@/core/modelos/indicadores';
import { estadoVisual } from '@/shared/estado-visual/estado-visual.lib';
import { Boton } from '@/shared/ui/Boton';
import { IconoEstadoAnimal } from '@/shared/ui/IconoEstado';

const ORDEN_ESTADOS: EstadoAnimal[] = [
  'CANDIDATO',
  'EN_PROCESO',
  'VBP_ACTIVO',
  'ADOPTADO',
  'PERDIDO',
  'FALLECIDO',
];

interface PanelLocalidadProps {
  localidad: IndicadorLocalidad;
  hayPeriodo: boolean;
  alVolver: () => void;
}

// Resumen de la localidad elegida en el mapa: el mismo panel donde se ve el detalle de un animal.
export function PanelLocalidad({ localidad, hayPeriodo, alVolver }: PanelLocalidadProps) {
  const contenedor = useRef<HTMLElement>(null);

  useEffect(() => {
    contenedor.current?.focus({ preventScroll: true });
  }, [localidad.nombre]);

  return (
    <section
      ref={contenedor}
      tabIndex={-1}
      aria-label={`Resumen de ${localidad.nombre}`}
      className="flex flex-col outline-none"
    >
      <div className="space-y-4 p-4">
        <div>
          <p className="inline-flex items-center gap-1.5 rounded bg-[#fdf1c4] px-2.5 py-1 text-minimo font-semibold text-tinta">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            Localidad
          </p>
          <h3 className="mt-2 text-h4">{localidad.nombre}</h3>
        </div>

        <p>
          <span className="text-hero font-semibold text-verde-tinta">{localidad.total}</span>{' '}
          <span className="text-pequeno text-tinta-suave">
            {localidad.total === 1 ? 'animal registrado' : 'animales registrados'}
          </span>
        </p>

        {localidad.total > 0 && (
          <ul className="space-y-1.5" aria-label="Animales por estado">
            {ORDEN_ESTADOS.filter((estado) => (localidad.por_estado[estado] ?? 0) > 0).map(
              (estado) => {
                const visual = estadoVisual(estado);
                return (
                  <li key={estado} className="flex items-center justify-between gap-3 text-pequeno">
                    <span className="flex items-center gap-2">
                      <IconoEstadoAnimal icono={visual.icono} color={visual.color} tamano={18} />
                      {visual.etiqueta}
                    </span>
                    <span className="font-semibold">{localidad.por_estado[estado]}</span>
                  </li>
                );
              },
            )}
          </ul>
        )}

        <dl className="space-y-1 border-t border-black/10 pt-3 text-pequeno">
          <div className="flex justify-between gap-3">
            <dt className="text-tinta-suave">
              {hayPeriodo ? 'Inscripciones del periodo' : 'Inscripciones en total'}
            </dt>
            <dd className="font-semibold">{localidad.inscripciones_periodo}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-tinta-suave">Reportes de novedad</dt>
            <dd className="font-semibold">
              {localidad.reportes} ({localidad.reportes_abiertos} abiertos)
            </dd>
          </div>
        </dl>
      </div>
      <div className="border-t border-black/10 p-4">
        <Boton
          variante="secundario"
          tamano="pequeno"
          onClick={alVolver}
          icono={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
        >
          Volver
        </Boton>
      </div>
    </section>
  );
}
