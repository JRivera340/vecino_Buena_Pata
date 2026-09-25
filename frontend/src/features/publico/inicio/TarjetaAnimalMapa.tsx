import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { etiquetaEspecie } from '@/core/formato.lib';
import type { AnimalMapaPublico } from '@/core/modelos/publico';
import { cx } from '@/shared/ui/clases';
import { FotoAnimal } from '@/shared/ui/FotoAnimal';

interface Props {
  animal: AnimalMapaPublico;
  seleccionado: boolean;
  alElegir: () => void;
}

export function TarjetaAnimalMapa({ animal, seleccionado, alElegir }: Props) {
  const elemento = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (seleccionado) {
      elemento.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
    }
  }, [seleccionado]);

  return (
    <li
      ref={elemento}
      className={cx(
        'flex gap-3 rounded-tarjeta border bg-white p-3 transition-colors',
        seleccionado ? 'border-2 border-verde shadow-medio' : 'border-black/15 hover:border-verde',
      )}
    >
      <FotoAnimal
        ruta={animal.foto_principal}
        nombre={animal.nombre}
        especie={animal.especie}
        className="h-16 w-16 shrink-0 rounded"
      />
      <div className="min-w-0 flex-1">
        <button
          type="button"
          aria-pressed={seleccionado}
          onClick={alElegir}
          className="block w-full min-h-[44px] rounded text-left sm:min-h-0"
        >
          <span className="block truncate font-semibold text-tinta">{animal.nombre}</span>
          <span className="block truncate text-pequeno text-tinta-suave">
            {etiquetaEspecie(animal.especie)} en {animal.barrio}
          </span>
        </button>
        <Link
          to={`/vbp/${animal.id}`}
          aria-label={`Ver la ficha de ${animal.nombre}`}
          className="inline-flex min-h-[44px] items-center text-pequeno font-semibold text-verde-profundo underline-offset-2 hover:underline sm:min-h-0"
        >
          Ver la ficha
        </Link>
      </div>
    </li>
  );
}
