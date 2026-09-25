import { useState, type FormEvent } from 'react';
import { subirArchivo } from '@/core/api/medios';
import { mensajeError } from '@/core/api/mensaje-error';
import { crearVisita, reactivarAnimal, registrarSalida } from '@/core/api/seguimiento';
import type { Animal } from '@/core/modelos/animal';
import type { CausalSalida, EstadoSalud } from '@/core/modelos/enums';
import { useSesion } from '@/core/sesion/sesion.store';
import { Alerta } from '@/shared/ui/Alerta';
import { Boton } from '@/shared/ui/Boton';
import { AreaTexto, Campo, Entrada, Selector } from '@/shared/ui/Campo';
import { Modal } from '@/shared/ui/Modal';
import { puedeReactivar, puedeRegistrarSalida, puedeRegistrarVisita } from './acciones-seguimiento.lib';
import { validarReactivacion, validarSalida, validarVisita } from './validar-seguimiento.lib';

type Accion = 'visita' | 'salida' | 'reactivacion' | null;

interface AccionesAnimalProps {
  animal: Animal;
  alActualizar: () => void;
}

const SALUD: { valor: EstadoSalud; texto: string }[] = [
  { valor: 'BUENO', texto: 'Bueno' },
  { valor: 'REGULAR', texto: 'Regular' },
  { valor: 'MALO', texto: 'Malo' },
];

const CAUSALES: { valor: CausalSalida; texto: string }[] = [
  { valor: 'ADOPCION', texto: 'Adopción' },
  { valor: 'PERDIDA', texto: 'Pérdida' },
  { valor: 'FALLECIMIENTO', texto: 'Fallecimiento' },
];

function hoyISO(): string {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

function FormularioVisita({ animal, alTerminar }: { animal: Animal; alTerminar: () => void }) {
  const [salud, setSalud] = useState<EstadoSalud>('BUENO');
  const [comportamiento, setComportamiento] = useState('');
  const [peso, setPeso] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [errores, setErrores] = useState<{ comportamiento?: string; peso?: string }>({});
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const { datos, errores: nuevos } = validarVisita({ comportamiento, peso, observaciones });
    setErrores(nuevos);
    if (!datos) {
      return;
    }
    setEnviando(true);
    setErrorEnvio(null);
    try {
      const ruta = foto ? (await subirArchivo(foto)).ruta : null;
      await crearVisita(animal.id, { ...datos, estado_salud: salud, foto: ruta });
      alTerminar();
    } catch (error) {
      setErrorEnvio(mensajeError(error, 'No pudimos registrar la visita. Inténtalo de nuevo.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form id="form-visita" onSubmit={enviar} noValidate className="space-y-4">
      <Campo id="visita-salud" etiqueta="Estado de salud" obligatorio>
        {(props) => (
          <Selector {...props} value={salud} onChange={(e) => setSalud(e.target.value as EstadoSalud)}>
            {SALUD.map((opcion) => (
              <option key={opcion.valor} value={opcion.valor}>
                {opcion.texto}
              </option>
            ))}
          </Selector>
        )}
      </Campo>
      <Campo id="visita-comportamiento" etiqueta="Comportamiento" obligatorio error={errores.comportamiento}>
        {(props) => <Entrada {...props} value={comportamiento} onChange={(e) => setComportamiento(e.target.value)} />}
      </Campo>
      <Campo id="visita-peso" etiqueta="Peso en kg" ayuda="Opcional." error={errores.peso}>
        {(props) => <Entrada {...props} inputMode="decimal" value={peso} onChange={(e) => setPeso(e.target.value)} />}
      </Campo>
      <Campo id="visita-observaciones" etiqueta="Observaciones" ayuda="Opcional.">
        {(props) => <AreaTexto {...props} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />}
      </Campo>
      <Campo id="visita-foto" etiqueta="Foto de la visita" ayuda="Opcional.">
        {(props) => (
          <Entrada {...props} type="file" accept="image/*" onChange={(e) => setFoto(e.target.files?.[0] ?? null)} />
        )}
      </Campo>
      {errorEnvio && <Alerta tipo="error">{errorEnvio}</Alerta>}
      <Boton type="submit" cargando={enviando} className="w-full sm:w-auto">
        Registrar visita
      </Boton>
    </form>
  );
}

function FormularioSalida({ animal, alTerminar }: { animal: Animal; alTerminar: () => void }) {
  const [causal, setCausal] = useState<CausalSalida>('ADOPCION');
  const [fecha, setFecha] = useState(hoyISO());
  const [notas, setNotas] = useState('');
  const [errores, setErrores] = useState<{ fecha?: string }>({});
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const { datos, errores: nuevos } = validarSalida({ causal, fecha, notas });
    setErrores(nuevos);
    if (!datos) {
      return;
    }
    setEnviando(true);
    setErrorEnvio(null);
    try {
      await registrarSalida(animal.id, datos);
      alTerminar();
    } catch (error) {
      setErrorEnvio(mensajeError(error, 'No pudimos registrar la salida. Inténtalo de nuevo.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form id="form-salida" onSubmit={enviar} noValidate className="space-y-4">
      <Campo id="salida-causal" etiqueta="Motivo de la salida" obligatorio>
        {(props) => (
          <Selector {...props} value={causal} onChange={(e) => setCausal(e.target.value as CausalSalida)}>
            {CAUSALES.map((opcion) => (
              <option key={opcion.valor} value={opcion.valor}>
                {opcion.texto}
              </option>
            ))}
          </Selector>
        )}
      </Campo>
      <Campo id="salida-fecha" etiqueta="Fecha" obligatorio error={errores.fecha}>
        {(props) => <Entrada {...props} type="date" max={hoyISO()} value={fecha} onChange={(e) => setFecha(e.target.value)} />}
      </Campo>
      <Campo id="salida-notas" etiqueta="Notas" ayuda="Opcional.">
        {(props) => <AreaTexto {...props} value={notas} onChange={(e) => setNotas(e.target.value)} />}
      </Campo>
      {errorEnvio && <Alerta tipo="error">{errorEnvio}</Alerta>}
      <Boton type="submit" variante="peligro" cargando={enviando} className="w-full sm:w-auto">
        Registrar salida
      </Boton>
    </form>
  );
}

function FormularioReactivacion({ animal, alTerminar }: { animal: Animal; alTerminar: () => void }) {
  const [salud, setSalud] = useState<EstadoSalud>('BUENO');
  const [comportamiento, setComportamiento] = useState('');
  const [errores, setErrores] = useState<{ comportamiento?: string }>({});
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const { datos, errores: nuevos } = validarReactivacion({ comportamiento });
    setErrores(nuevos);
    if (!datos) {
      return;
    }
    setEnviando(true);
    setErrorEnvio(null);
    try {
      await reactivarAnimal(animal.id, { ...datos, estado_salud: salud });
      alTerminar();
    } catch (error) {
      setErrorEnvio(mensajeError(error, 'No pudimos reactivar al animal. Inténtalo de nuevo.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form id="form-reactivacion" onSubmit={enviar} noValidate className="space-y-4">
      <Campo id="reactivacion-salud" etiqueta="Estado de salud al reaparecer" obligatorio>
        {(props) => (
          <Selector {...props} value={salud} onChange={(e) => setSalud(e.target.value as EstadoSalud)}>
            {SALUD.map((opcion) => (
              <option key={opcion.valor} value={opcion.valor}>
                {opcion.texto}
              </option>
            ))}
          </Selector>
        )}
      </Campo>
      <Campo id="reactivacion-comportamiento" etiqueta="Comportamiento" obligatorio error={errores.comportamiento}>
        {(props) => <Entrada {...props} value={comportamiento} onChange={(e) => setComportamiento(e.target.value)} />}
      </Campo>
      {errorEnvio && <Alerta tipo="error">{errorEnvio}</Alerta>}
      <Boton type="submit" cargando={enviando} className="w-full sm:w-auto">
        Reactivar
      </Boton>
    </form>
  );
}

export function AccionesAnimal({ animal, alActualizar }: AccionesAnimalProps) {
  const rol = useSesion((estado) => estado.sesion?.rol);
  const [accion, setAccion] = useState<Accion>(null);

  const visita = puedeRegistrarVisita(animal, rol);
  const salida = puedeRegistrarSalida(animal, rol);
  const reactivar = puedeReactivar(animal, rol);
  if (!visita && !salida && !reactivar) {
    return null;
  }

  const terminar = () => {
    setAccion(null);
    alActualizar();
  };
  const cerrar = () => setAccion(null);

  return (
    <div className="flex flex-wrap gap-3">
      {visita && <Boton onClick={() => setAccion('visita')}>Registrar visita</Boton>}
      {salida && (
        <Boton variante="secundario" onClick={() => setAccion('salida')}>
          Registrar salida
        </Boton>
      )}
      {reactivar && <Boton onClick={() => setAccion('reactivacion')}>Reactivar</Boton>}

      <Modal abierto={accion === 'visita'} titulo={`Visita a ${animal.nombre}`} alCerrar={cerrar}>
        <FormularioVisita animal={animal} alTerminar={terminar} />
      </Modal>
      <Modal abierto={accion === 'salida'} titulo={`Salida de ${animal.nombre}`} alCerrar={cerrar}>
        <FormularioSalida animal={animal} alTerminar={terminar} />
      </Modal>
      <Modal abierto={accion === 'reactivacion'} titulo={`Reactivar a ${animal.nombre}`} alCerrar={cerrar}>
        <FormularioReactivacion animal={animal} alTerminar={terminar} />
      </Modal>
    </div>
  );
}
