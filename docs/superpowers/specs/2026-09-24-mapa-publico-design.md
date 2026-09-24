# Mapa publico de Vecinos Buena Pata activos

Fecha: 2026-09-24
Estado: pendiente de revision

## Objetivo

Cualquier persona, sin cuenta, debe poder abrir el sitio, ver en un mapa los
animales en estado VBP_ACTIVO y consultar la hoja de vida publica de cada uno.
Hoy eso no es posible: la ruta `/` exige sesion, el unico acceso sin sesion es
`/v/:codigo` (escaneo del QR del collar) y no existe un endpoint que liste
animales sin autenticacion.

## Alcance

Incluye:

- Endpoints publicos de lectura para el mapa y la hoja de vida.
- Ubicacion aproximada de cada animal (proteccion del domicilio del cuidador).
- Vista publica del mapa en `/` y de la hoja de vida en `/vbp/:id`.
- Reubicacion del mapa de gestion actual en `/mapa`.

No incluye (se trata en un spec aparte):

- Mejoras funcionales del flujo interno (validacion, formalizacion, reportes,
  permisos de `crear_comunidad`, estados de reporte sin uso, entre otras).
- Formulario de reporte desde el mapa publico.
- Agrupacion de marcadores con plugins de clustering.
- Busqueda geografica, compartir en redes o SEO.

## Decisiones tomadas

| Tema | Decision |
|---|---|
| Precision de la ubicacion publica | Aproximada, ajustada a una cuadricula de 0.003 grados (unos 330 m), calculada en el backend |
| Contenido de la hoja de vida publica | Ficha basica y salud resumida, sin observaciones libres ni datos internos |
| Identificador en el mapa | `id` del animal; el `codigo` del collar no se expone nunca fuera del QR |
| Reportes de novedad | Siguen dependiendo del `codigo` del QR; la hoja de vida publica no los ofrece |

Justificacion de no exponer el `codigo`: es la unica proteccion de
`POST /publico/animales/{codigo}/reportes`. Si el mapa lo listara, cualquiera
podria crear reportes falsos sobre cualquier animal.

## Backend

Sigue la convencion del proyecto: la logica vive en `services/`, el router solo
orquesta.

### Servicio `backend/app/services/mapa_publico.py`

- `aproximar_coordenada(valor: float) -> float`: funcion pura. Devuelve el
  centro de la celda de 0.003 grados que contiene `valor`, es decir
  `floor(valor / 0.003) * 0.003 + 0.0015`, redondeado a 6 decimales. Es
  determinista: la misma entrada da siempre la misma salida. No se usa ruido
  aleatorio porque promediando varias consultas se recuperaria el punto real.
- `listar_mapa_publico(db)`: devuelve los animales con estado `VBP_ACTIVO` cuyo
  collar existe y tiene `activo = True`, ordenados por `id` ascendente, con
  coordenadas aproximadas.
- `obtener_hoja_vida_publica(db, animal_id)`: devuelve la hoja de vida publica
  del animal, o `None` si no existe, no esta en `VBP_ACTIVO` o su collar esta
  inactivo o ausente.

### Endpoints en `backend/app/routers/publico.py` (sin autenticacion)

| Metodo y ruta | Respuesta |
|---|---|
| `GET /api/v1/publico/mapa` | Lista de `AnimalMapaPublicoSchema`. Cabecera `Cache-Control: public, max-age=60` |
| `GET /api/v1/publico/animales/{animal_id}/hoja-vida` | `HojaVidaPublicaSchema`. 404 si el servicio devuelve `None` |

`animal_id` es un entero; si el valor no lo es, FastAPI responde 422. La ruta
no se confunde con `GET /publico/animales/{codigo}` porque tiene un segmento
adicional (`hoja-vida`).

### Schemas en `backend/app/schemas/publico.py`

`AnimalMapaPublicoSchema`:

- `id`, `nombre`, `especie`, `foto_principal`, `barrio`
- `latitud`, `longitud` (aproximadas)

`HojaVidaPublicaSchema`:

- `id`, `nombre`, `especie`, `sexo`, `tamano`, `edad_estimada`, `descripcion`,
  `foto_principal`, `barrio`, `fecha_inscripcion`
- `esterilizado: bool`
- `tiene_microchip: bool` (el numero no se expone)
- `ultima_visita: UltimaVisitaPublica | None`, con `fecha`, `estado_salud` y
  `peso_kg`. No incluye responsable, comportamiento, observaciones ni foto de la
  visita.

Ningun schema publico incluye `inscrito_por`, `comunidad_id`, `codigo` del
collar, numero de microchip, coordenadas exactas ni historial.

### Cambio en el endpoint existente del QR

`GET /publico/animales/{codigo}` deja de devolver `latitud` y `longitud`. La
pagina `/v/:codigo` no las usa. Se eliminan de `AnimalPublicoSchema` y de la
interfaz `AnimalPublico` del frontend. Sin este cambio la privacidad del mapa
se podria saltar por el endpoint del QR.

## Frontend

### Rutas (`frontend/src/app/app.routes.ts`)

| Ruta | Componente | Guard |
|---|---|---|
| `/` | `MapaPublicoComponent` | ninguno |
| `/vbp/:id` | `HojaVidaPublicaComponent` | ninguno |
| `/v/:codigo` | `AnimalPublicoComponent` (sin cambios de comportamiento) | ninguno |
| `/mapa` | `MapaComponent` (mapa de gestion actual) | `authGuard` |

Se retargetan de `/` a `/mapa` los cinco puntos que hoy apuntan a la raiz:

- `core/auth/login/login.component.ts` (navegacion tras iniciar sesion)
- `core/auth/rol.guard.ts` (redireccion por rol no permitido)
- `features/animales/inscribir-animal.component.ts` (navegacion tras inscribir)
- `shared/encabezado/encabezado.component.html`: enlace de la marca y enlace
  "Mapa"

### Encabezado

Para el visitante sin sesion muestra solo la marca (enlace a `/`) y un enlace
"Ingresar" hacia `/ingreso`. Con sesion se mantiene el encabezado actual.

### Componentes nuevos (en `features/publico/`)

`MapaPublicoComponent`:

- Reutiliza `MapaTerritorioComponent` sin modificarlo. Es el unico componente de
  mapa del proyecto.
- Todos los marcadores usan `estadoVisual('VBP_ACTIVO')`; no se duplica la
  logica de color e icono.
- Al hacer clic en un marcador se abre un panel con foto, nombre, especie,
  barrio y el enlace "Ver hoja de vida" a `/vbp/:id`.
- Filtros: busqueda por nombre, especie y barrio.
- Estados de pantalla: cargando, sin animales ("Aun no hay animales activos en
  el mapa") y error de red mediante el interceptor y el banner globales ya
  existentes.

`HojaVidaPublicaComponent`:

- Muestra la ficha y la salud resumida definidas arriba.
- No incluye formulario de reporte. Muestra la indicacion "Para reportar una
  novedad, escanea el QR del collar".
- Si el backend responde 404 muestra "Este animal no esta disponible".

### Logica pura (`.lib.ts`, sin dependencias de Angular)

- `filtrar-mapa-publico.lib.ts`: filtra por texto (insensible a mayusculas y
  tildes), especie y barrio.
- `separar-marcadores.lib.ts`: agrupa marcadores con la misma latitud y
  longitud (es lo esperado, porque las coordenadas salen ajustadas a la
  cuadricula) y, para grupos de `n > 1`, los reparte sobre un circulo de 0.0006
  grados de radio (unos 65 m) alrededor del centro de la celda, con angulo
  `2 * pi * i / n` segun el orden de `id`. Grupos de un solo marcador no se
  modifican.

### Servicio y modelos

- `core/publico/publico.service.ts` agrega `listarMapa()` y
  `obtenerHojaVida(id)`.
- Modelos nuevos en `core/models/` para el elemento del mapa y la hoja de vida
  publica.

## Pruebas

Backend (cada regla de negocio tiene al menos un caso):

- `aproximar_coordenada`: determinista, cae en el centro de la celda, valores
  negativos correctos, dos puntos de la misma celda dan el mismo resultado.
- El mapa solo incluye `VBP_ACTIVO` con collar activo; excluye candidatos, en
  proceso, perdidos, adoptados, fallecidos y collares inactivos.
- El mapa no contiene `codigo`, `inscrito_por`, `comunidad_id` ni el numero de
  microchip, y las coordenadas no son las exactas.
- Cabecera `Cache-Control` presente en `GET /publico/mapa`.
- Hoja de vida: 404 para animal inexistente, no activo o con collar inactivo;
  `tiene_microchip` refleja la presencia del numero sin exponerlo;
  `ultima_visita` toma la mas reciente y es `null` si no hay visitas.
- `GET /publico/animales/{codigo}` ya no incluye `latitud` ni `longitud`.

Frontend:

- Specs de `filtrar-mapa-publico.lib.ts` y `separar-marcadores.lib.ts`.
- Spec del servicio con los dos metodos nuevos.

## Riesgos y puntos abiertos

- Infraestructura de pruebas del backend: `tests/conftest.py` usa el motor real
  de Postgres y crea y elimina todas las tablas, por lo que exige una base
  local. El equipo dejo de usar Docker. El plan debe definir donde se ejecutan
  estas pruebas sin apuntar nunca a la base de produccion.
- Fotos: `/media` se sirve sin autenticacion y los nombres son UUID. No cambia
  con este spec; las fotos de animales no publicos solo son accesibles si se
  conoce su URL.
- Celdas con muchos animales: el circulo de separacion asume pocos animales por
  celda de 330 m. Si una celda superara unas decenas, habria que revisar la
  agrupacion.
- Segundo spec pendiente: mejoras funcionales del flujo interno.
