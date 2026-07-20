import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { VeredictoValidacion } from '../models/enums';

export interface ValidacionCrear {
  veredicto: VeredictoValidacion;
  pendientes: string[];
  observaciones: string | null;
  esterilizado: boolean | null;
  numero_microchip: string | null;
}

@Injectable({ providedIn: 'root' })
export class ValidacionesService {
  constructor(private readonly http: HttpClient) {}

  crear(animalId: number, datos: ValidacionCrear): Observable<unknown> {
    return this.http.post(`${environment.apiBaseUrl}/animales/${animalId}/validaciones`, datos);
  }
}
