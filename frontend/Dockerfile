FROM node:20-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# Railway inyecta las variables del servicio como build-args, pero Angular
# no lee variables de entorno en tiempo de build por si solo — se sustituyen
# los placeholders del environment de produccion antes de compilar.
ARG API_BASE_URL
ARG MEDIA_BASE_URL
RUN sed -i \
    -e "s#__API_BASE_URL__#${API_BASE_URL}#" \
    -e "s#__MEDIA_BASE_URL__#${MEDIA_BASE_URL}#" \
    src/environments/environment.prod.ts

RUN npx ng build --configuration production

FROM nginx:alpine
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
# Railway asigna el puerto en runtime via $PORT, no siempre 80 -- el
# entrypoint oficial de la imagen sustituye ${PORT} en el template con
# envsubst antes de arrancar. ENV da un valor por defecto para correr
# el contenedor localmente sin Railway.
ENV PORT=8080
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
