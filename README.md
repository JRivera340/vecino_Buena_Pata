# Vecino Buena Pata

Programa de la Alcaldía Local de Santa Fe, con el Observatorio de Protección y Bienestar Animal (PYBA), para conocer, cuidar y acompañar a los perros y gatos que viven en los barrios. Las comunidades inscriben a los animales, un veterinario los valida, un líder los formaliza con un collar de código QR y el equipo les hace seguimiento. Cualquier persona puede ver en un mapa público a los Vecinos Buena Pata activos y reportar una novedad escaneando el QR del collar.

Desarrollado por: Jairo Julian Rivera y Joshua Rivera.

## Cómo está armado

- `backend/`: API en FastAPI con SQLAlchemy y PostgreSQL. La lógica de negocio vive en `app/services/`.
- `frontend/`: aplicación en React con TypeScript, Vite y Tailwind. La lógica pura vive en archivos `.lib.ts`.
- Las fotos se guardan en Cloudflare R2 cuando están las variables `R2_*`; sin ellas se usa la carpeta local `media/`.

## Levantar el proyecto en local

Con Docker:

```bash
docker compose up --build
docker compose exec backend python -m app.seed
docker compose exec backend python -m app.seed.cargar_demo
```

- Aplicación: `http://localhost:4200`
- API: `http://localhost:8000` (documentación en `/docs`)

Usuarios de prueba, todos con la contraseña `vbp2026`: `maria.comunidad`, `dr.rojas`, `lider.campo`, `unidad.especial` y `admin`.

Sin Docker, el frontend se levanta con `cd frontend && npm install && npm run dev` y apunta por defecto a la API en `http://localhost:8000`.

## Datos de demostración

`python -m app.seed.cargar_demo` deja cuatro animales, cada uno en una etapa distinta: un Vecino Buena Pata activo con visita de seguimiento, uno en proceso con un pendiente, un candidato y uno perdido. Se puede repetir sin duplicar; con `--rehacer` los reemplaza.

## Fotos en Cloudflare R2

Para guardar las fotos en un bucket de R2, el backend necesita estas variables:

| Variable | Qué es |
|---|---|
| `R2_ENDPOINT_URL` | `https://<id-de-cuenta>.r2.cloudflarestorage.com` |
| `R2_BUCKET` | Nombre del bucket |
| `R2_ACCESS_KEY_ID` | Clave de acceso del token de R2 |
| `R2_SECRET_ACCESS_KEY` | Secreto del token de R2 |

El bucket debe tener acceso público (dominio propio o `r2.dev`), y esa URL es la que va en el argumento `MEDIA_BASE_URL` al construir el frontend.

## Correos de confirmación

Cada inscripción genera dos correos: uno a la persona que inscribió (con el radicado) y otro al equipo de IDPYBA con el enlace a la ficha interna. Se envían en segundo plano y cada intento queda en la tabla `notificacion`, así que un fallo del proveedor nunca tumba la inscripción. Un animal inscrito por el personal solo genera el aviso a IDPYBA.

| Variable | Qué es |
|---|---|
| `MAIL_PROVIDER` | `resend` (por defecto) |
| `MAIL_API_KEY` | Clave de API del proveedor |
| `MAIL_FROM` | Remitente verificado, por ejemplo `Vecino Buena Pata <no-responder@midominio.com>` |
| `NOTIFY_IDPYBA_EMAIL` | Correo que recibe el aviso de cada animal nuevo |

Railway bloquea el SMTP saliente en los planes Trial, Free y Hobby, por eso se usa un proveedor por API HTTPS. Si faltan las variables, la notificación queda como fallida con el motivo; una vez configuradas, `python -m app.services.reintentar_notificaciones` reenvía las pendientes.

## Pruebas

Frontend:

```bash
cd frontend
npm run lint && npm run type-check && npm run test && npm run build
```

Backend: las pruebas borran todas las tablas de la base con la que corren, por eso exigen la variable `VBP_TEST_DATABASE_URL` apuntando a una base cuyo nombre termine en `_test`. Si no está definida, o el nombre no termina en `_test`, la corrida se aborta. Nunca apuntarla a la base de la aplicación ni a la de producción.

```bash
cd backend
VBP_TEST_DATABASE_URL=postgresql+psycopg://vbp:vbp@localhost:5432/vbp_test python -m pytest -q
```

Con Docker Compose:

```bash
docker compose exec db createdb -U vbp vbp_test
docker compose exec -e VBP_TEST_DATABASE_URL=postgresql+psycopg://vbp:vbp@db:5432/vbp_test backend pytest -q
```

El flujo `.github/workflows/pruebas.yml` corre ambas suites en cada push.

## Convenciones

Están en [CONTRIBUTING.md](CONTRIBUTING.md).
