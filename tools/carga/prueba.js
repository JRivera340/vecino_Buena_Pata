import http from 'k6/http';
import { check, sleep } from 'k6';

const API = __ENV.API_URL || 'http://localhost:8000/api/v1';
const PAUSA = Number(__ENV.PAUSA_SEGUNDOS || 8);
const MAXIMO = Number(__ENV.USUARIOS_MAXIMOS || 300);

export const options = {
  scenarios: {
    publico: {
      executor: 'ramping-vus',
      exec: 'navegacionPublica',
      startVUs: 0,
      stages: [
        { duration: '1m', target: Math.round(MAXIMO * 0.25) },
        { duration: '2m', target: Math.round(MAXIMO * 0.5) },
        { duration: '2m', target: Math.round(MAXIMO * 0.75) },
        { duration: '2m', target: MAXIMO },
        { duration: '1m', target: 0 },
      ],
    },
    personal: {
      executor: 'constant-vus',
      exec: 'lecturasAutenticadas',
      vus: Math.max(1, Math.round(MAXIMO * 0.05)),
      duration: '8m',
    },
  },
  thresholds: {
    http_req_failed: [{ threshold: 'rate<0.01', abortOnFail: true, delayAbortEval: '30s' }],
    http_req_duration: [{ threshold: 'p(95)<1500', abortOnFail: true, delayAbortEval: '30s' }],
  },
};

export function setup() {
  const mapa = http.get(`${API}/publico/mapa`);
  const ids = mapa.status === 200 ? mapa.json().map((animal) => animal.id) : [];
  return { ids };
}

export function navegacionPublica(datos) {
  const mapa = http.get(`${API}/publico/mapa`);
  check(mapa, { 'mapa responde 200': (r) => r.status === 200 });
  sleep(PAUSA);

  if (datos.ids.length > 0) {
    const id = datos.ids[Math.floor(Math.random() * datos.ids.length)];
    const ficha = http.get(`${API}/publico/animales/${id}/hoja-vida`);
    check(ficha, { 'ficha responde 200': (r) => r.status === 200 });
    sleep(PAUSA);
  }
}

export function lecturasAutenticadas() {
  const ingreso = http.post(`${API}/auth/login`, { username: __ENV.USUARIO || 'admin', password: __ENV.CLAVE || 'vbp2026' });
  if (!check(ingreso, { 'ingreso responde 200': (r) => r.status === 200 })) {
    sleep(PAUSA);
    return;
  }
  const cabeceras = { headers: { Authorization: `Bearer ${ingreso.json().access_token}` } };
  for (const ruta of ['/animales', '/reportes', '/comunidades']) {
    check(http.get(`${API}${ruta}`, cabeceras), { 'lectura responde 200': (r) => r.status === 200 });
    sleep(PAUSA);
  }
}
