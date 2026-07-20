import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import * as L from 'leaflet';

import { crearIconoMarcador } from './icono-marcador';
import { EstadoVisualResultado } from '../estado-visual/estado-visual.lib';

export interface MarcadorMapa {
  id: number;
  lat: number;
  lng: number;
  visual: EstadoVisualResultado;
  etiqueta: string;
}

@Component({
  selector: 'app-mapa-territorio',
  standalone: true,
  template: `<div #contenedor class="mapa-territorio" [style.height]="altura"></div>`,
  styleUrl: './mapa-territorio.component.scss',
})
export class MapaTerritorioComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('contenedor', { static: true }) contenedorRef!: ElementRef<HTMLDivElement>;

  @Input() marcadores: MarcadorMapa[] = [];
  @Input() centro: [number, number] = [4.6097, -74.0817];
  @Input() zoom = 13;
  @Input() altura = '100%';

  @Output() marcadorClick = new EventEmitter<number>();

  private mapa?: L.Map;
  private capaMarcadores?: L.LayerGroup;

  ngAfterViewInit(): void {
    this.mapa = L.map(this.contenedorRef.nativeElement).setView(this.centro, this.zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'OpenStreetMap',
    }).addTo(this.mapa);
    this.capaMarcadores = L.layerGroup().addTo(this.mapa);
    this.dibujarMarcadores();
  }

  ngOnChanges(cambios: SimpleChanges): void {
    if (cambios['marcadores'] && this.mapa) {
      this.dibujarMarcadores();
    }
  }

  ngOnDestroy(): void {
    this.mapa?.remove();
  }

  private dibujarMarcadores(): void {
    if (!this.capaMarcadores) {
      return;
    }
    this.capaMarcadores.clearLayers();
    for (const marcador of this.marcadores) {
      const icono = crearIconoMarcador(marcador.visual);
      const punto = L.marker([marcador.lat, marcador.lng], { icon: icono }).bindPopup(marcador.etiqueta);
      punto.on('click', () => this.marcadorClick.emit(marcador.id));
      this.capaMarcadores.addLayer(punto);
    }
  }
}
