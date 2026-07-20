import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Comunidad } from '../models/comunidad.model';

@Injectable({ providedIn: 'root' })
export class ComunidadesService {
  constructor(private readonly http: HttpClient) {}

  listar(): Observable<Comunidad[]> {
    return this.http.get<Comunidad[]>(`${environment.apiBaseUrl}/comunidades`);
  }
}
