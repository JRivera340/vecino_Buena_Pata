import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface FormalizacionRespuesta {
  animal_id: number;
  estado: string;
  codigo_collar: string;
}

@Injectable({ providedIn: 'root' })
export class FormalizacionService {
  constructor(private readonly http: HttpClient) {}

  crear(animalId: number): Observable<FormalizacionRespuesta> {
    return this.http.post<FormalizacionRespuesta>(`${environment.apiBaseUrl}/animales/${animalId}/formalizacion`, {});
  }

  descargarQr(animalId: number): Observable<Blob> {
    return this.http.get(`${environment.apiBaseUrl}/animales/${animalId}/collar/qr.png`, { responseType: 'blob' });
  }
}
