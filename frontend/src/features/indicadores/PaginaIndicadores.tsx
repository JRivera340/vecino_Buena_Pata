import { listarAnimales } from '@/core/api/animales';
import { listarReportes } from '@/core/api/reportes';
import { useCarga } from '@/core/api/useCarga';
import { estadoVisual } from '@/shared/estado-visual/estado-visual.lib';
import { EncabezadoPagina } from '@/shared/ui/EncabezadoPagina';
import { ErrorCarga } from '@/shared/ui/ErrorCarga';
import { Esqueleto } from '@/shared/ui/Esqueleto';
import { Tarjeta, TarjetaCuerpo } from '@/shared/ui/Tarjeta';
import { useTitulo } from '@/shared/ui/useTitulo';
import { calcularIndicadores } from './calcular-indicadores.lib';
import { SeccionLocalidades } from './SeccionLocalidades';

function Cifra({ valor, texto }: { valor: number; texto: string }) {
  return (
    <Tarjeta destacada>
      <TarjetaCuerpo>
        <p className="text-hero font-semibold text-verde-tinta">{valor}</p>
        <p className="text-pequeno text-tinta-suave">{texto}</p>
      </TarjetaCuerpo>
    </Tarjeta>
  );
}

export default function PaginaIndicadores() {
  useTitulo('Indicadores');
  const datos = useCarga(async () => {
    const [animales, reportes] = await Promise.all([listarAnimales(), listarReportes()]);
    return { animales, resumen: calcularIndicadores(animales, reportes) };
  }, []);

  return (
    <div className="contenedor py-10">
      <EncabezadoPagina
        titulo="Indicadores"
        descripcion="Un resumen del programa en este momento."
      />

      {datos.error ? (
        <ErrorCarga titulo="No pudimos calcular los indicadores" alReintentar={datos.recargar} />
      ) : datos.cargando || !datos.datos ? (
        <div className="grid gap-4 sm:grid-cols-3" role="status" aria-label="Cargando indicadores">
          {[0, 1, 2].map((i) => (
            <Esqueleto key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-14">
          <div className="space-y-10">
            <div className="grid gap-4 sm:grid-cols-3">
              <Cifra valor={datos.datos.resumen.totalAnimales} texto="Animales inscritos" />
              <Cifra
                valor={datos.datos.resumen.totalVbpActivos}
                texto="Vecinos Buena Pata activos"
              />
              <Cifra valor={datos.datos.resumen.totalReportesAbiertos} texto="Reportes abiertos" />
            </div>

            <section aria-labelledby="titulo-estados" className="space-y-4">
              <h2 id="titulo-estados" className="text-h4">
                Animales por estado
              </h2>
              <ul className="space-y-3">
                {datos.datos.resumen.conteoPorEstado.map((fila) => {
                  const visual = estadoVisual(fila.estado);
                  const total = datos.datos?.resumen.totalAnimales ?? 0;
                  const porcentaje = total > 0 ? Math.round((fila.cantidad / total) * 100) : 0;
                  return (
                    <li
                      key={fila.estado}
                      className="grid grid-cols-[9rem_1fr_2.5rem] items-center gap-3 text-pequeno"
                    >
                      <span>{visual.etiqueta}</span>
                      <div className="h-3 overflow-hidden rounded-full bg-lienzo-gris">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${porcentaje}%`, backgroundColor: visual.color }}
                        />
                      </div>
                      <span className="text-right font-semibold">{fila.cantidad}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>

          <SeccionLocalidades animales={datos.datos.animales} />
        </div>
      )}
    </div>
  );
}
