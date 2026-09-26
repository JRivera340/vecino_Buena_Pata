// Cinco tonos de la paleta verde del Observatorio. Se distinguen por luminosidad (de muy claro a muy
// oscuro), así que la escala se lee aunque no se perciban bien los colores.
export const TONOS_VERDES = ['#eef5dc', '#cfe39a', '#a5c95b', '#719d15', '#45591a'] as const;
export const COLOR_SIN_ANIMALES = '#f1f1f1';

export interface RangoEscala {
  desde: number;
  hasta: number;
  color: string;
  etiqueta: string;
}

export interface EscalaCoropletica {
  rangos: RangoEscala[];
  colorDe: (valor: number) => string;
}

function etiquetaDe(desde: number, hasta: number, esUltimo: boolean, hayMasDeUno: boolean): string {
  if (desde === hasta) {
    return String(desde);
  }
  if (esUltimo && hayMasDeUno) {
    return `${desde} o más`;
  }
  return `${desde} a ${hasta}`;
}

// Elige a cuáles de los cinco tonos usar cuando hay menos de cinco rangos, repartidos de claro a oscuro.
function tonosPara(cantidad: number): string[] {
  if (cantidad === 1) {
    return [TONOS_VERDES[3]];
  }
  return Array.from(
    { length: cantidad },
    (_, i) => TONOS_VERDES[Math.round((i * (TONOS_VERDES.length - 1)) / (cantidad - 1))],
  );
}

export function crearEscala(valores: number[]): EscalaCoropletica {
  const maximo = Math.max(0, ...valores);
  if (maximo === 0) {
    return { rangos: [], colorDe: () => COLOR_SIN_ANIMALES };
  }
  const clases = Math.min(5, maximo);
  const paso = Math.ceil(maximo / clases);
  const tonos = tonosPara(clases);
  const rangos: RangoEscala[] = [];
  for (let i = 0; i < clases; i += 1) {
    const desde = i * paso + 1;
    const hasta = i === clases - 1 ? maximo : Math.min((i + 1) * paso, maximo);
    if (desde > maximo) {
      break;
    }
    rangos.push({
      desde,
      hasta,
      color: tonos[i],
      etiqueta: etiquetaDe(desde, hasta, i === clases - 1, clases > 1),
    });
  }
  return {
    rangos,
    colorDe: (valor) => {
      if (valor <= 0) {
        return COLOR_SIN_ANIMALES;
      }
      return (
        rangos.find((rango) => valor >= rango.desde && valor <= rango.hasta) ??
        rangos[rangos.length - 1]
      ).color;
    },
  };
}
