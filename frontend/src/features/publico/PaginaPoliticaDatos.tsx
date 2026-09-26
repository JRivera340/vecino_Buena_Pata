import { EncabezadoPagina } from '@/shared/ui/EncabezadoPagina';
import { useTitulo } from '@/shared/ui/useTitulo';

export default function PaginaPoliticaDatos() {
  useTitulo('Tratamiento de datos personales');
  return (
    <div className="contenedor max-w-[760px] space-y-6 py-10">
      <EncabezadoPagina
        titulo="Tratamiento de datos personales"
        migas={[{ texto: 'Inicio', a: '/' }, { texto: 'Tratamiento de datos' }]}
      />

      <section className="space-y-2">
        <h2 className="text-h4">Quién trata tus datos</h2>
        <p>
          Vecino Buena Pata es un programa de la Alcaldía Local de Santa Fe, con el Observatorio de
          Protección y Bienestar Animal (PYBA). Ellos son los responsables del tratamiento de la
          información que registras.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-h4">Qué datos pedimos y para qué</h2>
        <p>
          Pedimos tu tipo y número de documento, nombre, teléfono y correo. Los usamos para
          identificarte como quien inscribe al animal, avisarte cuando avance el trámite y
          comunicarnos contigo si hace falta aclarar algo. El documento también nos permite saber si
          ya registraste otros animales, para evitar inscripciones repetidas.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-h4">Qué no se muestra</h2>
        <p>
          Tu nombre, teléfono y correo nunca aparecen en las páginas públicas. En el mapa público
          solo se ve una ubicación aproximada del animal, no el punto exacto.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-h4">Tus derechos</h2>
        <p>
          Según la Ley 1581 de 2012 puedes conocer, actualizar, rectificar y pedir la supresión de
          tus datos, y revocar tu autorización. Para hacerlo, escribe a la Alcaldía Local de Santa
          Fe indicando tu tipo y número de documento.
        </p>
      </section>
    </div>
  );
}
