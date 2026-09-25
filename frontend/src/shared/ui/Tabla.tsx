import type { ReactNode } from 'react';
import { cx } from './clases';
import { Esqueleto } from './Esqueleto';

export interface Columna<T> {
  clave: string;
  titulo: string;
  celda: (fila: T) => ReactNode;
  alineacion?: 'izquierda' | 'derecha';
  className?: string;
}

interface TablaProps<T> {
  columnas: Columna<T>[];
  filas: T[];
  claveFila: (fila: T) => string | number;
  descripcion: string;
  vacio?: ReactNode;
  cargando?: boolean;
}

export function Tabla<T>({ columnas, filas, claveFila, descripcion, vacio, cargando }: TablaProps<T>) {
  if (cargando) {
    return (
      <div className="space-y-3" role="status" aria-label="Cargando datos">
        {[0, 1, 2].map((i) => (
          <Esqueleto key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (filas.length === 0) {
    return <div className="rounded border border-dashed border-lienzo-borde p-8 text-center">{vacio}</div>;
  }

  return (
    <>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full border-collapse text-pequeno">
          <caption className="solo-lectores">{descripcion}</caption>
          <thead>
            <tr>
              {columnas.map((columna) => (
                <th
                  key={columna.clave}
                  scope="col"
                  className={cx(
                    'bg-verde-profundo px-4 py-3 font-semibold text-white',
                    columna.alineacion === 'derecha' ? 'text-right' : 'text-left',
                  )}
                >
                  {columna.titulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => (
              <tr
                key={claveFila(fila)}
                className="border-b border-black/10 transition-colors even:bg-verde/5 hover:bg-[#f5f5f5]"
              >
                {columnas.map((columna) => (
                  <td
                    key={columna.clave}
                    className={cx(
                      'px-4 py-3 align-middle',
                      columna.alineacion === 'derecha' && 'text-right',
                      columna.className,
                    )}
                  >
                    {columna.celda(fila)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 sm:hidden" aria-label={descripcion}>
        {filas.map((fila) => (
          <li key={claveFila(fila)} className="rounded-tarjeta border border-black/15 bg-white p-4 shadow-sutil">
            <dl className="space-y-2">
              {columnas.map((columna) => (
                <div key={columna.clave} className="flex justify-between gap-4">
                  <dt className="text-minimo text-tinta-suave">{columna.titulo}</dt>
                  <dd className="text-right text-pequeno">{columna.celda(fila)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}
