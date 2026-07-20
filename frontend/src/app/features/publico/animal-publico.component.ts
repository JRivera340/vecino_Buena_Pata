import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { resolverUrlMedia } from '../../core/media/resolver-url-media.lib';
import { AnimalPublico, PublicoService, ReporteNovedadCrear } from '../../core/publico/publico.service';

@Component({
  selector: 'app-animal-publico',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './animal-publico.component.html',
  styleUrl: './animal-publico.component.scss',
})
export class AnimalPublicoComponent implements OnInit {
  animal = signal<AnimalPublico | null>(null);
  cargando = signal(true);
  noEncontrado = signal(false);

  reportanteNombre = signal('');
  descripcionReporte = signal('');
  enviandoReporte = signal(false);
  reporteEnviado = signal(false);
  errorReporte = signal<string | null>(null);

  private codigo = '';

  constructor(
    private readonly ruta: ActivatedRoute,
    private readonly publicoService: PublicoService,
  ) {}

  ngOnInit(): void {
    this.codigo = this.ruta.snapshot.paramMap.get('codigo') ?? '';
    this.publicoService.obtenerAnimal(this.codigo).subscribe({
      next: (animal) => {
        this.animal.set(animal);
        this.cargando.set(false);
      },
      error: () => {
        this.noEncontrado.set(true);
        this.cargando.set(false);
      },
    });
  }

  urlFoto(ruta: string | null): string | null {
    return resolverUrlMedia(ruta);
  }

  enviarReporte(): void {
    if (this.reportanteNombre().trim().length === 0 || this.descripcionReporte().trim().length === 0) {
      this.errorReporte.set('Completa tu nombre y cuentanos que observaste.');
      return;
    }

    const datos: ReporteNovedadCrear = {
      reportante_nombre: this.reportanteNombre(),
      descripcion: this.descripcionReporte(),
      foto: null,
      latitud: null,
      longitud: null,
    };

    this.errorReporte.set(null);
    this.enviandoReporte.set(true);
    this.publicoService.crearReporte(this.codigo, datos).subscribe({
      next: () => {
        this.enviandoReporte.set(false);
        this.reporteEnviado.set(true);
      },
      error: () => {
        this.enviandoReporte.set(false);
        this.errorReporte.set('No se pudo enviar el reporte. Intenta de nuevo.');
      },
    });
  }
}
