import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { EncabezadoComponent } from './shared/encabezado/encabezado.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, EncabezadoComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
