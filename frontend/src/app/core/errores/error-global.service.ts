import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ErrorGlobalService {
  private readonly mensajeSignal = signal<string | null>(null);

  readonly mensaje = this.mensajeSignal.asReadonly();

  mostrar(mensaje: string): void {
    this.mensajeSignal.set(mensaje);
  }

  limpiar(): void {
    this.mensajeSignal.set(null);
  }
}
