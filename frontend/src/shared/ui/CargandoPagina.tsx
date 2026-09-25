import { Esqueleto } from './Esqueleto';

export function CargandoPagina() {
  return (
    <div className="contenedor space-y-4 py-12" role="status" aria-label="Cargando la página">
      <Esqueleto className="h-8 w-1/3" />
      <Esqueleto className="h-4 w-2/3" />
      <Esqueleto className="h-64 w-full" />
    </div>
  );
}
