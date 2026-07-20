import { Animal } from '../../core/models/animal.model';
import { EstadoAnimal } from '../../core/models/enums';
import { Reporte } from '../../core/reportes/reportes.service';

export interface ConteoEstado {
  estado: EstadoAnimal;
  cantidad: number;
}

export interface Indicadores {
  totalAnimales: number;
  totalVbpActivos: number;
  totalReportesAbiertos: number;
  conteoPorEstado: ConteoEstado[];
}

const ORDEN_ESTADOS: EstadoAnimal[] = ['CANDIDATO', 'EN_PROCESO', 'VBP_ACTIVO', 'ADOPTADO', 'PERDIDO', 'FALLECIDO'];

export function calcularIndicadores(animales: Animal[], reportes: Reporte[]): Indicadores {
  const conteoPorEstado: ConteoEstado[] = ORDEN_ESTADOS.map((estado) => ({
    estado,
    cantidad: animales.filter((animal) => animal.estado === estado).length,
  }));

  return {
    totalAnimales: animales.length,
    totalVbpActivos: animales.filter((animal) => animal.estado === 'VBP_ACTIVO').length,
    totalReportesAbiertos: reportes.filter((reporte) => reporte.estado !== 'CERRADO').length,
    conteoPorEstado,
  };
}
