FROM node:20-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite no lee variables de entorno del servicio en tiempo de ejecucion, asi que
# las URLs del backend se sustituyen en el codigo antes de compilar.
ARG API_BASE_URL
ARG MEDIA_BASE_URL
RUN sed -i \
    -e "s#__API_BASE_URL__#${API_BASE_URL}#" \
    -e "s#__MEDIA_BASE_URL__#${MEDIA_BASE_URL}#" \
    src/core/entorno.ts

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
# Railway asigna el puerto en tiempo de ejecucion con $PORT. El entrypoint de
# la imagen sustituye ${PORT} en la plantilla; el valor por defecto permite
# correr el contenedor en local.
ENV PORT=8080
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
