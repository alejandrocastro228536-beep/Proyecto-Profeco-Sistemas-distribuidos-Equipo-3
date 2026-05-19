# ProFeCo — Plataforma distribuida de comparación de precios

ProFeCo es una plataforma inspirada en el programa **"Quién es Quién en los
Precios"** de la PROFECO mexicana. Permite a los consumidores comparar precios
entre supermercados, mercados y tianguis; reportar inconsistencias entre el
precio publicado y el cobrado; recibir alertas de ofertas en tiempo real;
y a la PROFECO sancionar tiendas que acumulan reportes.

Proyecto académico de la materia **Sistemas Distribuidos** — Equipo 3.

---

## Tabla de contenidos

- [Problema que resuelve](#problema-que-resuelve)
- [Funcionalidades](#funcionalidades)
- [Arquitectura](#arquitectura)
- [Stack tecnológico](#stack-tecnológico)
- [Inicio rápido](#inicio-rápido)
- [Servicios y puertos](#servicios-y-puertos)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Datos de prueba](#datos-de-prueba)
- [Ver los datos en la base](#ver-los-datos-en-la-base)
- [API (resumen)](#api-resumen)
- [Frontend (rutas)](#frontend-rutas)
- [Roles y permisos](#roles-y-permisos)
- [Mecánica de sanciones](#mecánica-de-sanciones)
- [Comandos útiles](#comandos-útiles)
- [Troubleshooting](#troubleshooting)
- [Equipo](#equipo)

---

## Problema que resuelve

En México, los consumidores tienen pocas herramientas para:
- Comparar precios de la misma canasta básica entre tiendas
- Saber dónde hay ofertas el día de hoy
- Reportar formalmente cuando una tienda cobra distinto al precio anunciado
- Pedir a una tienda que ofrezca un producto que no maneja

ProFeCo unifica todo esto en una sola plataforma, conectando a tres actores:

| Actor | Necesidad |
|---|---|
| **Consumidor** | Comparar precios, encontrar ofertas, reportar abusos |
| **Tienda** (supermercado / mercado / tianguis) | Publicar precios y promociones, atender peticiones de clientes |
| **PROFECO** | Vigilar inconsistencias, moderar reportes, aplicar sanciones |

---

## Funcionalidades

### Para el consumidor
- **Búsqueda por nombre de producto** y comparador "Quién es Quién en los Precios" en todas las tiendas registradas
- **Catálogo navegable** por categorías (Lácteos, Básicos, Carnes, Verduras, Frutas, Bebidas, Aceites, Limpieza)
- **Lista del súper** y productos / tiendas favoritas (preferencias)
- **Reporte de inconsistencias** entre el precio publicado y el cobrado en caja
- **Reseñas** (1–5 estrellas + comentario) a las tiendas que ya visitó
- **Wishlist**: pedirle a una tienda que comience a ofrecer un producto específico
- **Feed de ofertas en tiempo real** vía WebSocket — se actualiza al instante cuando una tienda publica una promoción

### Para la tienda
- **Alta y mantenimiento de productos y precios** propios
- **Publicación de ofertas** que se difunden automáticamente a todos los consumidores conectados (RabbitMQ fanout)
- **Panel con estadísticas** de reportes recibidos y reseñas
- **Bandeja de wishlist** de los consumidores y posibilidad de marcarlas como atendidas / rechazadas
- **Apelación de sanciones** aplicadas por la PROFECO

### Para la PROFECO (admin)
- **Bandeja unificada de reportes** de inconsistencias, con filtros por tienda y estado
- **Generación automática de sanciones**: cuando una tienda acumula 3+ reportes pendientes, el sistema crea una alerta que se sanciona escalonadamente (ver [Mecánica de sanciones](#mecánica-de-sanciones))
- **Aplicación / apelación** de sanciones (advertencia, multa menor, multa mayor)
- **Moderación de reseñas** y vista global de wishlist

---

## Arquitectura

Microservicios Quarkus desacoplados por dominio, base de datos por servicio
y mensajería asíncrona para los eventos de tiempo real.

```
                   Next.js (host :3000)
                          │
                          ▼
   ┌──────────────────────────────────────────────────┐
   │   Traefik :8080  (round-robin api-gateway × N)   │
   └──────────────────────────────────────────────────┘
                          │
        ┌─────────────────┴──────────────────┐
        ▼                                    ▼
  api-gateway (Quarkus, JWT)         ms-notificaciones :8085
        │                                  (WebSocket directo)
        │  REST clients                            ▲
        ▼                                          │
  ┌──────────────┬──────────────┬──────────────┬───┴──────────┐
  ms-usuarios   ms-tiendas   ms-productos   ms-reportes   ms-busqueda
     :8083        :8082         :8081          :8084         :8086
        │            │             │              │
        ▼            ▼             ▼              ▼
  ┌──────────────────────────────────────────────────────────┐
  │             PostgreSQL :5433  (4 databases)              │
  │   usuariosdb · tiendasdb · productosdb · reportesdb      │
  └──────────────────────────────────────────────────────────┘

  ms-productos  ──ofertas──►   RabbitMQ   ──►  ms-notificaciones
  ms-reportes   ──alertas──►    :5672                 │
                                                      ▼
                                                 WebSocket
```

### Decisiones de diseño

- **API Gateway único** con JWT: el frontend solo conoce `http://localhost:8080`. El gateway valida el token, decide el rol y enruta.
- **Database per service**: cada microservicio dueño de su esquema (`usuariosdb`, `tiendasdb`, `productosdb`, `reportesdb`). No hay JOINs entre servicios — la denormalización (`nombre_tienda`, `nombre_producto` repetidos en `reporte` y `resena`) es intencional.
- **RabbitMQ fanout** para eventos: cuando una tienda publica una oferta, `ms-productos` la emite y `ms-notificaciones` la difunde a todos los WebSockets conectados. Lo mismo para alertas de inconsistencia cuando se rebasa el umbral de reportes.
- **Traefik delante del gateway** habilita escalado horizontal: `docker compose up -d --scale api-gateway=3` levanta 3 réplicas y Traefik balancea round-robin.
- **JWT firmado con RSA-2048**: `ms-usuarios` firma con la clave privada; el gateway verifica con la pública. Las claves están embebidas en `application.properties` para simplificar la demo.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Java 17 · **Quarkus 3** · Hibernate ORM + Panache · MicroProfile JWT · SmallRye RabbitMQ |
| Base de datos | **PostgreSQL 16** (4 schemas, uno por microservicio) |
| Mensajería | **RabbitMQ 3** (fanout exchanges) |
| Gateway | Quarkus REST Client + **Traefik 3** (load balancing) |
| Frontend | **Next.js 14** (App Router, Server Components) · React 18 · TypeScript · Tailwind CSS · TanStack Query |
| Auth | JWT RSA-2048 + BCrypt para contraseñas |
| Orquestación | Docker Compose |

---

## Inicio rápido

### Requisitos

- Docker Desktop corriendo
- Maven 3.9+ y Java 17 (para recompilar los microservicios)
- Node 20+ y `npm` (para el frontend)
- PowerShell (Windows) o bash (Linux/Mac)

### 1. Configura el password de Postgres

Crea un archivo `.env` en la raíz del repo:

```env
DB_PASSWORD=tu_password_aqui
```

### 2. Levanta el backend

Cada microservicio ya viene compilado (`target/quarkus-app/` existe en el repo).
Si no, antes del primer arranque:

```powershell
mvn -f ms-usuarios package -DskipTests
mvn -f ms-tiendas package -DskipTests
mvn -f ms-productos package -DskipTests
mvn -f ms-reportes package -DskipTests
mvn -f ms-notificaciones package -DskipTests
mvn -f ms-busqueda package -DskipTests
mvn -f api-gateway package -DskipTests
```

Después:

```powershell
docker compose up -d --build
docker compose ps              # los 10 contenedores deben estar Up / healthy
```

La primera vez tarda 3–5 minutos por las descargas de imágenes.

### 3. Carga datos de prueba (opcional pero recomendado)

```powershell
.\docker\seed.ps1
```

Esto carga ~150 filas coherentes en las 4 bases. Idempotente. Ver
[Datos de prueba](#datos-de-prueba).

### 4. Levanta el frontend

```powershell
cd profeco-frontend
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

---

## Servicios y puertos

| Puerto host | Servicio | Para qué |
|---|---|---|
| **3000** | `profeco-frontend` (en el host) | UI principal |
| **8080** | `traefik` → `api-gateway` | API pública (lo que consume el frontend) |
| 8090 | `traefik` dashboard | http://localhost:8090 |
| 8081 | `ms-productos` | Debug directo |
| 8082 | `ms-tiendas` | Debug directo |
| 8083 | `ms-usuarios` | Debug directo (login/registro) |
| 8084 | `ms-reportes` | Debug directo |
| **8085** | `ms-notificaciones` | **WebSocket** del frontend |
| 8086 | `ms-busqueda` | Debug directo |
| **5433** | PostgreSQL | host:5433 → container:5432 |
| 5672 | RabbitMQ AMQP | Broker |
| 15672 | RabbitMQ admin UI | http://localhost:15672 (guest/guest) |

En la red interna `profeco-net`, los servicios se hablan por nombre
(`http://ms-usuarios:8083`, `amqp://guest:guest@rabbitmq:5672`, etc.).

---

## Estructura del repositorio

```
profeco/
├── api-gateway/            Quarkus — entry point con JWT + REST clients
├── ms-usuarios/            Auth, registro, perfiles, preferencias
├── ms-tiendas/             Tiendas, reseñas, wishlist
├── ms-productos/           Catálogo y precios (publica ofertas en RabbitMQ)
├── ms-reportes/            Reportes de inconsistencias y sanciones
├── ms-notificaciones/      WebSocket + consumer de RabbitMQ
├── ms-busqueda/            Búsqueda agregada (llama a productos y tiendas)
├── profeco-frontend/       Next.js 14 (App Router) + Tailwind
├── docker/
│   ├── postgres-init.sql   Crea las 4 bases al primer arranque
│   ├── seed-data.sql       Datos de prueba (opcional)
│   ├── seed.ps1            Helper para aplicar el seed
│   └── traefik-dynamic.yml Config del reverse proxy
├── docker-compose.yml
├── cliente-prueba.html     HTML standalone para probar el WebSocket
├── DOCKER.md               Guía detallada de Docker
└── README.md               (este archivo)
```

---

## Datos de prueba

El archivo [`docker/seed-data.sql`](docker/seed-data.sql) puebla las 4 bases
con datos coherentes entre sí. Los `tienda_id` y `producto_id` coinciden
entre tablas, así que los reportes referencian tiendas reales y los precios
existen para productos del catálogo.

| Base | Datos sembrados |
|---|---|
| `usuariosdb` | 10 usuarios (6 CONSUMIDOR · 3 TIENDA · 1 ADMIN) + 11 preferencias |
| `tiendasdb` | 10 tiendas (Cd. Obregón · Hermosillo · Navojoa · Guaymas) + 15 reseñas + 10 wishlist |
| `productosdb` | 20 productos en 7 categorías + 74 precios (varios con oferta) |
| `reportesdb` | 9 reportes (varios estados) + 2 sanciones |

```powershell
.\docker\seed.ps1
```

**Notas importantes:**
- Los IDs sembrados arrancan en **1001** para no chocar con datos reales.
- Las secuencias quedan avanzadas (`setval(...)`) para que las altas vía API no choquen.
- El `passwordhash` corresponde a la contraseña `password` para los 10 usuarios seed.
- Algunos casos se diseñaron para demos:
  - Chedraui Obregón tiene 3 reportes pendientes — alcanza umbral de sanción
  - Smart Yaqui ya tiene una `MULTA_MENOR` pendiente

---

## Ver los datos en la base

```powershell
# Listar las 4 bases
docker exec -it profeco-postgres psql -U postgres -l

# Entrar a una base
docker exec -it profeco-postgres psql -U postgres -d productosdb
#   \dt              listar tablas
#   \d producto      esquema de una tabla
#   SELECT * FROM producto;
#   \q               salir

# Consulta de un solo tiro
docker exec -it profeco-postgres psql -U postgres -d tiendasdb -c "SELECT id, nombre, ciudad FROM tienda;"
```

O conéctate con **DBeaver / pgAdmin**:
- Host: `localhost`
- Puerto: `5433`
- Usuario: `postgres`
- Password: el de tu `.env`

---

## API (resumen)

Todas las rutas viven bajo `http://localhost:8080/api`. Auth con JWT en el
header `Authorization: Bearer <token>`. Los endpoints públicos no requieren
token.

### Autenticación
| Método | Ruta | Acceso |
|---|---|---|
| POST | `/auth/registro` | público |
| POST | `/auth/login` → devuelve JWT | público |

### Productos y precios
| Método | Ruta | Acceso |
|---|---|---|
| GET | `/productos` · `/productos/{id}` | público |
| POST | `/productos` | TIENDA |
| GET | `/productos/{id}/precios` | público |
| POST | `/productos/{id}/precios` | TIENDA |
| POST | `/productos/ofertas` | TIENDA (dispara RabbitMQ → WebSocket) |

### Tiendas
| Método | Ruta | Acceso |
|---|---|---|
| GET | `/tiendas` · `/tiendas/{id}` · `/tiendas/tipo/{tipo}` | público |
| POST | `/tiendas` | TIENDA · ADMIN |
| PUT | `/tiendas/{id}` | TIENDA · ADMIN |
| DELETE | `/tiendas/{id}` | ADMIN |

### Búsqueda
| Método | Ruta | Acceso |
|---|---|---|
| GET | `/busqueda?nombre=leche` | público |
| GET | `/busqueda/producto/{id}` | público |

### Reportes
| Método | Ruta | Acceso |
|---|---|---|
| POST | `/reportes` | autenticado |
| GET | `/reportes` · `/reportes/tienda/{id}` | ADMIN |
| PUT | `/reportes/{id}/estado?estado=SANCIONADO` | ADMIN |

### Sanciones
| Método | Ruta | Acceso |
|---|---|---|
| GET | `/sanciones` · `/sanciones/pendientes` · `/sanciones/resumen` | ADMIN |
| PUT | `/sanciones/{id}/aplicar` | ADMIN |
| PUT | `/sanciones/{id}/apelar` | TIENDA · ADMIN |

### Reseñas
| Método | Ruta | Acceso |
|---|---|---|
| POST | `/resenas` | autenticado |
| GET | `/resenas/tienda/{id}` · `/resenas/tienda/{id}/resumen` | público |
| GET | `/resenas/usuario/{id}` | autenticado |
| DELETE | `/resenas/{id}` | autenticado |

### Wishlist
| Método | Ruta | Acceso |
|---|---|---|
| POST | `/wishlist` | autenticado |
| GET | `/wishlist/tienda/{id}` | TIENDA · ADMIN |
| GET | `/wishlist/usuario/{id}` | autenticado |
| PUT | `/wishlist/{id}/estado` | TIENDA · ADMIN |

### Preferencias
| Método | Ruta | Acceso |
|---|---|---|
| GET / POST / DELETE | `/usuarios/{id}/preferencias[/...]` | autenticado |

El detalle completo de cada endpoint está en
[`api-gateway/src/main/java/com/profeco/gateway/GatewayResource.java`](api-gateway/src/main/java/com/profeco/gateway/GatewayResource.java).

---

## Frontend (rutas)

| Ruta | Acceso | Descripción |
|---|---|---|
| `/` | público | Hero con búsqueda y selector de rol |
| `/busqueda` | público | Resultados con filtros y comparación |
| `/ofertas` | público | Feed en tiempo real (WebSocket) |
| `/auth` | público | Login / registro |
| `/consumidor` | CONSUMIDOR | Dashboard |
| `/consumidor/preferencias` | CONSUMIDOR | Favoritos y lista del súper |
| `/consumidor/reportar` | CONSUMIDOR | Reporte multi-paso |
| `/tienda` | TIENDA | Panel con stats de reportes |
| `/tienda/ofertas/nueva` | TIENDA | Publicación con preview en vivo |
| `/admin` | ADMIN | Resumen ejecutivo |
| `/admin/reportes` | ADMIN | Bandeja de reportes |
| `/admin/sanciones` | ADMIN | Gestión (aplicar / apelar) |

La protección de rutas se hace en `profeco-frontend/middleware.ts`: decodifica
el JWT desde la cookie `profeco_token` y redirige a `/auth?redirect=...` si no
hay sesión o el rol no coincide. Más detalle en
[`profeco-frontend/README.md`](profeco-frontend/README.md).

---

## Roles y permisos

| Rol | Puede |
|---|---|
| **CONSUMIDOR** | Buscar, comparar, ver ofertas, gestionar favoritos / lista del súper, reportar inconsistencias, dejar reseñas, agregar a wishlist |
| **TIENDA** | Publicar productos, precios y ofertas; ver wishlist y reportes propios; apelar sanciones |
| **ADMIN** (PROFECO) | Moderar bandeja de reportes, aplicar/apelar sanciones, ver wishlist global, dar de baja tiendas |

El JWT lleva el rol como claim y como `group`; el gateway lo valida con
`@RolesAllowed` por endpoint.

---

## Mecánica de sanciones

Cuando un consumidor crea un reporte, `ms-reportes` cuenta cuántos reportes
**pendientes** acumula esa tienda. A partir de ciertos umbrales, se crea
automáticamente una sanción y se emite una alerta por RabbitMQ
(`ms-notificaciones` la difunde a los admins vía WebSocket):

| Reportes acumulados | Sanción generada |
|---|---|
| ≥ 3 | **ADVERTENCIA** — advertencia formal |
| ≥ 6 | **MULTA_MENOR** |
| ≥ 10 | **MULTA_MAYOR** — requiere revisión inmediata |

La sanción entra en estado `PENDIENTE`. Desde el panel de admin se puede
**APLICAR** (la tienda queda sancionada) o la propia tienda puede **APELAR**.

Lógica en `ms-reportes/src/main/java/com/profeco/reportes/Sancion.java`.

---

## Comandos útiles

```powershell
# Levantar / detener
docker compose up -d --build
docker compose down                       # mantiene volúmenes (Postgres conserva datos)
docker compose down -v                    # RESET total: borra los datos de Postgres

# Estado y logs
docker compose ps
docker compose logs -f api-gateway
docker compose logs -f ms-usuarios

# Reconstruir un solo servicio tras un mvn package
mvn -f ms-productos package -DskipTests
docker compose up -d --build ms-productos

# Escalar el gateway (Traefik balancea automáticamente)
docker compose up -d --scale api-gateway=3
```

### Verificación rápida

```powershell
# Gateway responde
curl http://localhost:8080/api/status

# Login con un usuario seed
curl -X POST http://localhost:8080/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"ana.lopez@demo.mx\",\"password\":\"password\"}'

# Listar tiendas (público)
curl http://localhost:8080/api/tiendas

# Comparar precios de un producto
curl http://localhost:8080/api/busqueda/producto/1001
```

---

## Troubleshooting

**`Bind for 0.0.0.0:8080 failed: port is already allocated`**
Algún proceso del host usa ese puerto. Mátalo o cambia el mapeo en `docker-compose.yml`.

**`ms-notificaciones` no recibe ofertas**
Verifica que RabbitMQ esté `healthy`:
```powershell
docker compose ps rabbitmq
```

**`ms-busqueda` devuelve `[]` siempre**
No hay productos. Corre `.\docker\seed.ps1` o crea uno vía API.

**Hibernate falla porque ya hay tablas con esquema viejo**
Las propiedades usan `update`, pero si renombraste columnas a mano:
```powershell
docker compose down -v          # reset total del volumen Postgres
docker compose up -d
.\docker\seed.ps1
```

**Login con usuarios seed no funciona**
Algunos clientes de jBCrypt rechazan el prefijo `$2a$`. Si pasa, registra
un usuario nuevo vía `/api/auth/registro` — ese flujo usa el hash generado
por el propio servicio.

---

## Documentación adicional

- [`DOCKER.md`](DOCKER.md) — guía detallada de Docker
- [`profeco-frontend/README.md`](profeco-frontend/README.md) — stack y rutas del frontend
- [`docker/seed-data.sql`](docker/seed-data.sql) — datos de prueba comentados
- `cliente-prueba.html` — página standalone para probar el WebSocket de `ms-notificaciones`

---

## Equipo

Equipo 3 — Sistemas Distribuidos.

Proyecto académico inspirado en el programa "Quién es Quién en los Precios"
de la Procuraduría Federal del Consumidor (PROFECO) de México.
