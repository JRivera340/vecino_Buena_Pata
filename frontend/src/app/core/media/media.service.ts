import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface MediaSubidaRespuesta {
  ruta: string;
}

@Injectable({ providedIn: 'root' })
export class MediaService {
  constructor(private readonly http: HttpClient) {}

  subir(archivo: File): Observable<MediaSubidaRespuesta> {
    const formulario = new FormData();
    formulario.append('archivo', archivo);
    return this.http.post<MediaSubidaRespuesta>(`${environment.apiBaseUrl}/media`, formulario);
  }
}
