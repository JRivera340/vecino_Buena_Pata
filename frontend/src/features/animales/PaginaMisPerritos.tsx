import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { agregarMiembroComunidad } from '@/core/api/comunidades';
import { listarMisPerritos } from '@/core/api/animales';
import { mensajeError } from '@/core/api/mensaje-error';
import { useCarga } from '@/core/api/useCarga';
import { etiquetaEspecie } from '@/core/formato.lib';
import type { Animal } from '@/core/modelos/animal';
import { useSesion } from '@/core/sesion/sesion.store';
import {
  armarMiembro,
  validarMiembro,
  type ErroresMiembro,
  type FormularioMiembro,
} from './miembro-comunidad.lib';
import { Alerta } from '@/shared/ui/Alerta';
import { Boton } from '@/shared/ui/Boton';
import { Campo, Entrada } from '@/shared/ui/Campo';
import { EncabezadoPagina } from '@/shared/ui/EncabezadoPagina';
import { ErrorCarga } from '@/shared/ui/ErrorCarga';
import { Esqueleto } from '@/shared/ui/Esqueleto';
import { EtiquetaEstado } from '@/shared/ui/Etiqueta';
import { FotoAnimal } from '@/shared/ui/FotoAnimal';
import { Tarjeta } from '@/shared/ui/Tarjeta';
import { useTitulo } from '@/shared/ui/useTitulo';

const FORMULARIO_VACIO: FormularioMiembro = { nombre: '', username: '', password: '' };

function FormularioMiembroNuevo() {
  const [f, setF] = useState<FormularioMiembro>(FORMULARIO_VACIO);
  const [errores, setErrores] = useState<ErroresMiembro>({});
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const cambiar = <K extends keyof FormularioMiembro>(clave: K, valor: FormularioMiembro[K]) =>
    setF((actual) => ({ ...actual, [clave]: valor }));

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const nuevos = validarMiembro(f);
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) {
      return;
    }
    setEnviando(true);
    setErrorEnvio(null);
    try {
      await agregarMiembroComunidad(armarMiembro(f));
      setF(FORMULARIO_VACIO);
      setAviso('Agregamos a la persona a tu comunidad.');
    } catch (error) {
      setErrorEnvio(mensajeError(error, 'No pudimos agregar a la persona. Inténtalo de nuevo.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Tarjeta className="mb-8 space-y-4 p-6">
      <div>
        <h2 className="text-h6 font-semibold text-tinta">Agregar a tu equipo</h2>
        <p className="text-minimo text-tinta-suave">
          Crea una cuenta de comunidad para alguien de tu equipo. Podrá inscribir y ver los
          perritos de tu comunidad.
        </p>
      </div>
      <form onSubmit={enviar} noValidate className="space-y-4">
        <Campo id="mie-nombre" etiqueta="Nombre completo" obligatorio error={errores.nombre}>
          {(props) => (
            <Entrada {...props} value={f.nombre} onChange={(e) => cambiar('nombre', e.target.value)} />
          )}
        </Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="mie-username" etiqueta="Usuario" obligatorio error={errores.username}>
            {(props) => (
              <Entrada
                {...props}
                autoComplete="off"
                value={f.username}
                onChange={(e) => cambiar('username', e.target.value)}
              />
            )}
          </Campo>
          <Campo
            id="mie-password"
            etiqueta="Contraseña"
            obligatorio
            error={errores.password}
            ayuda="Mínimo 8 caracteres."
          >
            {(props) => (
              <Entrada
                {...props}
                type="password"
                autoComplete="new-password"
                value={f.password}
                onChange={(e) => cambiar('password', e.target.value)}
              />
            )}
          </Campo>
        </div>
        {errorEnvio && <Alerta tipo="error">{errorEnvio}</Alerta>}
        {aviso && <Alerta tipo="exito">{aviso}</Alerta>}
        <Boton type="submit" cargando={enviando} className="w-full sm:w-auto">
          Agregar a la comunidad
        </Boton>
      </form>
    </Tarjeta>
  );
}

export default function PaginaMisPerritos() {
  useTitulo('Mis perritos');
  const animales = useCarga(listarMisPerritos, []);
  const lista: Animal[] = useMemo(() => animales.datos ?? [], [animales.datos]);
  const rol = useSesion((estado) => estado.sesion?.rol);

  return (
    <div className="contenedor py-10">
      <EncabezadoPagina
        titulo="Mis perritos"
        descripcion="Los animales inscritos por tu comunidad."
      />

      {rol === 'LIDER' && <FormularioMiembroNuevo />}

      {animales.error ? (
        <ErrorCarga titulo="No pudimos cargar tus perritos" alReintentar={animales.recargar} />
      ) : animales.cargando ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, indice) => (
            <Esqueleto key={indice} className="h-28 w-full" />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <p className="rounded border border-dashed border-lienzo-borde p-8 text-center text-tinta-suave">
          Tu comunidad aún no tiene perritos inscritos.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {lista.map((animal) => (
            <li key={animal.id}>
              <Link to={`/animales/${animal.id}`} className="block h-full no-underline">
                <Tarjeta interactiva className="flex h-full gap-4 p-4">
                  <FotoAnimal
                    ruta={animal.foto_principal}
                    nombre={animal.nombre}
                    especie={animal.especie}
                    className="h-20 w-20 shrink-0 rounded"
                  />
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-h6 font-semibold text-tinta">{animal.nombre}</p>
                    <p className="text-minimo text-tinta-suave">
                      {etiquetaEspecie(animal.especie)} en {animal.barrio}
                    </p>
                    <EtiquetaEstado estado={animal.estado} />
                  </div>
                </Tarjeta>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
