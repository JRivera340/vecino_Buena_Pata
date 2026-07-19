# Convenciones del Proyecto

Este documento describe las convenciones que todo código, documentación y commits deben seguir.

## Lenguaje y Contenido

- Todo el dominio y UI en español (Colombia).
- Cero emojis en cualquier archivo (código, comentarios, commits, documentación, UI).
- Cero referencias a Claude, Anthropic, herramientas IA o generación automática en código, comentarios, commits o documentación.

## Componentes y UI

- Un solo componente de mapa reutilizable basado en Leaflet para toda vista que lo requiera.
- Prohibido crear mapas paralelos o componentes de mapa duplicados.
- Una única función pura `estadoVisual(animal)` como única fuente de verdad para el color e ícono del estado de un animal.
- Esta función será usada por mapa, listas y badges; prohibido duplicar esa lógica.

## Lógica de Negocio

- La lógica de negocio vive en `services/` (backend) y archivos `.lib.ts` (frontend) sin dependencias de Angular.
- Los routers y componentes únicamente orquestan la lógica.
- Toda la lógica de negocio debe tener tests.

## Diseño Visual

### Paleta de Colores

Variables CSS en `frontend/src/styles/tokens.scss`:

- Fondo: `#FAF6EF`
- Tinta: `#2E241D`
- Primario: `#C4552D`
- Secundario: `#5C7048`
- Ámbar: `#D9A036`
- Azul petróleo: `#3E6B75`
- Rojo ladrillo: `#A8362F`

### Tipografía

- Títulos: Fraunces (serif)
- Cuerpo: Inter (sans)

## Estructura de Carpetas

Monorepo con estructura:

```
backend/app/
  ├── core/
  ├── models/
  ├── schemas/
  ├── services/
  ├── routers/
  └── seed/

frontend/src/app/
  ├── core/
  ├── shared/
  └── features/
      ├── mapa/
      ├── animales/
      ├── validacion/
      ├── seguimiento/
      ├── reportes/
      └── publico/
```

## Control de Versiones

- Commits atómicos.
- Mensajes en imperativo.
- Sin referencias a IA en mensajes de commit.
