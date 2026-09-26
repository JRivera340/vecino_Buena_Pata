import { Link } from 'react-router-dom';
import type { AnimalMapaPublico } from '@/core/modelos/publico';
import { etiquetaEspecie } from '@/core/formato.lib';
import { estilosBoton } from '@/shared/ui/Boton';
import { FotoAnimal } from '@/shared/ui/FotoAnimal';
import { resumirMapa } from '../resumen-mapa.lib';

function CurvasDeNivel() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 800 420"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full text-white opacity-[0.13]"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M-20 330C120 290 200 380 340 340S560 230 820 290" />
        <path d="M-20 290C110 245 210 340 350 300S570 190 820 250" />
        <path d="M-20 250C100 205 220 300 360 260S580 150 820 210" />
        <path d="M-20 210C90 165 230 260 370 220S590 110 820 170" />
        <path d="M-20 170C80 125 240 220 380 180S600 70 820 130" />
        <path d="M-20 130C70 85 250 180 390 140S610 30 820 90" />
        <path d="M-20 90C60 45 260 140 400 100S620 -10 820 50" />
        <path d="M120 420C160 350 260 330 330 370S470 440 560 380" />
        <path d="M560 -10C600 60 680 80 740 60S840 10 860 -20" />
      </g>
    </svg>
  );
}

function FichaDestacada({ animal }: { animal: AnimalMapaPublico }) {
  return (
    <article className="overflow-hidden rounded-seccion bg-white text-tinta shadow-fuerte lg:max-w-[380px] lg:justify-self-end">
      <FotoAnimal
        ruta={animal.foto_principal}
        nombre={animal.nombre}
        especie={animal.especie}
        prioridad
        className="aspect-[4/3] w-full"
      />
      <div className="space-y-1 p-5">
        <h2 className="text-h3">{animal.nombre}</h2>
        <p className="text-pequeno text-tinta-suave">
          {etiquetaEspecie(animal.especie)} en {animal.barrio}
        </p>
        <Link
          to={`/vbp/${animal.id}`}
          className="mt-3 inline-flex min-h-[44px] items-center font-semibold text-verde-profundo underline-offset-4 hover:underline sm:min-h-0"
        >
          Ver la ficha de {animal.nombre}
        </Link>
      </div>
    </article>
  );
}

interface HeroProps {
  animales: AnimalMapaPublico[] | null;
  cargando: boolean;
}

export function Hero({ animales, cargando }: HeroProps) {
  const destacado = animales?.find((animal) => animal.foto_principal) ?? animales?.[0] ?? null;

  return (
    <section
      aria-labelledby="titulo-hero"
      className="relative overflow-hidden text-white"
      style={{
        background: 'linear-gradient(235deg, #719d15 0%, #5f8910 25%, #55711f 55%, #45591a 100%)',
      }}
    >
      <CurvasDeNivel />
      <div className="contenedor relative grid items-center gap-10 py-14 lg:min-h-[400px] lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
        <div className="max-w-[56ch]">
          <h1 id="titulo-hero" className="text-h1 sm:text-hero">
            Conoce a los animales que cuidamos en Santa Fe
          </h1>
          <p className="mt-4 text-h5 font-normal text-white">
            Cada Vecino Buena Pata tiene su ficha con foto, datos de salud y la zona aproximada
            donde vive. Explora el mapa o escanea el código QR de su collar.
          </p>
          <p className="mt-3 text-pequeno text-white" aria-live="polite">
            {cargando ? 'Cargando el mapa…' : resumirMapa(animales ?? [])}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#mapa"
              className={estilosBoton({ variante: 'claro', tamano: 'grande', movilCompleto: true })}
            >
              Explorar el mapa
            </a>
            <Link
              to="/inscribir"
              className={estilosBoton({
                variante: 'contornoClaro',
                tamano: 'grande',
                movilCompleto: true,
              })}
            >
              Inscribir un animal
            </Link>
          </div>
        </div>
        {destacado && !cargando && <FichaDestacada animal={destacado} />}
      </div>
    </section>
  );
}
