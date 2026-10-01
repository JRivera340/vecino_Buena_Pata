import { useParams } from 'react-router-dom';
import { ErrorApi } from '@/core/api/cliente';
import { obtenerAnimalPorCodigo } from '@/core/api/publico';
import { useCarga } from '@/core/api/useCarga';
import { etiquetaEspecie, etiquetaSexo, etiquetaTamano } from '@/core/formato.lib';
import { BotonEnlace } from '@/shared/ui/Boton';
import { Esqueleto } from '@/shared/ui/Esqueleto';
import { FotoAnimal } from '@/shared/ui/FotoAnimal';
import { useTitulo } from '@/shared/ui/useTitulo';
import { FormularioReporte } from './FormularioReporte';

export default function PaginaQr() {
  const { codigo = '' } = useParams();
  const {
    datos: animal,
    cargando,
    error,
  } = useCarga(() => obtenerAnimalPorCodigo(codigo), [codigo]);
  useTitulo(animal ? `Ficha de ${animal.nombre}` : 'Código del collar');

  if (cargando) {
    return (
      <div
        className="contenedor max-w-[720px] space-y-4 py-10"
        role="status"
        aria-label="Cargando la ficha"
      >
        <Esqueleto className="h-56 w-full" />
        <Esqueleto className="h-8 w-1/2" />
      </div>
    );
  }

  if (!animal) {
    const noExiste = error instanceof ErrorApi && error.estado === 404;
    return (
      <div className="contenedor max-w-[56ch] space-y-4 py-14">
        <h1 className="text-h1">
          {noExiste ? 'No encontramos este código' : 'No pudimos abrir la ficha'}
        </h1>
        <p className="text-tinta-suave">
          {noExiste
            ? 'Revisa que el código del collar esté bien leído. Si el problema sigue, avísale a quien te lo compartió.'
            : 'Revisa tu conexión e inténtalo de nuevo.'}
        </p>
        <BotonEnlace to="/" tamano="grande">
          Ir al mapa
        </BotonEnlace>
      </div>
    );
  }

  return (
    <div className="contenedor max-w-[720px] space-y-8 py-10">
      <article className="overflow-hidden rounded-seccion border border-black/15 bg-white shadow-sutil">
        <FotoAnimal
          ruta={animal.foto_principal}
          nombre={animal.nombre}
          especie={animal.especie}
          prioridad
          className="aspect-[16/10] w-full"
        />
        <div className="space-y-2 p-6">
          <h1 className="text-h1">{animal.nombre}</h1>
          <p className="text-tinta-suave">
            {etiquetaEspecie(animal.especie)} {etiquetaSexo(animal.sexo).toLowerCase()} de tamaño{' '}
            {etiquetaTamano(animal.tamano).toLowerCase()}, del barrio {animal.barrio}.
          </p>
          {animal.descripcion && <p className="max-w-[62ch]">{animal.descripcion}</p>}
          <p className="pt-2 text-pequeno font-semibold text-verde-tinta">
            Vecino Buena Pata del programa de la Alcaldía Local de Santa Fe
          </p>
        </div>
      </article>

      <FormularioReporte codigo={codigo} animal={animal.nombre} />
    </div>
  );
}
