import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../core/auth/auth.service';
import { AtencionCrear, Reporte, ReportesService } from '../../core/reportes/reportes.service';

@Component({
  selector: 'app-bandeja-reportes',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './bandeja-reportes.component.html',
  styleUrl: './bandeja-reportes.component.scss',
})
export class BandejaReportesComponent implements OnInit {
  reportes = signal<Reporte[]>([]);
  reporteSeleccionadoId = signal<number | null>(null);
  accionesRealizadas = signal('');
  resultado = signal('');
  enviando = signal(false);
  mensaje = signal<string | null>(null);

  reportesAbiertos = computed(() => this.reportes().filter((reporte) => reporte.estado !== 'CERRADO'));

  reporteSeleccionado = computed(
    () => this.reportesAbiertos().find((reporte) => reporte.id === this.reporteSeleccionadoId()) ?? null,
  );

  constructor(
    private readonly reportesService: ReportesService,
    public readonly auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.cargarReportes();
  }

  private cargarReportes(): void {
    this.reportesService.listar().subscribe((reportes) => this.reportes.set(reportes));
  }

  puedeAtender(): boolean {
    const rol = this.auth.sesionActual()?.rol;
    return rol === 'UNIDAD_ESPECIAL' || rol === 'ADMIN';
  }

  seleccionarReporte(id: number): void {
    this.reporteSeleccionadoId.set(id);
    this.accionesRealizadas.set('');
    this.resultado.set('');
    this.mensaje.set(null);
  }

  registrarAtencion(): void {
    const reporte = this.reporteSeleccionado();
    if (!reporte) {
      return;
    }

    const datos: AtencionCrear = {
      acciones_realizadas: this.accionesRealizadas(),
      resultado: this.resultado(),
    };

    this.enviando.set(true);
    this.reportesService.registrarAtencion(reporte.id, datos).subscribe({
      next: () => {
        this.enviando.set(false);
        this.mensaje.set('Atencion registrada. Reporte cerrado.');
        this.reporteSeleccionadoId.set(null);
        this.cargarReportes();
      },
      error: (error) => {
        this.enviando.set(false);
        this.mensaje.set(error?.error?.detail ?? 'No se pudo registrar la atencion.');
      },
    });
  }
}
