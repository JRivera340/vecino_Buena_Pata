import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Animal } from '../models/animal.model';
import { CausalSalida, EstadoSalud } from '../models/enums';
import { Visita } from '../models/visita.model';

export interface VisitaCrear {
  estado_salud: EstadoSalud;
  estado_comportamiento: string;
  peso_kg: number | null;
  foto: string | null;
  observaciones: string | null;
}

export interface SalidaCrear {
  causal: CausalSalida;
  fecha: string;
  notas: string | null;
}

export interface ReactivacionCrear {
  estado_salud: EstadoSalud;
  estado_comportamiento: string;
}

@Injectable({ providedIn: 'root' })
export class SeguimientoService {
  constructor(private readonly http: HttpClient) {}

  crearVisita(animalId: number, datos: VisitaCrear): Observable<Visita> {
    return this.http.post<Visita>(`${environment.apiBaseUrl}/animales/${animalId}/visitas`, datos);
  }

  registrarSalida(animalId: number, datos: SalidaCrear): Observable<Animal> {
    return this.http.post<Animal>(`${environment.apiBaseUrl}/animales/${animalId}/salida`, datos);
  }

  reactivar(animalId: number, datos: ReactivacionCrear): Observable<Animal> {
    return this.http.post<Animal>(`${environment.apiBaseUrl}/animales/${animalId}/reactivacion`, datos);
  }
}
