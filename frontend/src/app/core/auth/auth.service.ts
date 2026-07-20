import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { TokenRespuesta } from '../models/auth.model';

const CLAVE_SESION = 'vbp_sesion';

interface SesionGuardada {
  token: string;
  rol: string;
  nombre: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sesion = signal<SesionGuardada | null>(this.cargarSesion());

  readonly sesionActual = this.sesion.asReadonly();

  constructor(private readonly http: HttpClient) {}

  private cargarSesion(): SesionGuardada | null {
    const guardada = localStorage.getItem(CLAVE_SESION);
    return guardada ? JSON.parse(guardada) : null;
  }

  iniciarSesion(username: string, password: string): Observable<TokenRespuesta> {
    const cuerpo = new URLSearchParams();
    cuerpo.set('username', username);
    cuerpo.set('password', password);

    return this.http
      .post<TokenRespuesta>(`${environment.apiBaseUrl}/auth/login`, cuerpo.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      .pipe(
        tap((respuesta) => {
          const sesion: SesionGuardada = {
            token: respuesta.access_token,
            rol: respuesta.rol,
            nombre: respuesta.nombre,
          };
          localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
          this.sesion.set(sesion);
        }),
      );
  }

  cerrarSesion(): void {
    localStorage.removeItem(CLAVE_SESION);
    this.sesion.set(null);
  }

  obtenerToken(): string | null {
    return this.sesion()?.token ?? null;
  }

  estaAutenticado(): boolean {
    return this.sesion() !== null;
  }
}
