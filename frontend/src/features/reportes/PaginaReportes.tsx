import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { mensajeError } from '@/core/api/mensaje-error';
import { listarReportes, registrarAtencion } from '@/core/api/reportes';
import { useCarga } from '@/core/api/useCarga';
import { formatearFecha } from '@/core/formato.lib';
import type { EstadoReporte } from '@/core/modelos/enums';
import type { Reporte } from '@/core/modelos/reporte';
import { useSesion } from '@/core/sesion/sesion.store';
import { Alerta } from '@/shared/ui/Alerta';
import { Boton } from '@/shared/ui/Boton';
import { AreaTexto, Campo } from '@/shared/ui/Campo';
import { EncabezadoPagina } from '@/shared/ui/EncabezadoPagina';
import { ErrorCarga } from '@/shared/ui/ErrorCarga';
import { Etiqueta, type TonoEtiqueta } from '@/shared/ui/Etiqueta';
import { Modal } from '@/shared/ui/Modal';
import { Tabla, type Columna } from '@/shared/ui/Tabla';
import { useTitulo } from '@/shared/ui/useTitulo';
import { puedeAtenderReportes } from './permisos-reportes.lib';

const ESTADOS: Record<EstadoReporte, { texto: string; tono: TonoEtiqueta }> = {
  NUEVO: { texto: 'Nuevo', tono: 'info' },
  EN_ATENCION: { texto: 'En atención', tono: 'aviso' },
  ATENDIDO: { texto: 'Atendido', tono: 'exito' },
  CERRADO: { texto: 'Cerrado', tono: 'neutra' },
};

function FormularioAtencion({ reporte, alTerminar }: { reporte: Reporte; alTerminar: () => void }) {
  const [acciones, setAcciones] = useState('');
  const [resultado, setResultado] = useState('');
  const [errores, setErrores] = useState<{ acciones?: string; resultado?: string }>({});
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const nuevos: { acciones?: string; resultado?: string } = {};
    if (acciones.trim() === '') {
      nuevos.acciones = 'Cuenta qué hiciste para atender el reporte.';
    }
    if (resultado.trim() === '') {
      nuevos.resultado = 'Cuenta cómo quedó la situación.';
    }
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) {
      return;
    }
    setEnviando(true);
    setErrorEnvio(null);
    try {
      await registrarAtencion(reporte.id, { acciones_realizadas: acciones.trim(), resultado: resultado.trim() });
      alTerminar();
    } catch (error) {
      setErrorEnvio(mensajeError(error, 'No pudimos registrar la atención. Inténtalo de nuevo.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-4">
      <p className="rounded bg-lienzo-gris p-3 text-pequeno">{reporte.descripcion}</p>
      <Campo id="atencion-acciones" etiqueta="Acciones realizadas" obligatorio error={errores.acciones}>
        {(props) => <AreaTexto {...props} value={acciones} onChange={(e) => setAcciones(e.target.value)} />}
      </Campo>
      <Campo id="atencion-resultado" etiqueta="Resultado" obligatorio error={errores.resultado}>
        {(props) => <AreaTexto {...props} value={resultado} onChange={(e) => setResultado(e.target.value)} />}
      </Campo>
      {errorEnvio && <Alerta tipo="error">{errorEnvio}</Alerta>}
      <Boton type="submit" cargando={enviando} className="w-full sm:w-auto">
        Registrar atención
      </Boton>
    </form>
  );
}

export default function PaginaReportes() {
  useTitulo('Reportes');
  const rol = useSesion((estado) => estado.sesion?.rol);
  const reportes = useCarga(listarReportes, []);
  const [atendiendo, setAtendiendo] = useState<Reporte | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const puedeAtender = puedeAtenderReportes(rol);

  const columnas: Columna<Reporte>[] = [
    { clave: 'fecha', titulo: 'Fecha', celda: (r) => formatearFecha(r.fecha) },
    {
      clave: 'animal',
      titulo: 'Animal',
      celda: (r) => (
        <Link to={`/animales/${r.animal_id}`} className="font-semibold text-azul underline">
          Ver ficha
        </Link>
      ),
    },
    { clave: 'reportante', titulo: 'Reportó', celda: (r) => r.reportante_nombre },
    { clave: 'descripcion', titulo: 'Descripción', celda: (r) => r.descripcion, className: 'max-w-[32ch]' },
    {
      clave: 'estado',
      titulo: 'Estado',
      celda: (r) => <Etiqueta tono={ESTADOS[r.estado].tono}>{ESTADOS[r.estado].texto}</Etiqueta>,
    },
  ];
  if (puedeAtender) {
    columnas.push({
      clave: 'acciones',
      titulo: 'Acción',
      celda: (r) =>
        r.estado === 'CERRADO' ? null : (
          <Boton tamano="pequeno" variante="secundario" onClick={() => setAtendiendo(r)}>
            Atender
          </Boton>
        ),
    });
  }

  return (
    <div className="contenedor py-10">
      <EncabezadoPagina
        titulo="Reportes de novedades"
        descripcion="Avisos que la comunidad envía escaneando el QR del collar."
      />
      {aviso && (
        <Alerta tipo="exito" className="mb-6" alCerrar={() => setAviso(null)}>
          {aviso}
        </Alerta>
      )}
      {reportes.error ? (
        <ErrorCarga titulo="No pudimos cargar los reportes" alReintentar={reportes.recargar} />
      ) : (
        <Tabla
          columnas={columnas}
          filas={reportes.datos ?? []}
          claveFila={(r) => r.id}
          descripcion="Reportes de novedades"
          cargando={reportes.cargando}
          vacio={<p className="text-tinta-suave">Todavía no hay reportes.</p>}
        />
      )}

      <Modal abierto={atendiendo !== null} titulo="Atender reporte" alCerrar={() => setAtendiendo(null)}>
        {atendiendo && (
          <FormularioAtencion
            key={atendiendo.id}
            reporte={atendiendo}
            alTerminar={() => {
              setAtendiendo(null);
              setAviso('Registramos la atención del reporte.');
              reportes.recargar();
            }}
          />
        )}
      </Modal>
    </div>
  );
}
