import { Component } from '@angular/core';

import { ErrorGlobalService } from '../../core/errores/error-global.service';

@Component({
  selector: 'app-banner-error',
  standalone: true,
  templateUrl: './banner-error.component.html',
  styleUrl: './banner-error.component.scss',
})
export class BannerErrorComponent {
  constructor(public readonly errorGlobal: ErrorGlobalService) {}

  cerrar(): void {
    this.errorGlobal.limpiar();
  }
}
