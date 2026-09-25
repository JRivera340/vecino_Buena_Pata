import { Outlet } from 'react-router-dom';
import { useAviso } from '@/core/avisos/aviso.store';
import { Alerta } from '@/shared/ui/Alerta';
import { Encabezado } from './Encabezado';
import { Pie } from './Pie';

export function Estructura() {
  const mensaje = useAviso((estado) => estado.mensaje);
  const limpiar = useAviso((estado) => estado.limpiar);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#contenido"
        className="solo-lectores focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:m-0 focus:h-auto focus:w-auto focus:rounded focus:bg-white focus:px-4 focus:py-3 focus:font-semibold focus:text-verde-profundo focus:shadow-fuerte"
      >
        Saltar al contenido
      </a>
      <Encabezado />
      {mensaje && (
        <div className="contenedor pt-4">
          <Alerta tipo="error" alCerrar={limpiar}>
            {mensaje}
          </Alerta>
        </div>
      )}
      <main id="contenido" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>
      <Pie />
    </div>
  );
}
