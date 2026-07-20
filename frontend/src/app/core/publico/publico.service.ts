import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface AnimalPublico {
  id: number;
  nombre: string;
  especie: string;
  sexo: string;
  tamano: string;
  descripcion: string | null;
  foto_principal: string | null;
  estado: string;
  barrio: string;
  latitud: number;
  longitud: number;
  fecha_inscripcion: string;
}

export interface ReporteNovedadCrear {
  reportante_nombre: string;
  descripcion: string;
  foto: string | null;
  latitud: number | null;
  longitud: number | null;
}

export interface ReporteNovedadRespuesta {
  id: number;
  animal_id: number;
  fecha: string;
  estado: string;
}

@Injectable({ providedIn: 'root' })
export class PublicoService {
  constructor(private readonly http: HttpClient) {}

  obtenerAnimal(codigo: string): Observable<AnimalPublico> {
    return this.http.get<AnimalPublico>(`${environment.apiBaseUrl}/publico/animales/${codigo}`);
  }

  crearReporte(codigo: string, datos: ReporteNovedadCrear): Observable<ReporteNovedadRespuesta> {
    return this.http.post<ReporteNovedadRespuesta>(
      `${environment.apiBaseUrl}/publico/animales/${codigo}/reportes`,
      datos,
    );
  }
}
