import type {
  ComunidadPublica,
  DocumentoConsulta,
  VerificarInscriptorRespuesta,
} from '@/core/modelos/inscripcion';
import { solicitar } from './cliente';

export const listarComunidadesPublicas = () =>
  solicitar<ComunidadPublica[]>('/publico/comunidades');

export const verificarInscriptor = (datos: DocumentoConsulta) =>
  solicitar<VerificarInscriptorRespuesta>('/publico/inscriptores/verificar', {
    metodo: 'POST',
    cuerpo: { ...datos },
  });
