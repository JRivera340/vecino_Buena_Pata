import { HttpErrorResponse } from '@angular/common/http';

import { esErrorDeServidor } from './es-error-de-servidor.lib';

describe('esErrorDeServidor', () => {
  it('es true para error de red (status 0)', () => {
    expect(esErrorDeServidor(new HttpErrorResponse({ status: 0 }))).toBe(true);
  });

  it('es true para error 500', () => {
    expect(esErrorDeServidor(new HttpErrorResponse({ status: 500 }))).toBe(true);
  });

  it('es true para error 503', () => {
    expect(esErrorDeServidor(new HttpErrorResponse({ status: 503 }))).toBe(true);
  });

  it('es false para error 404', () => {
    expect(esErrorDeServidor(new HttpErrorResponse({ status: 404 }))).toBe(false);
  });

  it('es false para error 409 (conflicto de negocio)', () => {
    expect(esErrorDeServidor(new HttpErrorResponse({ status: 409 }))).toBe(false);
  });

  it('es false para error 401', () => {
    expect(esErrorDeServidor(new HttpErrorResponse({ status: 401 }))).toBe(false);
  });
});
