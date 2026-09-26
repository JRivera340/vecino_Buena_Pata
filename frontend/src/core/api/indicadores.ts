import type { IndicadoresLocalidades } from '@/core/modelos/indicadores';
import { solicitar } from './cliente';

export const obtenerIndicadoresPorLocalidad = (parametros: URLSearchParams) => {
  const consulta = parametros.toString();
  return solicitar<IndicadoresLocalidades>(
    `/indicadores/localidades${consulta ? `?${consulta}` : ''}`,
  );
};
