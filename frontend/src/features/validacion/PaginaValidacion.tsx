import { useState, type FormEvent } from 'react';
import { listarAnimales } from '@/core/api/animales';
import { mensajeError } from '@/core/api/mensaje-error';
import { crearValidacion } from '@/core/api/validaciones';
import { useCarga } from '@/core/api/useCarga';
import { etiquetaEspecie, formatearFecha } from '@/core/formato.lib';
import type { Animal } from '@/core/modelos/animal';
import type { VeredictoValidacion } from '@/core/modelos/enums';
import { Alerta } from '@/shared/ui/Alerta';
import { Boton } from '@/shared/ui/Boton';
import { AreaTexto, Campo, Entrada, Opcion } from '@/shared/ui/Campo';
import { EncabezadoPagina } from '@/shared/ui/EncabezadoPagina';
import { ErrorCarga } from '@/shared/ui/ErrorCarga';
import { EtiquetaEstado } from '@/shared/ui/Etiqueta';
import { FotoAnimal } from '@/shared/ui/FotoAnimal';
import { Modal } from '@/shared/ui/Modal';
import { Tarjeta } from '@/shared/ui/Tarjeta';
import { useTitulo } from '@/shared/ui/useTitulo';
import { armarValidacion, type ErroresValidacion } from './armar-validacion.lib';

const PENDIENTES = [
  { valor: 'SIN_CHIP', texto: 'Sin microchip' },
  { valor: 'SIN_ESTERILIZAR', texto: 'Sin esterilizar' },
  { valor: 'COMPORTAMIENTO', texto: 'Comportamiento' },
  { valor: 'SALUD', texto: 'Salud' },
];

function FormularioValidacion({ animal, alTerminar }: { animal: Animal; alTerminar: () => void }) {
  const [veredicto, setVeredicto] = useState<VeredictoValidacion>('APROBADO');
  const [pendientes, setPendientes] = useState<string[]>([]);
  const [observaciones, setObservaciones] = useState('');
  const [esterilizado, setEsterilizado] = useState(animal.esterilizado);
  const [microchip, setMicrochip] = useState(animal.numero_microchip ?? '');
  const [errores, setErrores] = useState<ErroresValidacion>({});
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function alternar(valor: string, marcado: boolean) {
    setPendientes((actuales) => (marcado ? [...actuales, valor] : actuales.filter((p) => p !== valor)));
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const { datos, errores: nuevos } = armarValidacion({
      veredicto,
      pendientes,
      observaciones,
      esterilizado,
      numeroMicrochip: microchip,
    });
    setErrores(nuevos);
    if (!datos) {
      return;
    }
    setEnviando(true);
    setErrorEnvio(null);
    try {
      await crearValidacion(animal.id, datos);
      alTerminar();
    } catch (error) {
      setErrorEnvio(mensajeError(error, 'No pudimos guardar la validación. Inténtalo de nuevo.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-4">
      <fieldset className="space-y-2">
        <legend className="text-pequeno font-semibold">Veredicto</legend>
        <Opcion
          id="veredicto-aprobado"
          tipo="radio"
          name="veredicto"
          etiqueta="Aprobado"
          checked={veredicto === 'APROBADO'}
          onChange={() => setVeredicto('APROBADO')}
        />
        <Opcion
          id="veredicto-pendientes"
          tipo="radio"
          name="veredicto"
          etiqueta="Con pendientes"
          checked={veredicto === 'CON_PENDIENTES'}
          onChange={() => setVeredicto('CON_PENDIENTES')}
        />
      </fieldset>

      {veredicto === 'CON_PENDIENTES' && (
        <fieldset className="space-y-2">
          <legend className="text-pequeno font-semibold">Pendientes</legend>
          {PENDIENTES.map((pendiente) => (
            <Opcion
              key={pendiente.valor}
              id={`pendiente-${pendiente.valor}`}
              tipo="checkbox"
              etiqueta={pendiente.texto}
              checked={pendientes.includes(pendiente.valor)}
              onChange={(e) => alternar(pendiente.valor, e.target.checked)}
            />
          ))}
          {errores.pendientes && (
            <p role="alert" className="text-minimo text-peligro">
              {errores.pendientes}
            </p>
          )}
        </fieldset>
      )}

      <Opcion
        id="val-esterilizado"
        tipo="checkbox"
        etiqueta="Está esterilizado"
        checked={esterilizado}
        onChange={(e) => setEsterilizado(e.target.checked)}
      />
      <Campo id="val-microchip" etiqueta="Número de microchip" ayuda="Opcional. De 9 a 15 dígitos." error={errores.numeroMicrochip}>
        {(props) => <Entrada {...props} inputMode="numeric" value={microchip} onChange={(e) => setMicrochip(e.target.value)} />}
      </Campo>
      <Campo id="val-observaciones" etiqueta="Observaciones" ayuda="Opcional.">
        {(props) => <AreaTexto {...props} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />}
      </Campo>
      {errorEnvio && <Alerta tipo="error">{errorEnvio}</Alerta>}
      <Boton type="submit" cargando={enviando} className="w-full sm:w-auto">
        Guardar validación
      </Boton>
    </form>
  );
}

export default function PaginaValidacion() {
  useTitulo('Validación veterinaria');
  const animales = useCarga(listarAnimales, []);
  const [elegido, setElegido] = useState<Animal | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const pendientes = (animales.datos ?? []).filter(
    (animal) => animal.estado === 'CANDIDATO' || animal.estado === 'EN_PROCESO',
  );

  return (
    <div className="contenedor py-10">
      <EncabezadoPagina
        titulo="Validación veterinaria"
        descripcion="Animales que esperan la revisión de un veterinario para entrar al programa."
      />
      {aviso && (
        <Alerta tipo="exito" className="mb-6" alCerrar={() => setAviso(null)}>
          {aviso}
        </Alerta>
      )}

      {animales.error ? (
        <ErrorCarga titulo="No pudimos cargar los animales" alReintentar={animales.recargar} />
      ) : !animales.cargando && pendientes.length === 0 ? (
        <p className="rounded border border-dashed border-lienzo-borde p-8 text-center text-tinta-suave">
          No hay animales esperando validación.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pendientes.map((animal) => (
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
                    <p className="text-minimo text-tinta-suave">Inscrito {formatearFecha(animal.fecha_inscripcion)}</p>
                    <EtiquetaEstado estado={animal.estado} />
                  </div>
                </div>
                <Boton variante="secundario" onClick={() => setElegido(animal)} className="mt-auto">
                  Validar
                </Boton>
              </Tarjeta>
            </li>
          ))}
        </ul>
      )}

      <Modal abierto={elegido !== null} titulo={elegido ? `Validar a ${elegido.nombre}` : ''} alCerrar={() => setElegido(null)}>
        {elegido && (
          <FormularioValidacion
            key={elegido.id}
            animal={elegido}
            alTerminar={() => {
              setAviso(`Guardamos la validación de ${elegido.nombre}.`);
              setElegido(null);
              animales.recargar();
            }}
          />
        )}
      </Modal>
    </div>
  );
}
