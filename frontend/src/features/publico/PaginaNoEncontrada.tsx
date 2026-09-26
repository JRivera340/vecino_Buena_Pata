import { useEffect } from 'react';
import { BotonEnlace } from '@/shared/ui/Boton';

export default function PaginaNoEncontrada() {
  useEffect(() => {
    document.title = 'Página no encontrada | Vecino Buena Pata';
  }, []);

  return (
    <div className="contenedor flex flex-col items-start gap-6 py-20">
      <p className="text-h6 text-verde-profundo">Error 404</p>
      <h1 className="max-w-[24ch] text-hero text-tinta">Esta página no existe o cambió de lugar</h1>
      <p className="max-w-[60ch] text-tinta-suave">
        Revisa que la dirección esté bien escrita. Si llegaste desde un enlace o un código QR y no
        abre, avísale a quien te lo compartió.
      </p>
      <BotonEnlace to="/" tamano="grande">
        Volver al mapa
      </BotonEnlace>
    </div>
  );
}
