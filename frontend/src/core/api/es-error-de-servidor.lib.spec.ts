import { esErrorDeServidor } from './es-error-de-servidor.lib';

describe('esErrorDeServidor', () => {
  it('es true para error de red (estado 0)', () => {
    expect(esErrorDeServidor(0)).toBe(true);
  });

  it('es true para error 500', () => {
    expect(esErrorDeServidor(500)).toBe(true);
  });

  it('es true para error 503', () => {
    expect(esErrorDeServidor(503)).toBe(true);
  });

  it('es false para error 404', () => {
    expect(esErrorDeServidor(404)).toBe(false);
  });

  it('es false para error 409 (conflicto de negocio)', () => {
    expect(esErrorDeServidor(409)).toBe(false);
  });

  it('es false para error 401', () => {
    expect(esErrorDeServidor(401)).toBe(false);
  });
});
