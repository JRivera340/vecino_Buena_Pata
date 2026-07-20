import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { AnimalesService } from '../../core/animales/animales.service';
import { AuthService } from '../../core/auth/auth.service';
import { resolverUrlMedia } from '../../core/media/resolver-url-media.lib';
import { Animal } from '../../core/models/animal.model';
import { CausalSalida, EstadoSalud } from '../../core/models/enums';
import { EventoHistorial } from '../../core/models/historial.model';
import { Validacion } from '../../core/models/validacion.model';
import { Visita } from '../../core/models/visita.model';
import { SeguimientoService } from '../../core/seguimiento/seguimiento.service';
import { estadoVisual } from '../../shared/estado-visual/estado-visual.lib';
import {
  puedeReactivar,
  puedeRegistrarSalida,
  puedeRegistrarVisita,
} from '../seguimiento/acciones-seguimiento.lib';

type AccionActiva = 'visita' | 'salida' | 'reactivacion' | null;

@Component({
  selector: 'app-hoja-vida',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './hoja-vida.component.html',
  styleUrl: './hoja-vida.component.scss',
})
export class HojaVidaComponent implements OnInit {
  animal = signal<Animal | null>(null);
  historial = signal<EventoHistorial[]>([]);
  visitas = signal<Visita[]>([]);
  validaciones = signal<Validacion[]>([]);
  cargando = signal(true);

  accionActiva = signal<AccionActiva>(null);
  enviando = signal(false);
  mensajeAccion = signal<string | null>(null);

  estadoSalud = signal<EstadoSalud>('BUENO');
  estadoComportamiento = signal('');
  pesoKg = signal<number | null>(null);
  observacionesVisita = signal('');

  causalSalida = signal<CausalSalida>('ADOPCION');
  fechaSalida = signal(this.hoyIso());
  notasSalida = signal('');

  private animalId = 0;

  constructor(
    private readonly ruta: ActivatedRoute,
    private readonly animalesService: AnimalesService,
    private readonly seguimientoService: SeguimientoService,
    public readonly auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.animalId = Number(this.ruta.snapshot.paramMap.get('id'));
    this.cargarDatos();
  }

  private cargarDatos(): void {
    this.animalesService.obtener(this.animalId).subscribe({
      next: (animal) => {
        this.animal.set(animal);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
    this.animalesService.obtenerHistorial(this.animalId).subscribe((historial) => this.historial.set(historial));
    this.animalesService.obtenerVisitas(this.animalId).subscribe((visitas) => this.visitas.set(visitas));
    this.animalesService
      .obtenerValidaciones(this.animalId)
      .subscribe((validaciones) => this.validaciones.set(validaciones));
  }

  estadoVisualDe(animal: Animal) {
    return estadoVisual(animal.estado);
  }

  urlFoto(ruta: string | null): string | null {
    return resolverUrlMedia(ruta);
  }

  puedeVisitar(animal: Animal): boolean {
    return puedeRegistrarVisita(animal, this.auth.sesionActual()?.rol);
  }

  puedeSalir(animal: Animal): boolean {
    return puedeRegistrarSalida(animal, this.auth.sesionActual()?.rol);
  }

  puedeReactivarAnimal(animal: Animal): boolean {
    return puedeReactivar(animal, this.auth.sesionActual()?.rol);
  }

  mostrarAccion(accion: AccionActiva): void {
    this.accionActiva.set(accion);
    this.mensajeAccion.set(null);
    this.estadoSalud.set('BUENO');
    this.estadoComportamiento.set('');
    this.pesoKg.set(null);
    this.observacionesVisita.set('');
    this.causalSalida.set('ADOPCION');
    this.fechaSalida.set(this.hoyIso());
    this.notasSalida.set('');
  }

  registrarVisita(): void {
    this.enviando.set(true);
    this.seguimientoService
      .crearVisita(this.animalId, {
        estado_salud: this.estadoSalud(),
        estado_comportamiento: this.estadoComportamiento(),
        peso_kg: this.pesoKg(),
        foto: null,
        observaciones: this.observacionesVisita() || null,
      })
      .subscribe({
        next: () => {
          this.enviando.set(false);
          this.accionActiva.set(null);
          this.mensajeAccion.set('Visita registrada.');
          this.cargarDatos();
        },
        error: (error) => {
          this.enviando.set(false);
          this.mensajeAccion.set(error?.error?.detail ?? 'No se pudo registrar la visita.');
        },
      });
  }

  registrarSalida(): void {
    this.enviando.set(true);
    this.seguimientoService
      .registrarSalida(this.animalId, {
        causal: this.causalSalida(),
        fecha: new Date(this.fechaSalida()).toISOString(),
        notas: this.notasSalida() || null,
      })
      .subscribe({
        next: () => {
          this.enviando.set(false);
          this.accionActiva.set(null);
          this.mensajeAccion.set('Salida registrada.');
          this.cargarDatos();
        },
        error: (error) => {
          this.enviando.set(false);
          this.mensajeAccion.set(error?.error?.detail ?? 'No se pudo registrar la salida.');
        },
      });
  }

  reactivarAnimal(): void {
    this.enviando.set(true);
    this.seguimientoService
      .reactivar(this.animalId, {
        estado_salud: this.estadoSalud(),
        estado_comportamiento: this.estadoComportamiento(),
      })
      .subscribe({
        next: () => {
          this.enviando.set(false);
          this.accionActiva.set(null);
          this.mensajeAccion.set('Animal reactivado.');
          this.cargarDatos();
        },
        error: (error) => {
          this.enviando.set(false);
          this.mensajeAccion.set(error?.error?.detail ?? 'No se pudo reactivar el animal.');
        },
      });
  }

  private hoyIso(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
