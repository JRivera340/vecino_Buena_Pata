import { CLAVE_SESION, useSesion } from './sesion.store';

const SESION = { token: 'token-falso', rol: 'VETERINARIO', nombre: 'Dr. Rojas' } as const;

describe('useSesion', () => {
  beforeEach(() => {
    localStorage.clear();
    useSesion.getState().cerrar();
  });

  it('no hay sesión al iniciar', () => {
    expect(useSesion.getState().sesion).toBeNull();
  });

  it('guarda la sesión en el estado y en el almacenamiento', () => {
    useSesion.getState().iniciar({ ...SESION });

    expect(useSesion.getState().sesion?.token).toBe('token-falso');
    expect(JSON.parse(localStorage.getItem(CLAVE_SESION) ?? '{}').rol).toBe('VETERINARIO');
  });

  it('cierra la sesión y limpia el almacenamiento', () => {
    useSesion.getState().iniciar({ ...SESION });

    useSesion.getState().cerrar();

    expect(useSesion.getState().sesion).toBeNull();
    expect(localStorage.getItem(CLAVE_SESION)).toBeNull();
  });
});
