import type {
  ComunidadPublica,
  DocumentoConsulta,
  InscripcionPublicaRespuesta,
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

export const inscribirComoPublico = (formulario: FormData) =>
  solicitar<InscripcionPublicaRespuesta>('/publico/inscripciones', {
    metodo: 'POST',
    cuerpo: formulario,
  });
