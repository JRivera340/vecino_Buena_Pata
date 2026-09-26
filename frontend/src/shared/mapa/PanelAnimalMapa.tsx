import { ArrowLeft, MapPin } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { etiquetaEspecie, formatearFecha } from '@/core/formato.lib';
import type { EstadoAnimal } from '@/core/modelos/enums';
import { BotonEnlace, Boton } from '@/shared/ui/Boton';
import { EtiquetaEstado } from '@/shared/ui/Etiqueta';
import { FotoAnimal } from '@/shared/ui/FotoAnimal';

interface PanelAnimalMapaProps {
  nombre: string;
  especie: string;
  foto: string | null;
  estado: EstadoAnimal;
  localidad?: string | null;
  barrio: string;
  fechaInscripcion?: string;
  hrefFicha: string;
  alVolver: () => void;
}

// Detalle del animal elegido en el mapa: lateral en escritorio y hoja inferior en móvil.
export function PanelAnimalMapa({
  nombre,
  especie,
  foto,
  estado,
  localidad,
  barrio,
  fechaInscripcion,
  hrefFicha,
  alVolver,
}: PanelAnimalMapaProps) {
  const contenedor = useRef<HTMLElement>(null);

  // Quien elige con el teclado queda ubicado en el detalle sin tener que buscarlo.
  useEffect(() => {
    contenedor.current?.focus({ preventScroll: true });
  }, [nombre]);

  return (
    <article
      ref={contenedor}
      tabIndex={-1}
      aria-label={`Detalle de ${nombre}`}
      className="flex flex-col outline-none"
    >
      <div className="flex gap-4 p-4 lg:block lg:p-0">
        <FotoAnimal
          ruta={foto}
          nombre={nombre}
          especie={especie}
          className="h-24 w-24 shrink-0 rounded lg:aspect-[16/10] lg:h-auto lg:w-full lg:rounded-none lg:rounded-t-tarjeta"
        />
        <div className="min-w-0 flex-1 space-y-3 lg:p-4">
          <div>
            <h3 className="truncate text-h5">{nombre}</h3>
            <p className="text-pequeno text-tinta-suave">{etiquetaEspecie(especie)}</p>
          </div>
          <EtiquetaEstado estado={estado} />
          {localidad && (
            <p className="inline-flex items-center gap-1.5 rounded bg-[#fdf1c4] px-2.5 py-1 text-minimo font-semibold text-tinta">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              Localidad: {localidad}
            </p>
          )}
          <dl className="space-y-1 text-pequeno">
            <div className="flex gap-2">
              <dt className="text-tinta-suave">Barrio</dt>
              <dd className="font-medium">{barrio}</dd>
            </div>
            {fechaInscripcion && (
              <div className="flex gap-2">
                <dt className="text-tinta-suave">Inscrito</dt>
                <dd className="font-medium">{formatearFecha(fechaInscripcion)}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-black/10 p-4">
        <BotonEnlace to={hrefFicha} tamano="pequeno" movilCompleto>
          Ver hoja de vida
        </BotonEnlace>
        <Boton
          variante="secundario"
          tamano="pequeno"
          onClick={alVolver}
          icono={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
          movilCompleto
        >
          Volver
        </Boton>
      </div>
    </article>
  );
}
