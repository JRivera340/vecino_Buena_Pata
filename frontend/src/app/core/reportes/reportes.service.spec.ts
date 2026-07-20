import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { ReportesService } from './reportes.service';
import { environment } from '../../../environments/environment';

describe('ReportesService', () => {
  let service: ReportesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReportesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('lista los reportes con GET a /reportes', () => {
    service.listar().subscribe();

    const peticion = httpMock.expectOne(`${environment.apiBaseUrl}/reportes`);
    expect(peticion.request.method).toBe('GET');
    peticion.flush([]);
  });

  it('registra una atencion con POST a /reportes/:id/atencion', () => {
    service.registrarAtencion(3, { acciones_realizadas: 'Visita.', resultado: 'Resuelto.' }).subscribe();

    const peticion = httpMock.expectOne(`${environment.apiBaseUrl}/reportes/3/atencion`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body.resultado).toBe('Resuelto.');
    peticion.flush({
      id: 1,
      reporte_id: 3,
      fecha: '2026-07-20T10:00:00Z',
      responsable: 'unidad.especial',
      acciones_realizadas: 'Visita.',
      resultado: 'Resuelto.',
    });
  });
});
