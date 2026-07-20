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

export interface UbicacionSeleccionada {
  lat: number;
  lng: number;
}

const ICONO_SELECCION = L.divIcon({
  html: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="10" style="fill:var(--color-primario);stroke:var(--color-fondo);stroke-width:2" /></svg>',
  className: 'icono-marcador-vbp',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

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
  @Input() seleccionable = false;

  @Output() marcadorClick = new EventEmitter<number>();
  @Output() ubicacionSeleccionada = new EventEmitter<UbicacionSeleccionada>();

  private mapa?: L.Map;
  private capaMarcadores?: L.LayerGroup;
  private marcadorTemporal?: L.Marker;

  ngAfterViewInit(): void {
    this.mapa = L.map(this.contenedorRef.nativeElement).setView(this.centro, this.zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'OpenStreetMap',
    }).addTo(this.mapa);
    this.capaMarcadores = L.layerGroup().addTo(this.mapa);
    this.dibujarMarcadores();

    if (this.seleccionable) {
      this.mapa.on('click', (evento: L.LeafletMouseEvent) => {
        this.colocarMarcadorTemporal(evento.latlng);
        this.ubicacionSeleccionada.emit({ lat: evento.latlng.lat, lng: evento.latlng.lng });
      });
    }
  }

  ngOnChanges(cambios: SimpleChanges): void {
    if (cambios['marcadores'] && this.mapa) {
      this.dibujarMarcadores();
    }
  }

  ngOnDestroy(): void {
    this.mapa?.remove();
  }

  private colocarMarcadorTemporal(latlng: L.LatLng): void {
    if (!this.mapa) {
      return;
    }
    if (this.marcadorTemporal) {
      this.mapa.removeLayer(this.marcadorTemporal);
    }
    this.marcadorTemporal = L.marker(latlng, { icon: ICONO_SELECCION }).addTo(this.mapa);
  }

  private dibujarMarcadores(): void {
    if (!this.capaMarcadores) {
      return;
    }
    this.capaMarcadores.clearLayers();
    for (const marcador of this.marcadores) {
      const icono = crearIconoMarcador(marcador.visual);
      const contenidoPopup = document.createElement('span');
      contenidoPopup.textContent = marcador.etiqueta;
      const punto = L.marker([marcador.lat, marcador.lng], { icon: icono }).bindPopup(contenidoPopup);
      punto.on('click', () => this.marcadorClick.emit(marcador.id));
      this.capaMarcadores.addLayer(punto);
    }
  }
}
