import { useEffect, useState } from 'react';
import { listarAnimales } from '@/core/api/animales';
import { descargarQr, formalizarAnimal } from '@/core/api/formalizacion';
import { mensajeError } from '@/core/api/mensaje-error';
import { useCarga } from '@/core/api/useCarga';
import { etiquetaEspecie } from '@/core/formato.lib';
import type { Animal } from '@/core/modelos/animal';
import type { FormalizacionRespuesta } from '@/core/modelos/seguimiento';
import { Alerta } from '@/shared/ui/Alerta';
import { Boton } from '@/shared/ui/Boton';
import { EncabezadoPagina } from '@/shared/ui/EncabezadoPagina';
import { ErrorCarga } from '@/shared/ui/ErrorCarga';
import { EtiquetaEstado } from '@/shared/ui/Etiqueta';
import { FotoAnimal } from '@/shared/ui/FotoAnimal';
import { Modal } from '@/shared/ui/Modal';
import { Tarjeta } from '@/shared/ui/Tarjeta';
import { useTitulo } from '@/shared/ui/useTitulo';

function ResultadoFormalizacion({ animal, resultado }: { animal: Animal; resultado: FormalizacionRespuesta }) {
  const [urlQr, setUrlQr] = useState<string | null>(null);
  const [falloQr, setFalloQr] = useState(false);

  useEffect(() => {
    let activo = true;
    let url: string | null = null;
    descargarQr(animal.id)
      .then((blob) => {
        if (!activo) {
          return;
        }
        url = URL.createObjectURL(blob);
        setUrlQr(url);
      })
      .catch(() => activo && setFalloQr(true));
    return () => {
      activo = false;
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [animal.id]);

  return (
    <div className="space-y-4 text-center">
      <p>
        {animal.nombre} ya es un Vecino Buena Pata. Este es el código de su collar:
      </p>
      <p className="text-h3 font-semibold tracking-wide text-verde-tinta">{resultado.codigo_collar}</p>
      {urlQr && (
        <div className="space-y-3">
          <img src={urlQr} alt={`Código QR del collar de ${animal.nombre}`} className="mx-auto h-56 w-56" />
          <a
            href={urlQr}
            download={`qr-${resultado.codigo_collar}.png`}
            className="inline-block font-semibold text-azul underline"
          >
            Descargar el QR
          </a>
        </div>
      )}
      {falloQr && <Alerta tipo="advertencia">No pudimos cargar el QR. Cierra esta ventana y ábrelo de nuevo desde la ficha.</Alerta>}
    </div>
  );
}

export default function PaginaFormalizacion() {
  useTitulo('Formalización');
  const animales = useCarga(listarAnimales, []);
  const [formalizando, setFormalizando] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hecho, setHecho] = useState<{ animal: Animal; resultado: FormalizacionRespuesta } | null>(null);

  const listos = (animales.datos ?? []).filter((animal) => animal.estado === 'EN_PROCESO');

  async function formalizar(animal: Animal) {
    setFormalizando(animal.id);
    setError(null);
    try {
      const resultado = await formalizarAnimal(animal.id);
      setHecho({ animal, resultado });
      animales.recargar();
    } catch (fallo) {
      setError(mensajeError(fallo, 'No pudimos formalizar al animal. Inténtalo de nuevo.'));
    } finally {
      setFormalizando(null);
    }
  }

  return (
    <div className="contenedor py-10">
      <EncabezadoPagina
        titulo="Formalización"
        descripcion="Animales con la validación aprobada que pueden recibir su collar con código QR."
      />
      {error && (
        <Alerta tipo="error" className="mb-6" alCerrar={() => setError(null)}>
          {error}
        </Alerta>
      )}

      {animales.error ? (
        <ErrorCarga titulo="No pudimos cargar los animales" alReintentar={animales.recargar} />
      ) : !animales.cargando && listos.length === 0 ? (
        <p className="rounded border border-dashed border-lienzo-borde p-8 text-center text-tinta-suave">
          No hay animales listos para formalizar.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {listos.map((animal) => (
            <li key={animal.id}>
              <Tarjeta className="flex h-full flex-col gap-4 p-4">
                <div className="flex gap-4">
                  <FotoAnimal
                    ruta={animal.foto_principal}
                    nombre={animal.nombre}
                    especie={animal.especie}
                    className="h-20 w-20 shrink-0 rounded"
                  />
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-h6 font-semibold">{animal.nombre}</p>
                    <p className="text-minimo text-tinta-suave">
                      {etiquetaEspecie(animal.especie)} en {animal.barrio}
                    </p>
                    <EtiquetaEstado estado={animal.estado} />
                  </div>
                </div>
                <Boton
                  className="mt-auto"
                  cargando={formalizando === animal.id}
                  disabled={formalizando !== null}
                  onClick={() => formalizar(animal)}
                >
                  Formalizar
                </Boton>
              </Tarjeta>
            </li>
          ))}
        </ul>
      )}

      <Modal abierto={hecho !== null} titulo="Collar listo" alCerrar={() => setHecho(null)}>
        {hecho && <ResultadoFormalizacion animal={hecho.animal} resultado={hecho.resultado} />}
      </Modal>
    </div>
  );
}
