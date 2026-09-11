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
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
