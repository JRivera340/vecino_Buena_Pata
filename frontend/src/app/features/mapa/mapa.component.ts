import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AnimalesService } from '../../core/animales/animales.service';
import { ComunidadesService } from '../../core/comunidades/comunidades.service';
import { Animal } from '../../core/models/animal.model';
import { Comunidad } from '../../core/models/comunidad.model';
import { EstadoAnimal } from '../../core/models/enums';
import { estadoVisual } from '../../shared/estado-visual/estado-visual.lib';
import { MapaTerritorioComponent, MarcadorMapa } from '../../shared/mapa/mapa-territorio.component';

const ESTADOS_VISIBLES_POR_DEFECTO: EstadoAnimal[] = ['CANDIDATO', 'EN_PROCESO', 'VBP_ACTIVO'];

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [FormsModule, MapaTerritorioComponent],
  templateUrl: './mapa.component.html',
  styleUrl: './mapa.component.scss',
})
export class MapaComponent implements OnInit {
  animales = signal<Animal[]>([]);
  comunidades = signal<Comunidad[]>([]);

  busqueda = signal('');
  filtroEstado = signal<EstadoAnimal | 'TODOS'>('TODOS');
  filtroBarrio = signal<string | 'TODOS'>('TODOS');
  filtroComunidadId = signal<number | 'TODOS'>('TODOS');
  mostrarSalidos = signal(false);
  animalSeleccionadoId = signal<number | null>(null);
  panelAbierto = signal(true);

  animalesFiltrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    return this.animales().filter((animal) => {
      if (!this.mostrarSalidos() && !ESTADOS_VISIBLES_POR_DEFECTO.includes(animal.estado)) {
        return false;
      }
      if (texto && !animal.nombre.toLowerCase().includes(texto)) {
        return false;
      }
      if (this.filtroEstado() !== 'TODOS' && animal.estado !== this.filtroEstado()) {
        return false;
      }
      if (this.filtroBarrio() !== 'TODOS' && animal.barrio !== this.filtroBarrio()) {
        return false;
      }
      if (this.filtroComunidadId() !== 'TODOS' && animal.comunidad_id !== this.filtroComunidadId()) {
        return false;
      }
      return true;
    });
  });

  marcadores = computed<MarcadorMapa[]>(() =>
    this.animalesFiltrados().map((animal) => ({
      id: animal.id,
      lat: animal.latitud,
      lng: animal.longitud,
      etiqueta: animal.nombre,
      visual: estadoVisual(animal.estado),
    })),
  );

  barriosDisponibles = computed(() => Array.from(new Set(this.animales().map((animal) => animal.barrio))).sort());

  contadores = computed(() => {
    const lista = this.animales();
    return {
      total: lista.length,
      vbpActivos: lista.filter((animal) => animal.estado === 'VBP_ACTIVO').length,
      candidatos: lista.filter((animal) => animal.estado === 'CANDIDATO').length,
      enProceso: lista.filter((animal) => animal.estado === 'EN_PROCESO').length,
    };
  });

  constructor(
    private readonly animalesService: AnimalesService,
    private readonly comunidadesService: ComunidadesService,
  ) {}

  ngOnInit(): void {
    this.animalesService.listar().subscribe((animales) => this.animales.set(animales));
    this.comunidadesService.listar().subscribe((comunidades) => this.comunidades.set(comunidades));
  }

  seleccionarAnimal(id: number): void {
    this.animalSeleccionadoId.set(id);
  }

  alternarPanel(): void {
    this.panelAbierto.set(!this.panelAbierto());
  }

  estadoVisualDe(animal: Animal) {
    return estadoVisual(animal.estado);
  }
}
