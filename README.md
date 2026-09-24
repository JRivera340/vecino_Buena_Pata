# Vecino Buena Pata

Sistema de localización y seguimiento de perros callejeros en la Alcaldía de Santa Fe. Facilita a los vecinos reportar avistamientos, registrar ubicaciones y realizar seguimiento de animales en el territorio.

## Requisitos

- Docker
- Docker Compose

## Levantar el Proyecto

```bash
docker-compose up
```

El comando anterior iniciará todos los servicios del proyecto.

## URLs Resultantes

- Frontend: `http://localhost:4200`
- Backend: `http://localhost:8000`
- Documentación de API: `http://localhost:8000/docs`

## Migraciones y datos semilla

```bash
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.seed
```

Usuarios de prueba (contraseña `vbp2026` para todos): `maria.comunidad`, `dr.rojas`, `lider.campo`, `unidad.especial`, `admin`.

## Pruebas

Frontend: `cd frontend && npx ng test --watch=false`.

Backend: las pruebas borran todas las tablas de la base con la que corren, por eso exigen la variable `VBP_TEST_DATABASE_URL` apuntando a una base cuyo nombre termine en `_test` (por ejemplo `postgresql+psycopg://vbp:vbp@localhost:5432/vbp_test`). Si no está definida, o si el nombre no termina en `_test`, la corrida se aborta. Nunca apuntar esta variable a la base de la aplicación ni a la de producción.

```bash
cd backend
VBP_TEST_DATABASE_URL=postgresql+psycopg://vbp:vbp@localhost:5432/vbp_test python -m pytest -v
```

Con Docker Compose, se crea una base aparte dentro del mismo servicio `db` y se pasa la variable al contenedor:

```bash
docker compose exec db createdb -U vbp vbp_test
docker compose exec -e VBP_TEST_DATABASE_URL=postgresql+psycopg://vbp:vbp@db:5432/vbp_test backend pytest -v
```

Como las pruebas nunca tocan la base de la aplicación, ya no importa el orden entre correr las pruebas y cargar el seed.

El flujo `.github/workflows/pruebas.yml` corre ambas suites en cada push con un Postgres desechable.
