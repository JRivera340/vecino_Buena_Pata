import { useState, type FormEvent } from 'react';
import { importarAnimales, type ResumenImportacion } from '@/core/api/importacion';
import { mensajeError } from '@/core/api/mensaje-error';
import { Alerta } from '@/shared/ui/Alerta';
import { Boton } from '@/shared/ui/Boton';
import { Campo, Entrada } from '@/shared/ui/Campo';
import { EncabezadoPagina } from '@/shared/ui/EncabezadoPagina';
import { Etiqueta } from '@/shared/ui/Etiqueta';
import { Tabla, type Columna } from '@/shared/ui/Tabla';
import { useTitulo } from '@/shared/ui/useTitulo';

const COLUMNAS: Columna<ResumenImportacion['filas'][number]>[] = [
  { clave: 'fila', titulo: 'Fila', celda: (f) => f.fila },
  {
    clave: 'estado',
    titulo: 'Resultado',
    celda: (f) => (
      <Etiqueta tono={f.estado === 'OK' ? (f.incompleto ? 'aviso' : 'exito') : 'error'}>
        {f.estado === 'OK' ? (f.incompleto ? 'Incompleto' : 'Importado') : 'Error'}
      </Etiqueta>
    ),
  },
  { clave: 'detalle', titulo: 'Detalle', celda: (f) => f.motivo ?? (f.animal_id ? `Animal #${f.animal_id}` : '—') },
];

export default function PaginaImportarAnimales() {
  useTitulo('Importar animales');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [resumen, setResumen] = useState<ResumenImportacion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (!archivo) {
      setError('Elige un archivo .csv.');
      return;
    }
    setEnviando(true);
    setError(null);
    setResumen(null);
    try {
      const datos = await importarAnimales(archivo);
      setResumen(datos);
    } catch (err) {
      setError(mensajeError(err, 'No pudimos procesar el archivo. Inténtalo de nuevo.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="contenedor space-y-8 py-10">
      <EncabezadoPagina
        titulo="Importar animales"
        descripcion="Carga un archivo .csv con registros históricos. Las filas sin comunidad o sin documento de quien inscribe quedan marcadas como incompletas y se pueden completar después desde la ficha de cada animal."
      />

      <form onSubmit={enviar} noValidate className="max-w-[48ch] space-y-4">
        <Campo
          id="importar-archivo"
          etiqueta="Archivo CSV"
          obligatorio
          ayuda="Columnas: nombre, especie, sexo, tamano, barrio, latitud, longitud, comunidad, tipo_documento, numero_documento, estado, causal_salida, fecha_salida, notas_salida, fecha_inscripcion."
        >
          {(props) => (
            <Entrada
              {...props}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
            />
          )}
        </Campo>
        {error && <Alerta tipo="error">{error}</Alerta>}
        <Boton type="submit" cargando={enviando}>
          Importar
        </Boton>
      </form>

      {resumen && (
        <section className="space-y-4">
          <div className="flex flex-wrap gap-4 text-pequeno">
            <span>Total: {resumen.total}</span>
            <span className="text-exito">Importados: {resumen.importados}</span>
            <span className="text-aviso">Incompletos: {resumen.incompletos}</span>
            <span className="text-peligro">Con error: {resumen.con_error}</span>
          </div>
          <Tabla
            columnas={COLUMNAS}
            filas={resumen.filas}
            claveFila={(f) => f.fila}
            descripcion="Resultado de la importación por fila"
          />
        </section>
      )}
    </div>
  );
}
