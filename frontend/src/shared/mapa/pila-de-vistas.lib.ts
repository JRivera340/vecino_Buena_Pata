export interface VistaMapa {
  centro: [number, number];
  zoom: number;
}

const TOLERANCIA = 1e-6;

function iguales(a: VistaMapa, b: VistaMapa): boolean {
  return (
    a.zoom === b.zoom &&
    Math.abs(a.centro[0] - b.centro[0]) < TOLERANCIA &&
    Math.abs(a.centro[1] - b.centro[1]) < TOLERANCIA
  );
}

// Guarda de dónde viene la persona para poder volver ahí al soltar una selección.
export class PilaDeVistas {
  private vistas: VistaMapa[] = [];

  get tamano(): number {
    return this.vistas.length;
  }

  empujar(vista: VistaMapa): void {
    const ultima = this.vistas[this.vistas.length - 1];
    if (ultima && iguales(ultima, vista)) {
      return;
    }
    this.vistas.push({ centro: [vista.centro[0], vista.centro[1]], zoom: vista.zoom });
  }

  sacar(): VistaMapa | undefined {
    return this.vistas.pop();
  }

  limpiar(): void {
    this.vistas = [];
  }
}
