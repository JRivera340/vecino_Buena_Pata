import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { EncabezadoComponent } from './shared/encabezado/encabezado.component';
import { BannerErrorComponent } from './shared/banner-error/banner-error.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, EncabezadoComponent, BannerErrorComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
