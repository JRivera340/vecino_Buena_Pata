import { Cat, Dog } from 'lucide-react';
import { useState } from 'react';
import { resolverUrlMedia } from '@/core/medios/resolver-url-media.lib';
import { cx } from './clases';

interface FotoAnimalProps {
  ruta: string | null;
  nombre: string;
  especie: string;
  className?: string;
  prioridad?: boolean;
}

export function FotoAnimal({ ruta, nombre, especie, className, prioridad = false }: FotoAnimalProps) {
  const [fallo, setFallo] = useState(false);
  const url = resolverUrlMedia(ruta);

  if (!url || fallo) {
    const Icono = especie === 'GATO' ? Cat : Dog;
    return (
      <div
        role="img"
        aria-label={`Todavía no hay foto de ${nombre}`}
        className={cx(
          'flex flex-col items-center justify-center gap-2 bg-verde-tenue text-verde-tinta',
          className,
        )}
      >
        <Icono className="h-1/3 w-1/3 max-h-16 max-w-16" aria-hidden="true" strokeWidth={1.5} />
        <span className="px-2 text-center text-minimo">Sin foto todavía</span>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={`Foto de ${nombre}`}
      loading={prioridad ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFallo(true)}
      className={cx('object-cover', className)}
    />
  );
}
