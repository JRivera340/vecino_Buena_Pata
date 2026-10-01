import { useState, type FormEvent } from 'react';
import { verificarInscriptor } from '@/core/api/inscripcion-publica';
import { mensajeError } from '@/core/api/mensaje-error';
import {
  etiquetaEspecie,
  etiquetaSexo,
  etiquetaTamano,
  formatearEdad,
  formatearFecha,
} from '@/core/formato.lib';
import type { TipoDocumento } from '@/core/modelos/enums';
import type { AnimalDeInscriptor } from '@/core/modelos/inscripcion';
import { TIPOS_DOCUMENTO, validarDocumento } from '@/features/publico/inscripcion/documento.lib';
import { Alerta } from '@/shared/ui/Alerta';
import { Boton } from '@/shared/ui/Boton';
import { Campo, Entrada, Selector } from '@/shared/ui/Campo';
import { EncabezadoPagina } from '@/shared/ui/EncabezadoPagina';
import { EtiquetaEstado } from '@/shared/ui/Etiqueta';
import { FotoAnimal } from '@/shared/ui/FotoAnimal';
import { Tarjeta } from '@/shared/ui/Tarjeta';
import { useTitulo } from '@/shared/ui/useTitulo';

export default function PaginaMisInscripciones() {
  useTitulo('Mis inscripciones');
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('CC');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [errorDocumento, setErrorDocumento] = useState<string | null>(null);
  const [consultando, setConsultando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [animales, setAnimales] = useState<AnimalDeInscriptor[] | null>(null);

  async function consultar(evento: FormEvent) {
    evento.preventDefault();
    const error = validarDocumento(numeroDocumento);
    setErrorDocumento(error);
    setErrorEnvio(null);
    if (error) {
      setAnimales(null);
      return;
    }
    setConsultando(true);
    try {
      const respuesta = await verificarInscriptor({
        tipo_documento: tipoDocumento,
        numero_documento: numeroDocumento.trim(),
      });
      setAnimales(respuesta.animales);
    } catch (error) {
      setErrorEnvio(mensajeError(error, 'No pudimos consultar tus inscripciones. Inténtalo de nuevo.'));
      setAnimales(null);
    } finally {
      setConsultando(false);
    }
  }

  return (
    <div className="contenedor py-10">
      <EncabezadoPagina
        titulo="Mis inscripciones"
        descripcion="Consulta con tu documento los animales que has inscrito en el programa."
      />

      <form onSubmit={consultar} noValidate className="grid max-w-[520px] gap-4 sm:grid-cols-[auto,1fr]">
        <Campo id="mis-inscripciones-tipo-documento" etiqueta="Tipo de documento" obligatorio>
          {(props) => (
            <Selector
              {...props}
              value={tipoDocumento}
              onChange={(e) => setTipoDocumento(e.target.value as TipoDocumento)}
            >
              {TIPOS_DOCUMENTO.map((tipo) => (
                <option key={tipo.valor} value={tipo.valor}>
                  {tipo.texto}
                </option>
              ))}
            </Selector>
          )}
        </Campo>
        <Campo
          id="mis-inscripciones-numero-documento"
          etiqueta="Número de documento"
          obligatorio
          error={errorDocumento}
        >
          {(props) => (
            <Entrada
              {...props}
              value={numeroDocumento}
              onChange={(e) => setNumeroDocumento(e.target.value)}
            />
          )}
        </Campo>
        <div className="sm:col-span-2">
          <Boton type="submit" cargando={consultando} movilCompleto>
            Consultar
          </Boton>
        </div>
      </form>

      {errorEnvio && (
        <Alerta tipo="error" className="mt-6 max-w-[520px]">
          {errorEnvio}
        </Alerta>
      )}

      {animales && (
        <section aria-labelledby="titulo-resultados" className="mt-8 space-y-4">
          <h2 id="titulo-resultados" className="text-h5 font-semibold">
            {animales.length === 0
              ? 'No encontramos inscripciones con ese documento'
              : animales.length === 1
                ? 'Encontramos 1 inscripción'
                : `Encontramos ${animales.length} inscripciones`}
          </h2>
          {animales.length > 0 && (
            <ul className="space-y-3">
              {animales.map((animal) => (
                <li key={animal.id}>
                  <Tarjeta className="flex gap-4 p-4">
                    <FotoAnimal
                      ruta={animal.foto_principal}
                      nombre={animal.nombre}
                      especie={animal.especie}
                      className="h-24 w-24 shrink-0 rounded"
                    />
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-h6 font-semibold">{animal.nombre}</p>
                        <EtiquetaEstado estado={animal.estado} />
                      </div>
                      <p className="text-pequeno text-tinta-suave">
                        {etiquetaEspecie(animal.especie)}, {etiquetaSexo(animal.sexo).toLowerCase()},
                        tamaño {etiquetaTamano(animal.tamano).toLowerCase()},{' '}
                        {formatearEdad(animal.edad_estimada).toLowerCase()}
                      </p>
                      <p className="text-pequeno text-tinta-suave">
                        Barrio {animal.barrio}. Inscrito el {formatearFecha(animal.fecha_inscripcion)}.
                      </p>
                      <p className="text-pequeno text-tinta-suave">
                        {animal.esterilizado ? 'Esterilizado' : 'Sin esterilizar'},{' '}
                        {animal.tiene_microchip ? 'con' : 'sin'} microchip.
                      </p>
                      {animal.descripcion && <p className="text-pequeno">{animal.descripcion}</p>}
                    </div>
                  </Tarjeta>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
