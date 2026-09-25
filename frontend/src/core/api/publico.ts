import type {
  AnimalMapaPublico,
  AnimalPublico,
  HojaVidaPublica,
  ReporteNovedadCrear,
  ReporteNovedadRespuesta,
} from '@/core/modelos/publico';
import { solicitar } from './cliente';

export const listarMapa = () => solicitar<AnimalMapaPublico[]>('/publico/mapa');

export const obtenerHojaVida = (id: number) =>
  solicitar<HojaVidaPublica>(`/publico/animales/${id}/hoja-vida`);

export const obtenerAnimalPorCodigo = (codigo: string) =>
  solicitar<AnimalPublico>(`/publico/animales/${encodeURIComponent(codigo)}`);

export const crearReportePublico = (codigo: string, datos: ReporteNovedadCrear) =>
  solicitar<ReporteNovedadRespuesta>(`/publico/animales/${encodeURIComponent(codigo)}/reportes`, {
    metodo: 'POST',
    cuerpo: { ...datos },
  });
