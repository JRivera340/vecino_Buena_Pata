import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Animal, AnimalCrear } from '../models/animal.model';
import { EventoHistorial } from '../models/historial.model';
import { Validacion } from '../models/validacion.model';
import { Visita } from '../models/visita.model';

@Injectable({ providedIn: 'root' })
export class AnimalesService {
  constructor(private readonly http: HttpClient) {}

  listar(): Observable<Animal[]> {
    return this.http.get<Animal[]>(`${environment.apiBaseUrl}/animales`);
  }

  obtener(id: number): Observable<Animal> {
    return this.http.get<Animal>(`${environment.apiBaseUrl}/animales/${id}`);
  }

  crear(datos: AnimalCrear): Observable<Animal> {
    return this.http.post<Animal>(`${environment.apiBaseUrl}/animales`, datos);
  }

  obtenerHistorial(id: number): Observable<EventoHistorial[]> {
    return this.http.get<EventoHistorial[]>(`${environment.apiBaseUrl}/animales/${id}/historial`);
  }

  obtenerVisitas(id: number): Observable<Visita[]> {
    return this.http.get<Visita[]>(`${environment.apiBaseUrl}/animales/${id}/visitas`);
  }

  obtenerValidaciones(id: number): Observable<Validacion[]> {
    return this.http.get<Validacion[]>(`${environment.apiBaseUrl}/animales/${id}/validaciones`);
  }
}
