import { QrCode } from 'lucide-react';
import { Tarjeta, TarjetaCuerpo } from '@/shared/ui/Tarjeta';

export function LlamadoQr() {
  return (
    <section aria-labelledby="titulo-qr" className="contenedor pt-14">
      <Tarjeta destacada>
        <TarjetaCuerpo className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <QrCode
            className="h-12 w-12 shrink-0 text-verde-profundo"
            aria-hidden="true"
            strokeWidth={1.5}
          />
          <div>
            <h2 id="titulo-qr" className="text-h4">
              ¿Viste un collar con código QR?
            </h2>
            <p className="mt-1 max-w-[62ch] text-tinta-suave">
              Escanéalo con la cámara del celular. Se abre la ficha del animal y desde ahí puedes
              contarnos si lo ves enfermo, herido o en peligro.
            </p>
          </div>
        </TarjetaCuerpo>
      </Tarjeta>
    </section>
  );
}
