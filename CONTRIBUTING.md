# Convenciones del proyecto

## Idioma y contenido

- El dominio y toda la interfaz van en español de Colombia, con tildes y eñes.
- Sin emojis en el código, los comentarios, los commits, la documentación ni la interfaz. Los iconos son SVG.
- Los textos se escriben en voz directa y cercana: dicen qué pasó y qué hacer, sin frases de relleno.

## Interfaz

- Hay un solo componente de mapa, `shared/mapa/MapaTerritorio`, basado en Leaflet. No se crean mapas paralelos.
- El color y el icono del estado de un animal salen únicamente de `estadoVisual` (`shared/estado-visual`). Mapa, listas y etiquetas la usan; no se duplica esa lógica.
- El color del estado nunca es la única señal: siempre va con texto e icono.
- Accesibilidad AA: contraste de 4,5:1 para texto normal, foco visible, objetivos táctiles de 44 px en móvil, `prefers-reduced-motion` respetado.

## Diseño visual

Sigue la identidad del Observatorio PYBA. Las variables viven en `frontend/tailwind.config.ts` y `frontend/src/index.css`.

- Verde primario `#719d15`, verde oscuro `#5f8910`, verde profundo `#55711f`, azul `#0345bf`, texto `#252525` y fondo `#fafafa`.
- `#719d15` no alcanza contraste AA con texto blanco. Los botones y encabezados de tabla usan `#55711f`; el verde claro queda para superficies grandes, bordes, iconos y acentos.
- Tipografía del sistema (`system-ui`), escala de 4 px, radios de 4, 8 y 12 px.

## Lógica de negocio

- Backend: la lógica vive en `app/services/`. Los routers solo orquestan.
- Frontend: la lógica vive en archivos `.lib.ts` sin dependencias de React. Los componentes y páginas solo orquestan.
- Toda la lógica de negocio lleva pruebas.

## Estructura

```
backend/app/
  core/  models/  schemas/  services/  routers/  seed/

frontend/src/
  core/        api, sesión, formato y modelos
  shared/      componentes de interfaz, layout y mapa
  features/    publico, mapa, animales, validacion, formalizacion,
               seguimiento, reportes, indicadores
```

## Control de versiones

- Commits atómicos, en imperativo, de una sola línea.
- Antes de subir: `npm run lint`, `npm run type-check`, `npm run test` y `npm run build` en el frontend, y `pytest` en el backend.
