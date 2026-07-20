import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AnimalesService } from '../../core/animales/animales.service';
import { Animal } from '../../core/models/animal.model';
import { EstadoAnimal, VeredictoValidacion } from '../../core/models/enums';
import { ValidacionCrear, ValidacionesService } from '../../core/validaciones/validaciones.service';

const ESTADOS_PENDIENTES_DE_VALIDACION: EstadoAnimal[] = ['CANDIDATO', 'EN_PROCESO'];
const OPCIONES_PENDIENTES = ['SIN_CHIP', 'SIN_ESTERILIZAR', 'COMPORTAMIENTO', 'SALUD'] as const;

@Component({
  selector: 'app-bandeja-validacion',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './bandeja-validacion.component.html',
  styleUrl: './bandeja-validacion.component.scss',
})
export class BandejaValidacionComponent implements OnInit {
  animales = signal<Animal[]>([]);
  animalSeleccionadoId = signal<number | null>(null);

  veredicto = signal<VeredictoValidacion>('APROBADO');
  pendientesSeleccionados = signal<string[]>([]);
  observaciones = signal('');
  esterilizado = signal(false);
  numeroMicrochip = signal('');

  enviando = signal(false);
  mensaje = signal<string | null>(null);

  readonly opcionesPendientes = OPCIONES_PENDIENTES;

  animalesPendientes = computed(() =>
    this.animales().filter((animal) => ESTADOS_PENDIENTES_DE_VALIDACION.includes(animal.estado)),
  );

  animalSeleccionado = computed(
    () => this.animalesPendientes().find((animal) => animal.id === this.animalSeleccionadoId()) ?? null,
  );

  constructor(
    private readonly animalesService: AnimalesService,
    private readonly validacionesService: ValidacionesService,
  ) {}

  ngOnInit(): void {
    this.cargarAnimales();
  }

  private cargarAnimales(): void {
    this.animalesService.listar().subscribe((animales) => this.animales.set(animales));
  }

  seleccionarAnimal(id: number): void {
    this.animalSeleccionadoId.set(id);
    this.veredicto.set('APROBADO');
    this.pendientesSeleccionados.set([]);
    this.observaciones.set('');
    this.esterilizado.set(false);
    this.numeroMicrochip.set('');
    this.mensaje.set(null);
  }

  alternarPendiente(pendiente: string): void {
    const actuales = this.pendientesSeleccionados();
    this.pendientesSeleccionados.set(
      actuales.includes(pendiente) ? actuales.filter((p) => p !== pendiente) : [...actuales, pendiente],
    );
  }

  registrarValidacion(): void {
    const animal = this.animalSeleccionado();
    if (!animal) {
      return;
    }

    const datos: ValidacionCrear = {
      veredicto: this.veredicto(),
      pendientes: this.veredicto() === 'CON_PENDIENTES' ? this.pendientesSeleccionados() : [],
      observaciones: this.observaciones() || null,
      esterilizado: this.esterilizado() || null,
      numero_microchip: this.numeroMicrochip() || null,
    };

    this.enviando.set(true);
    this.validacionesService.crear(animal.id, datos).subscribe({
      next: () => {
        this.enviando.set(false);
        this.mensaje.set('Validacion registrada.');
        this.animalSeleccionadoId.set(null);
        this.cargarAnimales();
      },
      error: () => {
        this.enviando.set(false);
        this.mensaje.set('No se pudo registrar la validacion.');
      },
    });
  }
}
