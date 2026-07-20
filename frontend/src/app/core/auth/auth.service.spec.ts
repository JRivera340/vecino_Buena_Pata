import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('no esta autenticado sin sesion guardada', () => {
    expect(service.estaAutenticado()).toBe(false);
    expect(service.obtenerToken()).toBeNull();
  });

  it('guarda la sesion tras un login exitoso', () => {
    service.iniciarSesion('dr.rojas', 'vbp2026').subscribe();

    const peticion = httpMock.expectOne(`${environment.apiBaseUrl}/auth/login`);
    expect(peticion.request.method).toBe('POST');
    peticion.flush({ access_token: 'token-falso', token_type: 'bearer', rol: 'VETERINARIO', nombre: 'Dr. Rojas' });

    expect(service.estaAutenticado()).toBe(true);
    expect(service.obtenerToken()).toBe('token-falso');
  });

  it('cierra sesion y limpia el almacenamiento', () => {
    service.iniciarSesion('dr.rojas', 'vbp2026').subscribe();
    httpMock.expectOne(`${environment.apiBaseUrl}/auth/login`).flush({
      access_token: 'token-falso',
      token_type: 'bearer',
      rol: 'VETERINARIO',
      nombre: 'Dr. Rojas',
    });

    service.cerrarSesion();

    expect(service.estaAutenticado()).toBe(false);
    expect(localStorage.getItem('vbp_sesion')).toBeNull();
  });
});
