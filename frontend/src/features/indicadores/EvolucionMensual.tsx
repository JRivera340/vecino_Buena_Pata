import type { InscripcionesDelMes } from '@/core/modelos/indicadores';

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

export function nombreDelMes(mes: string): string {
  const [anio, numero] = mes.split('-');
  return `${MESES[Number(numero) - 1] ?? mes} de ${anio}`;
}

interface EvolucionMensualProps {
  meses: InscripcionesDelMes[];
}

// Barras apiladas: verde profundo para Santa Fe y azul para las otras localidades. Cada mes trae sus
// números escritos, así que el color no es lo único que informa.
export function EvolucionMensual({ meses }: EvolucionMensualProps) {
  if (meses.length === 0) {
    return <p className="text-pequeno text-tinta-suave">No hay inscripciones en este periodo.</p>;
  }
  const maximo = Math.max(...meses.map((mes) => mes.total));
  return (
    <div className="space-y-3">
      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-pequeno" aria-label="Convenciones">
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="h-3 w-3 rounded-sm bg-verde-profundo" />
          Santa Fe
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="h-3 w-3 rounded-sm bg-azul" />
          Otras localidades
        </li>
      </ul>
      <ul className="space-y-2" aria-label="Inscripciones por mes">
        {meses.map((mes) => (
          <li key={mes.mes} className="grid grid-cols-[9.5rem_1fr] items-center gap-3 text-pequeno">
            <span className="capitalize">{nombreDelMes(mes.mes)}</span>
            <div className="flex items-center gap-3">
              <div
                className="flex h-4 overflow-hidden rounded-sm bg-lienzo-gris"
                style={{ width: `${Math.max(6, (mes.total / maximo) * 100)}%` }}
              >
                <div
                  className="bg-verde-profundo"
                  style={{ width: `${(mes.santa_fe / mes.total) * 100}%` }}
                />
                <div className="bg-azul" style={{ width: `${(mes.otras / mes.total) * 100}%` }} />
              </div>
              <span className="whitespace-nowrap font-semibold">
                {mes.total}
                <span className="font-normal text-tinta-suave">
                  {' '}
                  ({mes.santa_fe} en Santa Fe, {mes.otras} en otras)
                </span>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
