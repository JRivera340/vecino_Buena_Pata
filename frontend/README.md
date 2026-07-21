# Vecino Buena Pata — Frontend

Aplicacion Angular del programa Vecino Buena Pata para la Alcaldia de Santa Fe.

## Ejecutar con Docker (recomendado)

Ver el `README.md` de la raiz del proyecto para levantar el stack completo (`docker compose up`). El frontend queda disponible en `http://localhost:4200`.

## Ejecutar el frontend solo

Requiere el backend corriendo por separado (ver `README.md` de la raiz).

```bash
npm install
npm start
```

El servidor de desarrollo queda en `http://localhost:4200`.

## Configuracion

La URL del backend esta fija en `src/environments/environment.ts` (`apiBaseUrl: 'http://localhost:8000/api/v1'`). No hay un archivo de entorno de produccion separado — el proyecto usa una unica configuracion para todos los builds.

## Iniciar sesion

Los usuarios de prueba (creados por el seed del backend, ver `README.md` de la raiz) usan la contrasena `vbp2026`:

- `maria.comunidad` — rol Comunidad
- `dr.rojas` — rol Veterinario
- `lider.campo` — rol Lider
- `unidad.especial` — rol Unidad especial
- `admin` — rol Administrador

Algunas rutas estan restringidas por rol: `/validacion` (Veterinario/Administrador), `/formalizacion` (Lider/Administrador), `/animales/inscribir` (Comunidad/Veterinario/Lider/Administrador). `/reportes` e `/indicadores` estan disponibles para cualquier usuario autenticado.

## Tests

```bash
ng test
```

Usa Vitest. Solo los archivos `.lib.ts` (logica pura) y `AuthService` tienen tests unitarios, siguiendo la convencion del proyecto de mantener la logica de negocio fuera de los componentes de Angular.

## Build de produccion

```bash
ng build
```
