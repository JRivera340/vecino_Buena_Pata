import { Link } from 'react-router-dom';
import { Marca } from './Marca';

const ENLACE_PIE =
  'inline-flex min-h-[44px] items-center text-pequeno text-white underline-offset-4 hover:underline sm:min-h-0';

export function Pie() {
  return (
    <footer className="mt-14 bg-verde-profundo text-white">
      <div className="contenedor grid gap-10 py-12 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-[46ch]">
          <Marca claro />
          <p className="mt-4 text-pequeno text-white/90">
            Un programa de la Alcaldía Local de Santa Fe para conocer, cuidar y acompañar a los animales
            que viven en nuestros barrios, junto con quienes los cuidan.
          </p>
        </div>

        <nav aria-label="Enlaces del sitio">
          <h2 className="text-h6 text-white">En este sitio</h2>
          <ul className="mt-3 space-y-1">
            <li>
              <Link to="/" className={ENLACE_PIE}>
                Mapa de animales
              </Link>
            </li>
            <li>
              <Link to="/#como-funciona" className={ENLACE_PIE}>
                Cómo funciona el programa
              </Link>
            </li>
            <li>
              <Link to="/ingreso" className={ENLACE_PIE}>
                Ingreso del personal
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="text-h6 text-white">Quién lo hace posible</h2>
          <img
            src="/alcaldia-santa-fe.png"
            alt="Alcaldía Local de Santa Fe, Bogotá"
            width={220}
            height={82}
            loading="lazy"
            className="mt-3 h-auto w-[220px]"
          />
          <p className="mt-3 text-pequeno text-white/90">
            Alcaldía Local de Santa Fe
            <br />
            Observatorio de Protección y Bienestar Animal (PYBA)
          </p>
        </div>
      </div>

      <div className="bg-verde-oscuro">
        <div className="contenedor py-4 text-pequeno text-white">
          Desarrollado por: Jairo Julian Rivera y Joshua Rivera
        </div>
      </div>
    </footer>
  );
}
