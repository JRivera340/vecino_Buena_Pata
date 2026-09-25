import { useState } from 'react';
import type { EstadoAnimal } from '@/core/modelos/enums';
import { Alerta } from '@/shared/ui/Alerta';
import { Boton } from '@/shared/ui/Boton';
import { AreaTexto, Campo, Entrada, Opcion, Selector } from '@/shared/ui/Campo';
import { Esqueleto } from '@/shared/ui/Esqueleto';
import { Etiqueta, EtiquetaEstado } from '@/shared/ui/Etiqueta';
import { Migas } from '@/shared/ui/Migas';
import { Modal } from '@/shared/ui/Modal';
import { Paginacion } from '@/shared/ui/Paginacion';
import { Tabla } from '@/shared/ui/Tabla';
import { Tarjeta, TarjetaCuerpo, TarjetaEncabezado, TarjetaPie } from '@/shared/ui/Tarjeta';

const ESTADOS: EstadoAnimal[] = ['CANDIDATO', 'EN_PROCESO', 'VBP_ACTIVO', 'ADOPTADO', 'PERDIDO', 'FALLECIDO'];
const FILAS = [
  { id: 1, nombre: 'Lulú', barrio: 'Teusaquillo', estado: 'VBP_ACTIVO' as const },
  { id: 2, nombre: 'Mailo', barrio: 'Bosa', estado: 'EN_PROCESO' as const },
  { id: 3, nombre: 'Monacho', barrio: 'Chapinero', estado: 'CANDIDATO' as const },
];

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 border-t border-black/10 py-10 first:border-t-0">
      <h2 className="text-h3">{titulo}</h2>
      {children}
    </section>
  );
}

export default function PaginaEstilos() {
  const [modal, setModal] = useState(false);
  const [pagina, setPagina] = useState(3);

  return (
    <div className="contenedor py-10">
      <Migas items={[{ texto: 'Inicio', a: '/' }, { texto: 'Guía de estilos' }]} />
      <h1 className="text-h1">Guía de estilos</h1>
      <p className="mt-2 max-w-[60ch] text-tinta-suave">
        Página de desarrollo con todos los componentes del sistema de diseño. No se incluye en producción.
      </p>

      <Seccion titulo="Botones">
        <div className="flex flex-wrap gap-3">
          <Boton>Guardar cambios</Boton>
          <Boton variante="secundario">Cancelar</Boton>
          <Boton variante="fantasma">Ver detalle</Boton>
          <Boton variante="peligro">Eliminar</Boton>
          <Boton cargando>Enviando</Boton>
          <Boton disabled>No disponible</Boton>
          <Boton tamano="pequeno">Pequeño</Boton>
          <Boton tamano="grande">Grande</Boton>
        </div>
      </Seccion>

      <Seccion titulo="Formularios">
        <div className="grid max-w-[720px] gap-6 sm:grid-cols-2">
          <Campo id="e-nombre" etiqueta="Nombre" obligatorio ayuda="Como lo conocen en el barrio.">
            {(p) => <Entrada {...p} placeholder="Ej.: Lulú" />}
          </Campo>
          <Campo id="e-error" etiqueta="Teléfono" error="Escribe un número de 10 dígitos.">
            {(p) => <Entrada {...p} defaultValue="300" />}
          </Campo>
          <Campo id="e-selector" etiqueta="Barrio">
            {(p) => (
              <Selector {...p}>
                <option>Teusaquillo</option>
                <option>Bosa</option>
              </Selector>
            )}
          </Campo>
          <Campo id="e-texto" etiqueta="Descripción">
            {(p) => <AreaTexto {...p} />}
          </Campo>
          <Opcion tipo="checkbox" id="e-check" etiqueta="Está esterilizado" />
          <Opcion tipo="radio" id="e-radio" name="r" etiqueta="Aprobado" />
        </div>
      </Seccion>

      <Seccion titulo="Tarjetas">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Tarjeta interactiva>
            <TarjetaCuerpo>Tarjeta simple con elevación al pasar el cursor.</TarjetaCuerpo>
          </Tarjeta>
          <Tarjeta destacada>
            <TarjetaEncabezado className="font-semibold">Tarjeta destacada</TarjetaEncabezado>
            <TarjetaCuerpo>Borde izquierdo verde para lo que importa.</TarjetaCuerpo>
          </Tarjeta>
          <Tarjeta>
            <TarjetaCuerpo>Con pie de acciones.</TarjetaCuerpo>
            <TarjetaPie>
              <Boton tamano="pequeno">Aceptar</Boton>
            </TarjetaPie>
          </Tarjeta>
        </div>
      </Seccion>

      <Seccion titulo="Etiquetas y estados">
        <div className="flex flex-wrap gap-2">
          <Etiqueta>Neutra</Etiqueta>
          <Etiqueta tono="info">Información</Etiqueta>
          <Etiqueta tono="exito">Éxito</Etiqueta>
          <Etiqueta tono="aviso">Aviso</Etiqueta>
          <Etiqueta tono="error">Error</Etiqueta>
        </div>
        <div className="flex flex-wrap gap-2">
          {ESTADOS.map((estado) => (
            <EtiquetaEstado key={estado} estado={estado} />
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Alertas">
        <Alerta tipo="info" titulo="Un dato útil">Los cambios se guardan al enviar el formulario.</Alerta>
        <Alerta tipo="exito">Listo, guardamos la visita.</Alerta>
        <Alerta tipo="advertencia">Falta el número de microchip para poder formalizar.</Alerta>
        <Alerta tipo="error" alCerrar={() => undefined}>No pudimos conectar con el servidor.</Alerta>
      </Seccion>

      <Seccion titulo="Tabla">
        <Tabla
          descripcion="Animales de ejemplo"
          filas={FILAS}
          claveFila={(fila) => fila.id}
          columnas={[
            { clave: 'nombre', titulo: 'Nombre', celda: (f) => f.nombre },
            { clave: 'barrio', titulo: 'Barrio', celda: (f) => f.barrio },
            { clave: 'estado', titulo: 'Estado', celda: (f) => <EtiquetaEstado estado={f.estado} /> },
          ]}
        />
        <Paginacion pagina={pagina} totalPaginas={12} alCambiar={setPagina} />
      </Seccion>

      <Seccion titulo="Carga y diálogo">
        <div className="space-y-2">
          <Esqueleto />
          <Esqueleto className="h-3 w-3/5" />
          <Esqueleto className="h-24 w-full" />
        </div>
        <Boton onClick={() => setModal(true)}>Abrir diálogo</Boton>
        <Modal
          abierto={modal}
          titulo="Registrar la salida"
          alCerrar={() => setModal(false)}
          pie={
            <>
              <Boton variante="secundario" onClick={() => setModal(false)}>
                Cancelar
              </Boton>
              <Boton onClick={() => setModal(false)}>Registrar salida</Boton>
            </>
          }
        >
          <p>Al registrar la salida, el collar del animal queda inactivo.</p>
        </Modal>
      </Seccion>
    </div>
  );
}
