import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { AnimalesService } from '../../core/animales/animales.service';
import { resolverUrlMedia } from '../../core/media/resolver-url-media.lib';
import { Animal } from '../../core/models/animal.model';
import { EventoHistorial } from '../../core/models/historial.model';
import { Validacion } from '../../core/models/validacion.model';
import { Visita } from '../../core/models/visita.model';
import { estadoVisual } from '../../shared/estado-visual/estado-visual.lib';

@Component({
  selector: 'app-hoja-vida',
  standalone: true,
  templateUrl: './hoja-vida.component.html',
  styleUrl: './hoja-vida.component.scss',
})
export class HojaVidaComponent implements OnInit {
  animal = signal<Animal | null>(null);
  historial = signal<EventoHistorial[]>([]);
  visitas = signal<Visita[]>([]);
  validaciones = signal<Validacion[]>([]);
  cargando = signal(true);

  constructor(
    private readonly ruta: ActivatedRoute,
    private readonly animalesService: AnimalesService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.ruta.snapshot.paramMap.get('id'));

    this.animalesService.obtener(id).subscribe({
      next: (animal) => {
        this.animal.set(animal);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
    this.animalesService.obtenerHistorial(id).subscribe((historial) => this.historial.set(historial));
    this.animalesService.obtenerVisitas(id).subscribe((visitas) => this.visitas.set(visitas));
    this.animalesService.obtenerValidaciones(id).subscribe((validaciones) => this.validaciones.set(validaciones));
  }

  estadoVisualDe(animal: Animal) {
    return estadoVisual(animal.estado);
  }

  urlFoto(ruta: string | null): string | null {
    return resolverUrlMedia(ruta);
  }
}
