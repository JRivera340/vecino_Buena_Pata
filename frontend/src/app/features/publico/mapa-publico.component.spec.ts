import { of } from 'rxjs';

import { AnimalMapaPublico } from '../../core/models/publico.model';
import { PublicoService } from '../../core/publico/publico.service';
import { MapaPublicoComponent } from './mapa-publico.component';

function crearAnimal(id: number): AnimalMapaPublico {
  return {
    id,
    nombre: `Animal ${id}`,
    especie: 'PERRO',
    foto_principal: null,
    barrio: 'La Esperanza',
    latitud: 4.6095,
    longitud: -74.0805,
  };
}

function crearComponente(animales: AnimalMapaPublico[] = []): MapaPublicoComponent {
  const servicio = { listarMapa: () => of(animales) } as unknown as PublicoService;
  return new MapaPublicoComponent(servicio);
}

describe('MapaPublicoComponent', () => {
  it('abre el panel al seleccionar un animal para mostrar su enlace a la hoja de vida', () => {
    const componente = crearComponente([crearAnimal(3)]);
    componente.ngOnInit();
    componente.panelAbierto.set(false);

    componente.seleccionarAnimal(3);

    expect(componente.panelAbierto()).toBe(true);
    expect(componente.animalSeleccionado()?.id).toBe(3);
  });

  it('separa los marcadores de animales que comparten la misma celda', () => {
    const componente = crearComponente([crearAnimal(1), crearAnimal(2)]);
    componente.ngOnInit();

    const posiciones = new Set(componente.marcadores().map((m) => `${m.lat}|${m.lng}`));

    expect(posiciones.size).toBe(2);
  });
});
