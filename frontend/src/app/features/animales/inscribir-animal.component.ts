import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';

import { AnimalesService } from '../../core/animales/animales.service';
import { ComunidadesService } from '../../core/comunidades/comunidades.service';
import { MediaService } from '../../core/media/media.service';
import { Comunidad } from '../../core/models/comunidad.model';
import { Sexo, Tamano } from '../../core/models/enums';
import { MapaTerritorioComponent, UbicacionSeleccionada } from '../../shared/mapa/mapa-territorio.component';

@Component({
  selector: 'app-inscribir-animal',
  standalone: true,
  imports: [FormsModule, MapaTerritorioComponent],
  templateUrl: './inscribir-animal.component.html',
  styleUrl: './inscribir-animal.component.scss',
})
export class InscribirAnimalComponent {
  comunidades = signal<Comunidad[]>([]);

  nombre = signal('');
  sexo = signal<Sexo>('MACHO');
  tamano = signal<Tamano>('MEDIANO');
  edadEstimada = signal<number | null>(null);
  descripcion = signal('');
  barrio = signal('');
  comunidadId = signal<number | null>(null);
  ubicacion = signal<UbicacionSeleccionada | null>(null);
  fotoArchivo = signal<File | null>(null);

  enviando = signal(false);
  error = signal<string | null>(null);
  exito = signal(false);

  constructor(
    private readonly animalesService: AnimalesService,
    private readonly comunidadesService: ComunidadesService,
    private readonly mediaService: MediaService,
    private readonly router: Router,
  ) {
    this.comunidadesService.listar().subscribe((comunidades) => this.comunidades.set(comunidades));
  }

  seleccionarUbicacion(ubicacion: UbicacionSeleccionada): void {
    this.ubicacion.set(ubicacion);
  }

  seleccionarFoto(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    this.fotoArchivo.set(input.files?.[0] ?? null);
  }

  formularioValido(): boolean {
    return (
      this.nombre().trim().length > 0 &&
      this.barrio().trim().length > 0 &&
      this.comunidadId() !== null &&
      this.ubicacion() !== null &&
      this.fotoArchivo() !== null
    );
  }

  inscribir(): void {
    if (!this.formularioValido()) {
      this.error.set('Completa nombre, barrio, comunidad, ubicacion en el mapa y una foto.');
      return;
    }

    const archivo = this.fotoArchivo();
    const ubicacion = this.ubicacion();
    if (!archivo || !ubicacion) {
      return;
    }

    this.error.set(null);
    this.enviando.set(true);

    this.mediaService
      .subir(archivo)
      .pipe(
        switchMap((subida) =>
          this.animalesService.crear({
            nombre: this.nombre(),
            sexo: this.sexo(),
            tamano: this.tamano(),
            edad_estimada: this.edadEstimada(),
            descripcion: this.descripcion() || null,
            foto_principal: subida.ruta,
            barrio: this.barrio(),
            latitud: ubicacion.lat,
            longitud: ubicacion.lng,
            comunidad_id: this.comunidadId() as number,
          }),
        ),
      )
      .subscribe({
        next: () => {
          this.enviando.set(false);
          this.exito.set(true);
        },
        error: () => {
          this.enviando.set(false);
          this.error.set('No se pudo registrar el animal. Intenta de nuevo.');
        },
      });
  }

  volverAlMapa(): void {
    this.router.navigate(['/mapa']);
  }
}
