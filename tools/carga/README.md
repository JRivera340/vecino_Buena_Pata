# Prueba de carga

Simula usuarios que navegan el mapa público y la ficha de un animal, más un grupo pequeño de personal que inicia sesión y consulta listados. La subida es escalonada y se corta sola si más del 1 % de las peticiones falla o si el p95 supera 1,5 s.

```bash
k6 run -e API_URL=https://<backend>/api/v1 -e USUARIOS_MAXIMOS=300 prueba.js
```

`PAUSA_SEGUNDOS` (8 por defecto) es el tiempo que cada usuario "lee" entre peticiones. Con esa pausa, cada usuario simultáneo genera cerca de 0,125 peticiones por segundo, así que los usuarios que soporta el sistema son aproximadamente las peticiones por segundo sostenidas multiplicadas por 8.

Para lanzarla desde Railway, crea un servicio temporal con este directorio, define `API_URL` con la dirección interna del backend y elimínalo al terminar.
