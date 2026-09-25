import { CircleAlert, CircleCheck, QrCode } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { ErrorApi } from '@/core/api/cliente';
import { obtenerHojaVida } from '@/core/api/publico';
import { useCarga } from '@/core/api/useCarga';
import {
  etiquetaEspecie,
  etiquetaSexo,
  etiquetaTamano,
  formatearEdad,
  formatearFecha,
  formatearPeso,
} from '@/core/formato.lib';
import type { EstadoSalud } from '@/core/modelos/enums';
import type { HojaVidaPublica } from '@/core/modelos/publico';
import { Alerta } from '@/shared/ui/Alerta';
import { Boton, BotonEnlace } from '@/shared/ui/Boton';
import { Esqueleto } from '@/shared/ui/Esqueleto';
import { Etiqueta, EtiquetaEstado, type TonoEtiqueta } from '@/shared/ui/Etiqueta';
import { FotoAnimal } from '@/shared/ui/FotoAnimal';
import { Migas } from '@/shared/ui/Migas';
import { Tarjeta, TarjetaCuerpo } from '@/shared/ui/Tarjeta';
import { useTitulo } from '@/shared/ui/useTitulo';
import { etiquetaSalud } from './etiqueta-salud.lib';

const TONO_SALUD: Record<EstadoSalud, TonoEtiqueta> = { BUENO: 'exito', REGULAR: 'aviso', MALO: 'error' };

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="border-b border-black/10 pb-2">
      <dt className="text-minimo text-tinta-suave">{etiqueta}</dt>
      <dd className="text-cuerpo font-medium">{valor}</dd>
    </div>
  );
}

function Sello({ cumple, si, no }: { cumple: boolean; si: string; no: string }) {
  const Icono = cumple ? CircleCheck : CircleAlert;
  return (
    <Tarjeta className={cumple ? 'border-verde/50 bg-verde-tenue' : 'bg-lienzo-gris'}>
      <TarjetaCuerpo className="flex items-center gap-3 !p-4">
        <Icono
          className={cumple ? 'h-6 w-6 text-verde-profundo' : 'h-6 w-6 text-tinta-suave'}
          aria-hidden="true"
        />
        <span className={cumple ? 'font-semibold text-verde-tinta' : 'font-medium text-tinta-suave'}>
          {cumple ? si : no}
        </span>
      </TarjetaCuerpo>
    </Tarjeta>
  );
}

function UltimaVisita({ hoja }: { hoja: HojaVidaPublica }) {
  const visita = hoja.ultima_visita;
  if (!visita) {
    return (
      <p className="rounded border border-dashed border-lienzo-borde p-4 text-pequeno text-tinta-suave">
        Todavía no tiene visitas de seguimiento registradas.
      </p>
    );
  }
  const peso = formatearPeso(visita.peso_kg);
  return (
    <Tarjeta destacada>
      <TarjetaCuerpo className="space-y-3">
        <p className="font-medium">{formatearFecha(visita.fecha)}</p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-pequeno text-tinta-suave">Estado de salud</span>
          <Etiqueta tono={TONO_SALUD[visita.estado_salud]}>{etiquetaSalud(visita.estado_salud)}</Etiqueta>
          {peso && <span className="text-pequeno text-tinta-suave">Pesó {peso}</span>}
        </div>
      </TarjetaCuerpo>
    </Tarjeta>
  );
}

function Ficha({ hoja }: { hoja: HojaVidaPublica }) {
  const especie = etiquetaEspecie(hoja.especie);
  return (
    <>
      <Migas items={[{ texto: 'Inicio', a: '/' }, { texto: hoja.nombre }]} />
      <article className="grid gap-10 lg:grid-cols-[minmax(0,420px)_1fr]">
        <FotoAnimal
          ruta={hoja.foto_principal}
          nombre={hoja.nombre}
          especie={hoja.especie}
          prioridad
          className="aspect-[4/5] w-full rounded-seccion shadow-medio"
        />

        <div className="space-y-8">
          <header>
            <EtiquetaEstado estado="VBP_ACTIVO" />
            <h1 className="mt-3 text-h1 sm:text-hero">{hoja.nombre}</h1>
            <p className="mt-2 max-w-[52ch] text-h5 font-normal text-tinta-suave">
              {especie} {etiquetaSexo(hoja.sexo).toLowerCase()} de tamaño{' '}
              {etiquetaTamano(hoja.tamano).toLowerCase()}, del barrio {hoja.barrio}.
            </p>
          </header>

          {hoja.descripcion && <p className="max-w-[62ch]">{hoja.descripcion}</p>}

          <section aria-labelledby="titulo-datos">
            <h2 id="titulo-datos" className="text-h4">
              Datos de la ficha
            </h2>
            <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
              <Dato etiqueta="Especie" valor={especie} />
              <Dato etiqueta="Sexo" valor={etiquetaSexo(hoja.sexo)} />
              <Dato etiqueta="Tamaño" valor={etiquetaTamano(hoja.tamano)} />
              <Dato etiqueta="Edad estimada" valor={formatearEdad(hoja.edad_estimada)} />
              <Dato etiqueta="Barrio" valor={hoja.barrio} />
              <Dato etiqueta="En el programa desde" valor={formatearFecha(hoja.fecha_inscripcion)} />
            </dl>
          </section>

          <section aria-labelledby="titulo-salud" className="space-y-4">
            <h2 id="titulo-salud" className="text-h4">
              Salud y cuidado
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Sello cumple={hoja.esterilizado} si="Esterilizado" no="Sin esterilizar" />
              <Sello cumple={hoja.tiene_microchip} si="Con microchip" no="Sin microchip" />
            </div>
          </section>

          <section aria-labelledby="titulo-visita" className="space-y-4">
            <h2 id="titulo-visita" className="text-h4">
              Última visita de seguimiento
            </h2>
            <UltimaVisita hoja={hoja} />
          </section>

          <Alerta tipo="info">
            <span className="flex items-start gap-2">
              <QrCode className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <span>
                ¿Notas algo raro en {hoja.nombre}? Para reportar una novedad, escanea el código QR de su
                collar.
              </span>
            </span>
          </Alerta>
        </div>
      </article>
    </>
  );
}

function Cargando() {
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,420px)_1fr]" role="status" aria-label="Cargando la ficha">
      <Esqueleto className="aspect-[4/5] w-full" />
      <div className="space-y-4">
        <Esqueleto className="h-6 w-40" />
        <Esqueleto className="h-14 w-2/3" />
        <Esqueleto className="h-5 w-full" />
        <Esqueleto className="h-5 w-4/5" />
      </div>
    </div>
  );
}

export default function PaginaFicha() {
  const { id } = useParams();
  const numero = Number(id);
  const idValido = Number.isInteger(numero) && numero > 0;
  const { datos, cargando, error, recargar } = useCarga(
    () => (idValido ? obtenerHojaVida(numero) : Promise.reject(new ErrorApi(404, null))),
    [numero, idValido],
  );
  useTitulo(datos ? `Ficha de ${datos.nombre}` : 'Ficha del animal');

  let contenido;
  if (cargando) {
    contenido = <Cargando />;
  } else if (datos) {
    contenido = <Ficha hoja={datos} />;
  } else if (error instanceof ErrorApi && error.estado === 404) {
    contenido = (
      <div className="max-w-[56ch] space-y-4 py-8">
        <h1 className="text-h1">Este animal no está disponible</h1>
        <p className="text-tinta-suave">
          Puede que ya no haga parte del programa o que el enlace tenga un error. Vuelve al mapa para
          ver a los Vecinos Buena Pata activos.
        </p>
        <BotonEnlace to="/" tamano="grande">
          Volver al mapa
        </BotonEnlace>
      </div>
    );
  } else {
    contenido = (
      <Alerta tipo="error" titulo="No pudimos cargar la ficha">
        <p>Revisa tu conexión e inténtalo otra vez.</p>
        <Boton className="mt-3" tamano="pequeno" variante="secundario" onClick={recargar}>
          Reintentar
        </Boton>
      </Alerta>
    );
  }

  return <div className="contenedor py-10">{contenido}</div>;
}
