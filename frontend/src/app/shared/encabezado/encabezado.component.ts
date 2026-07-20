import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-encabezado',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './encabezado.component.html',
  styleUrl: './encabezado.component.scss',
})
export class EncabezadoComponent {
  constructor(
    public readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  salir(): void {
    this.auth.cerrarSesion();
    this.router.navigate(['/ingreso']);
  }
}
