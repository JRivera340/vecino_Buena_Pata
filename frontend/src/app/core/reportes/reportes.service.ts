import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { EstadoReporte } from '../models/enums';

export interface Reporte {
  id: number;
  animal_id: number;
  fecha: string;
  reportante_nombre: string;
  comunidad_id: number | null;
  descripcion: string;
  foto: string | null;
  latitud: number | null;
  longitud: number | null;
  estado: EstadoReporte;
}

export interface AtencionCrear {
  acciones_realizadas: string;
  resultado: string;
}

export interface Atencion {
  id: number;
  reporte_id: number;
  fecha: string;
  responsable: string;
  acciones_realizadas: string;
  resultado: string;
}

@Injectable({ providedIn: 'root' })
export class ReportesService {
  constructor(private readonly http: HttpClient) {}

  listar(): Observable<Reporte[]> {
    return this.http.get<Reporte[]>(`${environment.apiBaseUrl}/reportes`);
  }

  registrarAtencion(reporteId: number, datos: AtencionCrear): Observable<Atencion> {
    return this.http.post<Atencion>(`${environment.apiBaseUrl}/reportes/${reporteId}/atencion`, datos);
  }
}
