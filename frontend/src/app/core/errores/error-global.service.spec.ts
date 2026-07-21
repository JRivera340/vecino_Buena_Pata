import { TestBed } from '@angular/core/testing';

import { ErrorGlobalService } from './error-global.service';

describe('ErrorGlobalService', () => {
  let service: ErrorGlobalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ErrorGlobalService);
  });

  it('no tiene mensaje al iniciar', () => {
    expect(service.mensaje()).toBeNull();
  });

  it('guarda el mensaje mostrado', () => {
    service.mostrar('No se pudo conectar con el servidor.');
    expect(service.mensaje()).toBe('No se pudo conectar con el servidor.');
  });

  it('limpia el mensaje', () => {
    service.mostrar('Error');
    service.limpiar();
    expect(service.mensaje()).toBeNull();
  });
});
