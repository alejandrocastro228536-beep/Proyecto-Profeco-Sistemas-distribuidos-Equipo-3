# ProFeCo en Docker

Orquestación de RabbitMQ + los 7 microservicios Quarkus.

El frontend Next.js sigue corriendo en el host (`npm run dev` en `profeco-frontend/`)
y se conecta vía localhost a los puertos expuestos.

## Requisitos

- Docker Desktop corriendo
- Cada microservicio ya compilado (`target/quarkus-app/` debe existir).
  Para recompilar después de tocar código Java:

  ```powershell
  cd ms-usuarios   # o el módulo que tocaste
  mvn package -DskipTests
  cd ..
  docker compose up -d --build ms-usuarios
  ```

## Comandos

```powershell
# Levantar todo (la primera vez tarda 3–5 min por las descargas)
docker compose up -d --build

# Ver el estado de los 8 contenedores
docker compose ps

# Ver logs de un servicio
docker compose logs -f api-gateway
docker compose logs -f ms-usuarios

# Detener todo (mantiene los volúmenes H2)
docker compose down

# Detener y borrar los datos H2 (reset total)
docker compose down -v

# Reconstruir un solo servicio después de un mvn package
docker compose up -d --build ms-productos
```

## Endpoints expuestos al host

| Puerto | Servicio | Para qué |
|---|---|---|
| 8080 | api-gateway | El frontend pega aquí (`NEXT_PUBLIC_API_URL`) |
| 8081 | ms-productos | Debug directo |
| 8082 | ms-tiendas | Debug directo |
| 8083 | ms-usuarios | Debug directo |
| 8084 | ms-reportes | Debug directo |
| 8085 | ms-notificaciones | **WebSocket** del frontend (`NEXT_PUBLIC_WS_URL`) |
| 8086 | ms-busqueda | Debug directo |
| 5672 | RabbitMQ AMQP | Broker |
| 15672 | RabbitMQ admin | http://localhost:15672 (guest/guest) |

## Red interna

Dentro de la red `profeco-net`, los servicios se hablan por nombre:

- `api-gateway` → `http://ms-usuarios:8083`, etc.
- `ms-busqueda` → `http://ms-productos:8081`, `http://ms-tiendas:8082`
- `ms-productos`, `ms-reportes`, `ms-notificaciones` → `amqp://guest:guest@rabbitmq:5672`

Estos overrides están en `docker-compose.yml` como variables de entorno
(Quarkus convierte automáticamente `quarkus.rest-client.foo-api.url` en
`QUARKUS_REST_CLIENT_FOO_API_URL`).

## Verificación rápida

```powershell
# Gateway responde
curl http://localhost:8080/api/status
# → {"gateway": "activo", "version": "1.0.0"}

# Crear un usuario de prueba
curl -X POST http://localhost:8080/api/auth/registro `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"yo@profeco.mx\",\"password\":\"test123\",\"nombre\":\"Yo\",\"rol\":\"CONSUMIDOR\"}'
# → {"mensaje": "Usuario registrado", "id": 1, "rol": "CONSUMIDOR"}

# Login (devuelve JWT)
curl -X POST http://localhost:8080/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"yo@profeco.mx\",\"password\":\"test123\"}'
# → {"token": "eyJ0..."}
```

## H2 persistente entre reinicios

Los 4 servicios con BD usan volúmenes nombrados (`usuarios-data`,
`tiendas-data`, `productos-data`, `reportes-data`). Eso preserva el archivo
H2 entre `docker compose down` y `up`.

**Sin embargo**, `ms-usuarios` (y otros) tienen
`quarkus.hibernate-orm.database.generation=drop-and-create` en su
`application.properties`. Esto borra el esquema al arrancar.

Si quieres que **los datos de verdad persistan**, descomenta esta línea en
el `docker-compose.yml`:

```yaml
ms-usuarios:
  environment:
    QUARKUS_HIBERNATE_ORM_DATABASE_GENERATION: update   # ← descomenta
```

(Y aplica la misma override a los otros servicios con BD si quieres.)

## Troubleshooting

- **"Bind for 0.0.0.0:8080 failed: port is already allocated"**
  Algún proceso del host está usando ese puerto. Mátalo o cambia el mapeo:
  `"18080:8080"` en el compose.

- **`ms-notificaciones` no recibe ofertas**
  Verifica que RabbitMQ esté `healthy`:
  ```powershell
  docker compose ps rabbitmq
  ```

- **`ms-busqueda` devuelve `[]` siempre**
  No hay productos aún. Crea uno:
  ```powershell
  curl -X POST http://localhost:8080/api/productos -H "Content-Type: application/json" -d '{\"nombre\":\"Leche 1L\",\"categoria\":\"Lacteos\",\"descripcion\":\"Entera\"}'
  ```
