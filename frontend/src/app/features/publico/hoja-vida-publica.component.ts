import { DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { resolverUrlMedia } from '../../core/media/resolver-url-media.lib';
import { HojaVidaPublica } from '../../core/models/publico.model';
import { PublicoService } from '../../core/publico/publico.service';
import { etiquetaSalud } from './etiqueta-salud.lib';

@Component({
  selector: 'app-hoja-vida-publica',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './hoja-vida-publica.component.html',
  styleUrl: './hoja-vida-publica.component.scss',
})
export class HojaVidaPublicaComponent implements OnInit {
  hoja = signal<HojaVidaPublica | null>(null);
  cargando = signal(true);
  noDisponible = signal(false);

  readonly etiquetaSalud = etiquetaSalud;

  constructor(
    private readonly ruta: ActivatedRoute,
    private readonly publicoService: PublicoService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.ruta.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.noDisponible.set(true);
      this.cargando.set(false);
      return;
    }

    this.publicoService.obtenerHojaVida(id).subscribe({
      next: (hoja) => {
        this.hoja.set(hoja);
        this.cargando.set(false);
      },
      error: () => {
        this.noDisponible.set(true);
        this.cargando.set(false);
      },
    });
  }

  urlFoto(ruta: string | null): string | null {
    return resolverUrlMedia(ruta);
  }
}
