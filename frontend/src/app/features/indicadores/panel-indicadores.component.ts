import { Component, OnInit, computed, signal } from '@angular/core';

import { AnimalesService } from '../../core/animales/animales.service';
import { Animal } from '../../core/models/animal.model';
import { EstadoAnimal } from '../../core/models/enums';
import { Reporte, ReportesService } from '../../core/reportes/reportes.service';
import { estadoVisual } from '../../shared/estado-visual/estado-visual.lib';
import { calcularIndicadores } from './calcular-indicadores.lib';

@Component({
  selector: 'app-panel-indicadores',
  standalone: true,
  templateUrl: './panel-indicadores.component.html',
  styleUrl: './panel-indicadores.component.scss',
})
export class PanelIndicadoresComponent implements OnInit {
  animales = signal<Animal[]>([]);
  reportes = signal<Reporte[]>([]);
  cargando = signal(true);

  indicadores = computed(() => calcularIndicadores(this.animales(), this.reportes()));

  maximoConteo = computed(() => Math.max(1, ...this.indicadores().conteoPorEstado.map((c) => c.cantidad)));

  constructor(
    private readonly animalesService: AnimalesService,
    private readonly reportesService: ReportesService,
  ) {}

  ngOnInit(): void {
    this.animalesService.listar().subscribe({
      next: (animales) => {
        this.animales.set(animales);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
    this.reportesService.listar().subscribe((reportes) => this.reportes.set(reportes));
  }

  colorDe(estado: EstadoAnimal): string {
    return estadoVisual(estado).color;
  }

  etiquetaDe(estado: EstadoAnimal): string {
    return estadoVisual(estado).etiqueta;
  }

  anchoBarra(cantidad: number): number {
    return (cantidad / this.maximoConteo()) * 100;
  }
}
