import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { SeguimientoService } from './seguimiento.service';
import { environment } from '../../../environments/environment';

describe('SeguimientoService', () => {
  let service: SeguimientoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SeguimientoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('registra una visita con POST a /animales/:id/visitas', () => {
    service
      .crearVisita(7, {
        estado_salud: 'BUENO',
        estado_comportamiento: 'Tranquilo',
        peso_kg: 15,
        foto: null,
        observaciones: null,
      })
      .subscribe();

    const peticion = httpMock.expectOne(`${environment.apiBaseUrl}/animales/7/visitas`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body.estado_salud).toBe('BUENO');
    peticion.flush({
      id: 1,
      animal_id: 7,
      fecha: '2026-07-20T10:00:00Z',
      responsable: 'dr.rojas',
      estado_salud: 'BUENO',
      estado_comportamiento: 'Tranquilo',
      peso_kg: 15,
      foto: null,
      observaciones: null,
    });
  });

  it('registra una salida con POST a /animales/:id/salida', () => {
    service
      .registrarSalida(7, { causal: 'ADOPCION', fecha: '2026-07-20T10:00:00Z', notas: 'Familia del barrio.' })
      .subscribe();

    const peticion = httpMock.expectOne(`${environment.apiBaseUrl}/animales/7/salida`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body.causal).toBe('ADOPCION');
    peticion.flush({ id: 7, estado: 'ADOPTADO' });
  });

  it('reactiva un animal con POST a /animales/:id/reactivacion', () => {
    service.reactivar(7, { estado_salud: 'BUENO', estado_comportamiento: 'Reaparecio' }).subscribe();

    const peticion = httpMock.expectOne(`${environment.apiBaseUrl}/animales/7/reactivacion`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body.estado_comportamiento).toBe('Reaparecio');
    peticion.flush({ id: 7, estado: 'VBP_ACTIVO' });
  });
});
