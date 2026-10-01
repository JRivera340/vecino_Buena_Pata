import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { listarMisPerritos } from '@/core/api/animales';
import { useCarga } from '@/core/api/useCarga';
import { etiquetaEspecie } from '@/core/formato.lib';
import type { Animal } from '@/core/modelos/animal';
import { EncabezadoPagina } from '@/shared/ui/EncabezadoPagina';
import { ErrorCarga } from '@/shared/ui/ErrorCarga';
import { Esqueleto } from '@/shared/ui/Esqueleto';
import { EtiquetaEstado } from '@/shared/ui/Etiqueta';
import { FotoAnimal } from '@/shared/ui/FotoAnimal';
import { Tarjeta } from '@/shared/ui/Tarjeta';
import { useTitulo } from '@/shared/ui/useTitulo';

export default function PaginaMisPerritos() {
  useTitulo('Mis perritos');
  const animales = useCarga(listarMisPerritos, []);
  const lista: Animal[] = useMemo(() => animales.datos ?? [], [animales.datos]);

  return (
    <div className="contenedor py-10">
      <EncabezadoPagina
        titulo="Mis perritos"
        descripcion="Los animales inscritos por tu comunidad."
      />

      {animales.error ? (
        <ErrorCarga titulo="No pudimos cargar tus perritos" alReintentar={animales.recargar} />
      ) : animales.cargando ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, indice) => (
            <Esqueleto key={indice} className="h-28 w-full" />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <p className="rounded border border-dashed border-lienzo-borde p-8 text-center text-tinta-suave">
          Tu comunidad aún no tiene perritos inscritos.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {lista.map((animal) => (
            <li key={animal.id}>
              <Link to={`/animales/${animal.id}`} className="block h-full no-underline">
                <Tarjeta interactiva className="flex h-full gap-4 p-4">
                  <FotoAnimal
                    ruta={animal.foto_principal}
                    nombre={animal.nombre}
                    especie={animal.especie}
                    className="h-20 w-20 shrink-0 rounded"
                  />
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-h6 font-semibold text-tinta">{animal.nombre}</p>
                    <p className="text-minimo text-tinta-suave">
                      {etiquetaEspecie(animal.especie)} en {animal.barrio}
                    </p>
                    <EtiquetaEstado estado={animal.estado} />
                  </div>
                </Tarjeta>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
