import {
  etiquetaEspecie,
  etiquetaSexo,
  etiquetaTamano,
  formatearEdad,
  formatearFecha,
} from '@/core/formato.lib';
import type { AnimalDeInscriptor } from '@/core/modelos/inscripcion';
import { Alerta } from '@/shared/ui/Alerta';
import { EtiquetaEstado } from '@/shared/ui/Etiqueta';
import { FotoAnimal } from '@/shared/ui/FotoAnimal';
import { Tarjeta } from '@/shared/ui/Tarjeta';

interface AvisoInscripcionesPreviasProps {
  animales: AnimalDeInscriptor[];
}

export function AvisoInscripcionesPrevias({ animales }: AvisoInscripcionesPreviasProps) {
  const total = animales.length;
  return (
    <section aria-labelledby="titulo-previas" className="space-y-4">
      <Alerta
        tipo="info"
        titulo={total === 1 ? 'Ya has registrado 1 animal' : `Ya has registrado ${total} animales`}
      >
        Revisa la lista para confirmar que el animal que vas a inscribir ahora{' '}
        <strong>no es</strong> uno de estos. Van del más reciente al más antiguo.
      </Alerta>
      <h2 id="titulo-previas" className="solo-lectores">
        Animales que ya registraste
      </h2>
      <ul className="space-y-3">
        {animales.map((animal) => (
          <li key={animal.id}>
            <Tarjeta className="flex gap-4 p-4">
              <FotoAnimal
                ruta={animal.foto_principal}
                nombre={animal.nombre}
                especie={animal.especie}
                className="h-24 w-24 shrink-0 rounded"
              />
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-h6 font-semibold">{animal.nombre}</p>
                  <EtiquetaEstado estado={animal.estado} />
                </div>
                <p className="text-pequeno text-tinta-suave">
                  {etiquetaEspecie(animal.especie)}, {etiquetaSexo(animal.sexo).toLowerCase()},
                  tamaño {etiquetaTamano(animal.tamano).toLowerCase()},{' '}
                  {formatearEdad(animal.edad_estimada).toLowerCase()}
                </p>
                <p className="text-pequeno text-tinta-suave">
                  Barrio {animal.barrio}. Inscrito el {formatearFecha(animal.fecha_inscripcion)}.
                </p>
                <p className="text-pequeno text-tinta-suave">
                  {animal.esterilizado ? 'Esterilizado' : 'Sin esterilizar'},{' '}
                  {animal.tiene_microchip ? 'con' : 'sin'} microchip.
                </p>
                {animal.descripcion && <p className="text-pequeno">{animal.descripcion}</p>}
              </div>
            </Tarjeta>
          </li>
        ))}
      </ul>
    </section>
  );
}
