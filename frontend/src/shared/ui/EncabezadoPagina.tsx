import type { ReactNode } from 'react';
import { Migas, type ItemMigas } from './Migas';

interface EncabezadoPaginaProps {
  titulo: string;
  descripcion?: string;
  migas?: ItemMigas[];
  acciones?: ReactNode;
}

export function EncabezadoPagina({ titulo, descripcion, migas, acciones }: EncabezadoPaginaProps) {
  return (
    <header className="mb-8">
      {migas && <Migas items={migas} />}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h1">{titulo}</h1>
          {descripcion && <p className="mt-2 max-w-[62ch] text-tinta-suave">{descripcion}</p>}
        </div>
        {acciones}
      </div>
    </header>
  );
}
