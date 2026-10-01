import { useState } from 'react';
import { Link } from 'react-router-dom';
import { listarNotificaciones, marcarLeida } from '@/core/api/notificaciones-internas';
import { useCarga } from '@/core/api/useCarga';
import { formatearFecha } from '@/core/formato.lib';
import type { NotificacionInterna } from '@/core/modelos/notificacion-interna';
import { Alerta } from '@/shared/ui/Alerta';
import { Boton } from '@/shared/ui/Boton';
import { EncabezadoPagina } from '@/shared/ui/EncabezadoPagina';
import { ErrorCarga } from '@/shared/ui/ErrorCarga';
import { Etiqueta } from '@/shared/ui/Etiqueta';
import { Tabla, type Columna } from '@/shared/ui/Tabla';
import { useTitulo } from '@/shared/ui/useTitulo';

const ORIGENES: Record<NotificacionInterna['origen_tipo'], string> = {
  REPORTE: 'Reporte',
  VISITA_PREOCUPANTE: 'Visita preocupante',
  VISITA_VENCIDA: 'Visita vencida',
};

export default function PaginaNotificaciones() {
  useTitulo('Notificaciones');
  const notificaciones = useCarga(listarNotificaciones, []);
  const [marcando, setMarcando] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function marcar(id: number) {
    setMarcando(id);
    setError(null);
    try {
      await marcarLeida(id);
      notificaciones.recargar();
    } catch {
      setError('No pudimos marcar la notificación como leída. Inténtalo de nuevo.');
    } finally {
      setMarcando(null);
    }
  }

  const columnas: Columna<NotificacionInterna>[] = [
    { clave: 'fecha', titulo: 'Fecha', celda: (n) => formatearFecha(n.creada_en) },
    {
      clave: 'origen',
      titulo: 'Origen',
      celda: (n) => ORIGENES[n.origen_tipo] ?? n.origen_tipo,
    },
    {
      clave: 'animal',
      titulo: 'Animal',
      celda: (n) => (
        <Link to={`/animales/${n.animal_id}`} className="font-semibold text-azul underline">
          Ver ficha
        </Link>
      ),
    },
    {
      clave: 'estado',
      titulo: 'Estado',
      celda: (n) =>
        n.leida_en === null ? (
          <Etiqueta tono="aviso">Sin leer</Etiqueta>
        ) : (
          <Etiqueta tono="neutra">Leída</Etiqueta>
        ),
    },
    {
      clave: 'acciones',
      titulo: 'Acción',
      celda: (n) =>
        n.leida_en === null ? (
          <Boton
            tamano="pequeno"
            variante="secundario"
            cargando={marcando === n.id}
            onClick={() => marcar(n.id)}
          >
            Marcar leída
          </Boton>
        ) : null,
    },
  ];

  return (
    <div className="contenedor py-10">
      <EncabezadoPagina
        titulo="Notificaciones"
        descripcion="Avisos internos sobre reportes y visitas que requieren tu atención."
      />
      {error && (
        <Alerta tipo="error" className="mb-6" alCerrar={() => setError(null)}>
          {error}
        </Alerta>
      )}
      {notificaciones.error ? (
        <ErrorCarga titulo="No pudimos cargar las notificaciones" alReintentar={notificaciones.recargar} />
      ) : (
        <Tabla
          columnas={columnas}
          filas={notificaciones.datos ?? []}
          claveFila={(n) => n.id}
          descripcion="Notificaciones internas"
          cargando={notificaciones.cargando}
          vacio={<p className="text-tinta-suave">Todavía no tienes notificaciones.</p>}
        />
      )}
    </div>
  );
}
