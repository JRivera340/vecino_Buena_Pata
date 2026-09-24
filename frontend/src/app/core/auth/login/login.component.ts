import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  username = signal('');
  password = signal('');
  error = signal<string | null>(null);
  cargando = signal(false);

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  ingresar(): void {
    this.error.set(null);
    this.cargando.set(true);
    this.auth.iniciarSesion(this.username(), this.password()).subscribe({
      next: () => {
        this.cargando.set(false);
        this.router.navigate(['/mapa']);
      },
      error: () => {
        this.cargando.set(false);
        this.error.set('Usuario o contrasena incorrectos.');
      },
    });
  }
}
