import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { PublicoService } from './publico.service';

describe('PublicoService', () => {
  let service: PublicoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PublicoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('lista el mapa con GET a /publico/mapa', () => {
    service.listarMapa().subscribe();

    const peticion = httpMock.expectOne(`${environment.apiBaseUrl}/publico/mapa`);
    expect(peticion.request.method).toBe('GET');
    peticion.flush([]);
  });

  it('consulta la hoja de vida con GET a /publico/animales/:id/hoja-vida', () => {
    service.obtenerHojaVida(7).subscribe();

    const peticion = httpMock.expectOne(`${environment.apiBaseUrl}/publico/animales/7/hoja-vida`);
    expect(peticion.request.method).toBe('GET');
    peticion.flush({});
  });
});
