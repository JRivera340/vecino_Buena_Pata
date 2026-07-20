import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Animal } from '../models/animal.model';

@Injectable({ providedIn: 'root' })
export class AnimalesService {
  constructor(private readonly http: HttpClient) {}

  listar(): Observable<Animal[]> {
    return this.http.get<Animal[]>(`${environment.apiBaseUrl}/animales`);
  }
}
