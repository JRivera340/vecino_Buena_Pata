import { Link } from 'react-router-dom';

export interface ItemMigas {
  texto: string;
  a?: string;
}

export function Migas({ items }: { items: ItemMigas[] }) {
  return (
    <nav aria-label="Migas de pan" className="mb-6 text-pequeno">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, indice) => {
          const esUltimo = indice === items.length - 1;
          return (
            <li key={`${item.texto}-${indice}`} className="flex items-center gap-2">
              {item.a && !esUltimo ? (
                <Link to={item.a} className="text-tinta-suave underline-offset-2 hover:text-verde-profundo hover:underline">
                  {item.texto}
                </Link>
              ) : (
                <span aria-current={esUltimo ? 'page' : undefined} className="font-semibold text-azul">
                  {item.texto}
                </span>
              )}
              {!esUltimo && (
                <span aria-hidden="true" className="text-tinta-suave">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
