import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { crearAnimal } from '@/core/api/animales';
import { listarComunidades } from '@/core/api/comunidades';
import { subirArchivo } from '@/core/api/medios';
import { mensajeError } from '@/core/api/mensaje-error';
import { useCarga } from '@/core/api/useCarga';
import type { Especie, Sexo, Tamano } from '@/core/modelos/enums';
import { ChipLocalidad } from '@/shared/mapa/ChipLocalidad';
import { MapaTerritorio, type UbicacionSeleccionada } from '@/shared/mapa/MapaTerritorio';
import { Alerta } from '@/shared/ui/Alerta';
import { Boton } from '@/shared/ui/Boton';
import { AreaTexto, Campo, Entrada, Selector } from '@/shared/ui/Campo';
import { EncabezadoPagina } from '@/shared/ui/EncabezadoPagina';
import { useTitulo } from '@/shared/ui/useTitulo';
import { validarInscripcion, type ErroresInscripcion } from './validar-inscripcion.lib';

export default function PaginaInscribir() {
  useTitulo('Inscribir un animal');
  const navegar = useNavigate();
  const comunidades = useCarga(listarComunidades, []);

  const [nombre, setNombre] = useState('');
  const [especie, setEspecie] = useState<Especie>('PERRO');
  const [sexo, setSexo] = useState<Sexo>('MACHO');
  const [tamano, setTamano] = useState<Tamano>('MEDIANO');
  const [edad, setEdad] = useState('');
  const [barrio, setBarrio] = useState('');
  const [comunidadId, setComunidadId] = useState<number | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [ubicacion, setUbicacion] = useState<UbicacionSeleccionada | null>(null);
  const [errores, setErrores] = useState<ErroresInscripcion>({});
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const nuevos = validarInscripcion({
      nombre,
      barrio,
      comunidadId,
      ubicacion,
      foto,
      edadEstimada: edad,
    });
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0 || !foto || !ubicacion || comunidadId === null) {
      return;
    }
    setEnviando(true);
    setErrorEnvio(null);
    try {
      const { ruta } = await subirArchivo(foto);
      const animal = await crearAnimal({
        nombre: nombre.trim(),
        especie,
        sexo,
        tamano,
        edad_estimada: edad.trim() === '' ? null : Number(edad),
        descripcion: descripcion.trim() === '' ? null : descripcion.trim(),
        foto_principal: ruta,
        barrio: barrio.trim(),
        latitud: ubicacion.lat,
        longitud: ubicacion.lng,
        comunidad_id: comunidadId,
      });
      navegar(`/animales/${animal.id}`);
    } catch (error) {
      setErrorEnvio(mensajeError(error, 'No pudimos inscribir al animal. Inténtalo de nuevo.'));
      setEnviando(false);
    }
  }

  return (
    <div className="contenedor py-10">
      <EncabezadoPagina
        titulo="Inscribir un animal"
        descripcion="Registra a un perro o gato del barrio. Queda como candidato hasta que un veterinario lo valide."
        migas={[{ texto: 'Mapa', a: '/mapa' }, { texto: 'Inscribir' }]}
      />

      <form onSubmit={enviar} noValidate className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-4">
          <Campo id="ins-nombre" etiqueta="Nombre" obligatorio error={errores.nombre}>
            {(props) => (
              <Entrada {...props} value={nombre} onChange={(e) => setNombre(e.target.value)} />
            )}
          </Campo>
          <div className="grid gap-4 sm:grid-cols-3">
            <Campo id="ins-especie" etiqueta="Especie" obligatorio>
              {(props) => (
                <Selector
                  {...props}
                  value={especie}
                  onChange={(e) => setEspecie(e.target.value as Especie)}
                >
                  <option value="PERRO">Perro</option>
                  <option value="GATO">Gato</option>
                </Selector>
              )}
            </Campo>
            <Campo id="ins-sexo" etiqueta="Sexo" obligatorio>
              {(props) => (
                <Selector {...props} value={sexo} onChange={(e) => setSexo(e.target.value as Sexo)}>
                  <option value="MACHO">Macho</option>
                  <option value="HEMBRA">Hembra</option>
                </Selector>
              )}
            </Campo>
            <Campo id="ins-tamano" etiqueta="Tamaño" obligatorio>
              {(props) => (
                <Selector
                  {...props}
                  value={tamano}
                  onChange={(e) => setTamano(e.target.value as Tamano)}
                >
                  <option value="PEQUENO">Pequeño</option>
                  <option value="MEDIANO">Mediano</option>
                  <option value="GRANDE">Grande</option>
                </Selector>
              )}
            </Campo>
          </div>
          <Campo
            id="ins-edad"
            etiqueta="Edad estimada en años"
            ayuda="Opcional."
            error={errores.edad}
          >
            {(props) => (
              <Entrada
                {...props}
                inputMode="numeric"
                value={edad}
                onChange={(e) => setEdad(e.target.value)}
              />
            )}
          </Campo>
          <Campo id="ins-barrio" etiqueta="Barrio" obligatorio error={errores.barrio}>
            {(props) => (
              <Entrada {...props} value={barrio} onChange={(e) => setBarrio(e.target.value)} />
            )}
          </Campo>
          <Campo
            id="ins-comunidad"
            etiqueta="Comunidad que lo cuida"
            obligatorio
            error={errores.comunidad}
          >
            {(props) => (
              <Selector
                {...props}
                value={comunidadId ?? ''}
                onChange={(e) =>
                  setComunidadId(e.target.value === '' ? null : Number(e.target.value))
                }
              >
                <option value="">Elige una comunidad</option>
                {(comunidades.datos ?? []).map((comunidad) => (
                  <option key={comunidad.id} value={comunidad.id}>
                    {comunidad.nombre}
                  </option>
                ))}
              </Selector>
            )}
          </Campo>
          <Campo
            id="ins-descripcion"
            etiqueta="Descripción"
            ayuda="Opcional. Rasgos, carácter, cómo lo reconocen."
          >
            {(props) => (
              <AreaTexto
                {...props}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            )}
          </Campo>
          <Campo
            id="ins-foto"
            etiqueta="Foto"
            obligatorio
            error={errores.foto}
            ayuda="JPG, PNG o WEBP de hasta 10 MB."
          >
            {(props) => (
              <Entrada
                {...props}
                type="file"
                accept="image/*"
                onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
              />
            )}
          </Campo>
        </div>

        <div className="space-y-4">
          <p className="text-pequeno font-semibold">
            Dónde vive{' '}
            <span className="text-peligro" aria-hidden="true">
              *
            </span>
          </p>
          <p className="text-minimo text-tinta-suave">Toca el mapa para marcar el punto.</p>
          <div className="overflow-hidden rounded-tarjeta border border-black/15">
            <MapaTerritorio
              seleccionable
              altura="380px"
              zoom={14}
              descripcion="Mapa para marcar dónde vive el animal"
              alSeleccionarUbicacion={setUbicacion}
            />
          </div>
          <ChipLocalidad ubicacion={ubicacion} />
          {errores.ubicacion && (
            <p role="alert" className="text-minimo text-peligro">
              {errores.ubicacion}
            </p>
          )}
          {errorEnvio && <Alerta tipo="error">{errorEnvio}</Alerta>}
          <Boton type="submit" tamano="grande" cargando={enviando} movilCompleto>
            Inscribir animal
          </Boton>
        </div>
      </form>
    </div>
  );
}
