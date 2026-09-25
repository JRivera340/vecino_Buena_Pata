import { Calendar, ClipboardCheck, QrCode, Stethoscope } from 'lucide-react';

const PASOS = [
  {
    titulo: 'Inscripción',
    texto: 'Un vecino o una organización del barrio registra al animal con su nombre, una foto y la zona donde vive.',
    Icono: ClipboardCheck,
  },
  {
    titulo: 'Validación veterinaria',
    texto: 'Un veterinario lo revisa y confirma que está esterilizado y tiene microchip.',
    Icono: Stethoscope,
  },
  {
    titulo: 'Formalización',
    texto: 'Cuando cumple todo, recibe un collar con código QR y aparece en este mapa.',
    Icono: QrCode,
  },
  {
    titulo: 'Seguimiento',
    texto: 'El equipo lo visita cada cierto tiempo y actualiza su ficha. Si algo cambia, cualquiera puede avisarlo con el QR.',
    Icono: Calendar,
  },
];

export function ComoFunciona() {
  return (
    <section id="como-funciona" aria-labelledby="titulo-como" className="scroll-mt-20 bg-white py-14">
      <div className="contenedor">
        <div className="mb-10 max-w-[62ch]">
          <h2 id="titulo-como" className="text-h2">
            Cómo llega un animal al mapa
          </h2>
          <p className="mt-2 text-tinta-suave">
            Son cuatro pasos. Solo quienes los completan se muestran aquí.
          </p>
        </div>

        <ol className="grid gap-10 lg:grid-cols-4 lg:gap-8">
          {PASOS.map(({ titulo, texto, Icono }, indice) => (
            <li key={titulo} className="relative flex gap-4 lg:block">
              <div className="flex shrink-0 items-center gap-3 lg:mb-4">
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-verde-profundo text-h6 text-white"
                >
                  {indice + 1}
                </span>
                {indice < PASOS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute left-[21px] top-12 block h-[calc(100%+1.5rem)] w-px bg-verde/40 lg:left-14 lg:top-[22px] lg:h-px lg:w-[calc(100%-3.5rem)]"
                  />
                )}
              </div>
              <div>
                <h3 className="flex items-center gap-2 text-h5 font-semibold">
                  <Icono className="h-5 w-5 text-verde-profundo" aria-hidden="true" />
                  {titulo}
                </h3>
                <p className="mt-2 max-w-[38ch] text-pequeno text-tinta-suave">{texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
