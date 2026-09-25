// En producción, el Dockerfile reemplaza estos marcadores con las URLs reales del servicio.
const enDesarrollo = import.meta.env.DEV;

export const entorno = {
  apiBaseUrl: enDesarrollo ? 'http://localhost:8000/api/v1' : '__API_BASE_URL__',
  mediaBaseUrl: enDesarrollo ? 'http://localhost:8000/media' : '__MEDIA_BASE_URL__',
};
