import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { resolverUrlMedia } from '../../core/media/resolver-url-media.lib';
import { Especie } from '../../core/models/enums';
import { AnimalMapaPublico } from '../../core/models/publico.model';
import { PublicoService } from '../../core/publico/publico.service';
import { estadoVisual } from '../../shared/estado-visual/estado-visual.lib';
import { MapaTerritorioComponent, MarcadorMapa } from '../../shared/mapa/mapa-territorio.component';
import { filtrarMapaPublico } from './filtrar-mapa-publico.lib';
import { separarMarcadores } from './separar-marcadores.lib';

@Component({
  selector: 'app-mapa-publico',
  standalone: true,
  imports: [FormsModule, RouterLink, MapaTerritorioComponent],
  templateUrl: './mapa-publico.component.html',
  styleUrl: './mapa-publico.component.scss',
})
export class MapaPublicoComponent implements OnInit {
  animales = signal<AnimalMapaPublico[]>([]);
  cargando = signal(true);

  busqueda = signal('');
  filtroEspecie = signal<Especie | 'TODAS'>('TODAS');
  filtroBarrio = signal<string | 'TODOS'>('TODOS');
  animalSeleccionadoId = signal<number | null>(null);
  panelAbierto = signal(true);

  animalesFiltrados = computed(() =>
    filtrarMapaPublico(this.animales(), {
      busqueda: this.busqueda(),
      especie: this.filtroEspecie(),
      barrio: this.filtroBarrio(),
    }),
  );

  animalSeleccionado = computed(
    () => this.animalesFiltrados().find((animal) => animal.id === this.animalSeleccionadoId()) ?? null,
  );

  barriosDisponibles = computed(() => Array.from(new Set(this.animales().map((animal) => animal.barrio))).sort());

  marcadores = computed<MarcadorMapa[]>(() => {
    const visual = estadoVisual('VBP_ACTIVO');
    const puntos: MarcadorMapa[] = this.animalesFiltrados().map((animal) => ({
      id: animal.id,
      lat: animal.latitud,
      lng: animal.longitud,
      etiqueta: animal.nombre,
      visual,
    }));
    return separarMarcadores(puntos);
  });

  constructor(private readonly publicoService: PublicoService) {}

  ngOnInit(): void {
    this.publicoService.listarMapa().subscribe({
      next: (animales) => {
        this.animales.set(animales);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  seleccionarAnimal(id: number): void {
    this.animalSeleccionadoId.set(id);
  }

  alternarPanel(): void {
    this.panelAbierto.set(!this.panelAbierto());
  }

  urlFoto(ruta: string | null): string | null {
    return resolverUrlMedia(ruta);
  }
}
