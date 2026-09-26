import { useState, type FormEvent } from 'react';
import { listarComunidades } from '@/core/api/comunidades';
import { mensajeError } from '@/core/api/mensaje-error';
import { useCarga } from '@/core/api/useCarga';
import { crearUsuario, editarUsuario, listarUsuarios } from '@/core/api/usuarios';
import type { RolUsuario, TipoComunidad, TipoDocumento } from '@/core/modelos/enums';
import type { Usuario } from '@/core/modelos/usuario';
import { TIPOS_DOCUMENTO, validarDocumento } from '@/features/publico/inscripcion/documento.lib';
import { Alerta } from '@/shared/ui/Alerta';
import { Boton } from '@/shared/ui/Boton';
import { Campo, Entrada, Selector } from '@/shared/ui/Campo';
import { EncabezadoPagina } from '@/shared/ui/EncabezadoPagina';
import { ErrorCarga } from '@/shared/ui/ErrorCarga';
import { Etiqueta } from '@/shared/ui/Etiqueta';
import { Modal } from '@/shared/ui/Modal';
import { Tabla, type Columna } from '@/shared/ui/Tabla';
import { useTitulo } from '@/shared/ui/useTitulo';
import {
  armarUsuario,
  ROLES_CREABLES,
  validarUsuario,
  type ErroresUsuario,
  type FormularioUsuario,
} from './usuarios.lib';

const NOMBRE_ROL: Record<string, string> = {
  COMUNIDAD: 'Comunidad',
  VETERINARIO: 'Veterinario',
  LIDER: 'Líder',
  ADMIN: 'Administrador',
};

const TIPOS_COMUNIDAD: { valor: TipoComunidad; texto: string }[] = [
  { valor: 'ACCION_COMUNAL', texto: 'Junta de acción comunal' },
  { valor: 'PROTECCION_ANIMAL', texto: 'Protección animal' },
  { valor: 'EDUCATIVA', texto: 'Institución educativa' },
  { valor: 'UNIVERSIDAD', texto: 'Universidad' },
];

const FORMULARIO_VACIO: FormularioUsuario = {
  nombre: '',
  username: '',
  password: '',
  rol: 'LIDER',
  tipoDocumento: 'CC',
  numeroDocumento: '',
  origenComunidad: 'nueva',
  comunidadId: null,
  comunidadNombre: '',
  comunidadTipo: 'ACCION_COMUNAL',
  comunidadBarrio: '',
  comunidadTelefono: '',
  comunidadCorreo: '',
};

function FormularioNuevo({ alTerminar }: { alTerminar: () => void }) {
  const comunidades = useCarga(listarComunidades, []);
  const [f, setF] = useState<FormularioUsuario>(FORMULARIO_VACIO);
  const [errores, setErrores] = useState<ErroresUsuario>({});
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const cambiar = <K extends keyof FormularioUsuario>(clave: K, valor: FormularioUsuario[K]) =>
    setF((actual) => ({ ...actual, [clave]: valor }));
  const sinLider = (comunidades.datos ?? []).filter((comunidad) => comunidad.lider_id == null);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const nuevos = validarUsuario(f);
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) {
      return;
    }
    setEnviando(true);
    setErrorEnvio(null);
    try {
      await crearUsuario(armarUsuario(f));
      alTerminar();
    } catch (error) {
      setErrorEnvio(mensajeError(error, 'No pudimos crear el usuario. Inténtalo de nuevo.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-4">
      <Campo id="usr-rol" etiqueta="Rol" obligatorio>
        {(props) => (
          <Selector
            {...props}
            value={f.rol}
            onChange={(e) => cambiar('rol', e.target.value as RolUsuario)}
          >
            {ROLES_CREABLES.map((rol) => (
              <option key={rol.valor} value={rol.valor}>
                {rol.texto}
              </option>
            ))}
          </Selector>
        )}
      </Campo>
      <Campo id="usr-nombre" etiqueta="Nombre completo" obligatorio error={errores.nombre}>
        {(props) => (
          <Entrada
            {...props}
            value={f.nombre}
            onChange={(e) => cambiar('nombre', e.target.value)}
          />
        )}
      </Campo>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="usr-username" etiqueta="Usuario" obligatorio error={errores.username}>
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
          id="usr-password"
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
      <div className="grid gap-4 sm:grid-cols-[14rem_1fr]">
        <Campo id="usr-tipo-doc" etiqueta="Tipo de documento">
          {(props) => (
            <Selector
              {...props}
              value={f.tipoDocumento}
              onChange={(e) => cambiar('tipoDocumento', e.target.value as TipoDocumento)}
            >
              {TIPOS_DOCUMENTO.map((tipo) => (
                <option key={tipo.valor} value={tipo.valor}>
                  {tipo.texto}
                </option>
              ))}
            </Selector>
          )}
        </Campo>
        <Campo
          id="usr-doc"
          etiqueta="Número de documento"
          obligatorio={f.rol === 'LIDER'}
          error={errores.documento}
          ayuda={
            f.rol === 'LIDER' ? 'Obligatorio para un líder y no puede repetirse.' : 'Opcional.'
          }
        >
          {(props) => (
            <Entrada
              {...props}
              value={f.numeroDocumento}
              onChange={(e) => cambiar('numeroDocumento', e.target.value)}
            />
          )}
        </Campo>
      </div>

      {f.rol === 'LIDER' && (
        <fieldset className="space-y-4 rounded border border-black/15 p-4">
          <legend className="px-2 text-h6">Comunidad que representa</legend>
          <Campo id="usr-origen" etiqueta="Comunidad" error={errores.comunidad}>
            {(props) => (
              <Selector
                {...props}
                value={f.origenComunidad === 'nueva' ? 'nueva' : (f.comunidadId ?? '')}
                onChange={(e) => {
                  if (e.target.value === 'nueva') {
                    setF((a) => ({ ...a, origenComunidad: 'nueva', comunidadId: null }));
                  } else {
                    setF((a) => ({
                      ...a,
                      origenComunidad: 'existente',
                      comunidadId: e.target.value === '' ? null : Number(e.target.value),
                    }));
                  }
                }}
              >
                <option value="nueva">Crear una comunidad nueva</option>
                <option value="">Elegir una existente sin líder</option>
                {sinLider.map((comunidad) => (
                  <option key={comunidad.id} value={comunidad.id}>
                    {comunidad.nombre}
                  </option>
                ))}
              </Selector>
            )}
          </Campo>
          {f.origenComunidad === 'nueva' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo id="usr-com-nombre" etiqueta="Nombre de la comunidad" obligatorio>
                {(props) => (
                  <Entrada
                    {...props}
                    value={f.comunidadNombre}
                    onChange={(e) => cambiar('comunidadNombre', e.target.value)}
                  />
                )}
              </Campo>
              <Campo id="usr-com-tipo" etiqueta="Tipo" obligatorio>
                {(props) => (
                  <Selector
                    {...props}
                    value={f.comunidadTipo}
                    onChange={(e) => cambiar('comunidadTipo', e.target.value as TipoComunidad)}
                  >
                    {TIPOS_COMUNIDAD.map((tipo) => (
                      <option key={tipo.valor} value={tipo.valor}>
                        {tipo.texto}
                      </option>
                    ))}
                  </Selector>
                )}
              </Campo>
              <Campo id="usr-com-barrio" etiqueta="Barrio" obligatorio>
                {(props) => (
                  <Entrada
                    {...props}
                    value={f.comunidadBarrio}
                    onChange={(e) => cambiar('comunidadBarrio', e.target.value)}
                  />
                )}
              </Campo>
              <Campo id="usr-com-tel" etiqueta="Teléfono de contacto" obligatorio>
                {(props) => (
                  <Entrada
                    {...props}
                    type="tel"
                    value={f.comunidadTelefono}
                    onChange={(e) => cambiar('comunidadTelefono', e.target.value)}
                  />
                )}
              </Campo>
              <Campo
                id="usr-com-correo"
                etiqueta="Correo de contacto"
                obligatorio
                className="sm:col-span-2"
              >
                {(props) => (
                  <Entrada
                    {...props}
                    type="email"
                    value={f.comunidadCorreo}
                    onChange={(e) => cambiar('comunidadCorreo', e.target.value)}
                  />
                )}
              </Campo>
            </div>
          )}
        </fieldset>
      )}

      {errorEnvio && <Alerta tipo="error">{errorEnvio}</Alerta>}
      <Boton type="submit" cargando={enviando} className="w-full sm:w-auto">
        Crear usuario
      </Boton>
    </form>
  );
}

function FormularioEdicion({ usuario, alTerminar }: { usuario: Usuario; alTerminar: () => void }) {
  const [nombre, setNombre] = useState(usuario.nombre);
  const [tipo, setTipo] = useState<TipoDocumento>(usuario.tipo_documento ?? 'CC');
  const [numero, setNumero] = useState(usuario.numero_documento ?? '');
  const [password, setPassword] = useState('');
  const [errores, setErrores] = useState<{
    nombre?: string;
    documento?: string;
    password?: string;
  }>({});
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const nuevos: typeof errores = {};
    if (nombre.trim() === '') {
      nuevos.nombre = 'Escribe el nombre completo.';
    }
    if ((usuario.rol === 'LIDER' || numero.trim() !== '') && validarDocumento(numero)) {
      nuevos.documento = validarDocumento(numero) ?? undefined;
    }
    if (password !== '' && password.length < 8) {
      nuevos.password = 'La contraseña debe tener al menos 8 caracteres.';
    }
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) {
      return;
    }
    setEnviando(true);
    setErrorEnvio(null);
    try {
      await editarUsuario(usuario.id, {
        nombre: nombre.trim(),
        ...(numero.trim() !== '' ? { tipo_documento: tipo, numero_documento: numero.trim() } : {}),
        ...(password !== '' ? { password } : {}),
      });
      alTerminar();
    } catch (error) {
      setErrorEnvio(mensajeError(error, 'No pudimos guardar los cambios. Inténtalo de nuevo.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-4">
      <Campo id="edt-nombre" etiqueta="Nombre completo" obligatorio error={errores.nombre}>
        {(props) => (
          <Entrada {...props} value={nombre} onChange={(e) => setNombre(e.target.value)} />
        )}
      </Campo>
      <div className="grid gap-4 sm:grid-cols-[14rem_1fr]">
        <Campo id="edt-tipo" etiqueta="Tipo de documento">
          {(props) => (
            <Selector
              {...props}
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoDocumento)}
            >
              {TIPOS_DOCUMENTO.map((t) => (
                <option key={t.valor} value={t.valor}>
                  {t.texto}
                </option>
              ))}
            </Selector>
          )}
        </Campo>
        <Campo id="edt-doc" etiqueta="Número de documento" error={errores.documento}>
          {(props) => (
            <Entrada {...props} value={numero} onChange={(e) => setNumero(e.target.value)} />
          )}
        </Campo>
      </div>
      <Campo
        id="edt-password"
        etiqueta="Nueva contraseña"
        ayuda="Déjala vacía para no cambiarla."
        error={errores.password}
      >
        {(props) => (
          <Entrada
            {...props}
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}
      </Campo>
      {errorEnvio && <Alerta tipo="error">{errorEnvio}</Alerta>}
      <Boton type="submit" cargando={enviando} className="w-full sm:w-auto">
        Guardar cambios
      </Boton>
    </form>
  );
}

export default function PaginaUsuarios() {
  useTitulo('Usuarios');
  const usuarios = useCarga(listarUsuarios, []);
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const columnas: Columna<Usuario>[] = [
    { clave: 'nombre', titulo: 'Nombre', celda: (u) => u.nombre },
    { clave: 'username', titulo: 'Usuario', celda: (u) => u.username },
    {
      clave: 'rol',
      titulo: 'Rol',
      celda: (u) => <Etiqueta tono="exito">{NOMBRE_ROL[u.rol]}</Etiqueta>,
    },
    {
      clave: 'documento',
      titulo: 'Documento',
      celda: (u) =>
        u.numero_documento ? `${u.tipo_documento} ${u.numero_documento}` : 'Sin documento',
    },
    { clave: 'comunidad', titulo: 'Comunidad', celda: (u) => u.comunidad_nombre ?? '' },
    {
      clave: 'acciones',
      titulo: 'Acción',
      celda: (u) => (
        <Boton tamano="pequeno" variante="secundario" onClick={() => setEditando(u)}>
          Editar
        </Boton>
      ),
    },
  ];

  return (
    <div className="contenedor py-10">
      <EncabezadoPagina
        titulo="Usuarios"
        descripcion="Cuentas del personal. Cada líder representa a una comunidad y necesita documento."
        acciones={<Boton onClick={() => setCreando(true)}>Crear usuario</Boton>}
      />
      {aviso && (
        <Alerta tipo="exito" className="mb-6" alCerrar={() => setAviso(null)}>
          {aviso}
        </Alerta>
      )}
      {usuarios.error ? (
        <ErrorCarga titulo="No pudimos cargar los usuarios" alReintentar={usuarios.recargar} />
      ) : (
        <Tabla
          columnas={columnas}
          filas={usuarios.datos ?? []}
          claveFila={(u) => u.id}
          descripcion="Usuarios del sistema"
          cargando={usuarios.cargando}
          vacio={<p className="text-tinta-suave">Todavía no hay usuarios.</p>}
        />
      )}

      <Modal abierto={creando} titulo="Crear usuario" alCerrar={() => setCreando(false)}>
        {creando && (
          <FormularioNuevo
            alTerminar={() => {
              setCreando(false);
              setAviso('Creamos el usuario.');
              usuarios.recargar();
            }}
          />
        )}
      </Modal>
      <Modal abierto={editando !== null} titulo="Editar usuario" alCerrar={() => setEditando(null)}>
        {editando && (
          <FormularioEdicion
            key={editando.id}
            usuario={editando}
            alTerminar={() => {
              setEditando(null);
              setAviso('Guardamos los cambios.');
              usuarios.recargar();
            }}
          />
        )}
      </Modal>
    </div>
  );
}
