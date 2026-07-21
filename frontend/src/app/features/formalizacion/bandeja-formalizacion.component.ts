import { Component, OnInit, computed, signal } from '@angular/core';

import { AnimalesService } from '../../core/animales/animales.service';
import { FormalizacionService } from '../../core/formalizacion/formalizacion.service';
import { Animal } from '../../core/models/animal.model';
import { EstadoAnimal } from '../../core/models/enums';

const ESTADOS_FORMALIZABLES: EstadoAnimal[] = ['CANDIDATO', 'EN_PROCESO'];

@Component({
  selector: 'app-bandeja-formalizacion',
  standalone: true,
  templateUrl: './bandeja-formalizacion.component.html',
  styleUrl: './bandeja-formalizacion.component.scss',
})
export class BandejaFormalizacionComponent implements OnInit {
  animales = signal<Animal[]>([]);
  cargando = signal(true);
  enviandoId = signal<number | null>(null);
  mensaje = signal<string | null>(null);
  codigoCollarGenerado = signal<string | null>(null);
  urlQr = signal<string | null>(null);

  animalesListos = computed(() => this.animales().filter((animal) => ESTADOS_FORMALIZABLES.includes(animal.estado)));

  constructor(
    private readonly animalesService: AnimalesService,
    private readonly formalizacionService: FormalizacionService,
  ) {}

  ngOnInit(): void {
    this.cargarAnimales();
  }

  private cargarAnimales(): void {
    this.animalesService.listar().subscribe({
      next: (animales) => {
        this.animales.set(animales);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  formalizar(animal: Animal): void {
    this.mensaje.set(null);
    this.codigoCollarGenerado.set(null);
    this.urlQr.set(null);
    this.enviandoId.set(animal.id);

    this.formalizacionService.crear(animal.id).subscribe({
      next: (respuesta) => {
        this.enviandoId.set(null);
        this.mensaje.set(`${animal.nombre} ahora es Vecino Buena Pata.`);
        this.codigoCollarGenerado.set(respuesta.codigo_collar);
        this.formalizacionService.descargarQr(animal.id).subscribe((blob) => {
          this.urlQr.set(URL.createObjectURL(blob));
        });
        this.cargarAnimales();
      },
      error: (error) => {
        this.enviandoId.set(null);
        const detalle = error?.error?.detail ?? 'No se pudo formalizar. Revisa que cumpla los criterios.';
        this.mensaje.set(detalle);
      },
    });
  }
}
