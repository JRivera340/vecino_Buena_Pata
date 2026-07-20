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

## Correr los tests del backend

```bash
docker compose exec backend pytest -v
```

Los tests usan la misma base de datos configurada por `DATABASE_URL` y limpian las tablas que tocan al terminar. Por eso deben correrse **antes** de cargar el seed, no después: si ya hay datos semilla cargados, los tests pueden chocar con usuarios existentes y el fixture de tests puede vaciar tablas que la aplicación está usando. Orden recomendado: migrar, correr tests, luego cargar el seed para trabajar con datos de demostración.

Después de correr los tests, la tabla `alembic_version` queda marcada como si estuviera al día pero las tablas de dominio ya no existen (el fixture las borró). Un `alembic upgrade head` normal no hace nada en ese caso porque Alembic cree que ya aplicó la migración.

La receta para restaurar el esquema depende de si las tablas siguen existiendo físicamente o no:

- **Si las tablas ya fueron borradas** (justo después de correr los tests): `alembic stamp base` seguido de `alembic upgrade head` funciona, porque no hay nada que limpiar.
- **Si las tablas siguen presentes con datos** (por ejemplo, después de correr un script manual que usó `Base.metadata.create_all` en vez de las migraciones): ese mismo comando falla con `type "..." already exists`, porque `stamp` solo reescribe el registro de versión, nunca ejecuta DDL.

La receta que funciona en ambos casos, sin necesitar saber cuál es el estado actual:

```bash
docker compose exec backend alembic stamp head
docker compose exec backend alembic downgrade base
docker compose exec backend alembic upgrade head
```

`stamp head` resincroniza el registro de versión con la migración real del proyecto, `downgrade base` ejecuta el DROP real (tablas y tipos ENUM) sin importar si ya estaban vacías o no, y `upgrade head` recrea el esquema limpio.
