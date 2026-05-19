# Briefing — Diagrama de componentes de ProFeCo

> **Cómo usar este archivo:** copia y pega todo este contenido en una
> conversación con Claude web pidiéndole que genere un **diagrama de
> componentes UML** del sistema. Al final hay una instrucción explícita
> que puedes usar como prompt.

---

## 1. Contexto del proyecto

**ProFeCo** es una plataforma distribuida de comparación de precios entre
supermercados, mercados y tianguis en México, inspirada en el programa
"Quién es Quién en los Precios" de la Procuraduría Federal del Consumidor.

Tres tipos de actores interactúan con el sistema:

- **Consumidor**: busca productos, compara precios, reporta inconsistencias, recibe alertas de ofertas.
- **Tienda** (supermercado, mercado, tianguis): publica productos, precios y ofertas; atiende peticiones.
- **PROFECO (Admin)**: gestiona reportes, aplica sanciones.

El sistema está construido como una **arquitectura de microservicios**
con un **API Gateway**, **base de datos por servicio**, **mensajería
asíncrona** para eventos en tiempo real y **WebSocket** para notificaciones
al cliente.

---

## 2. Objetivo del diagrama

Mostrar:

1. Todos los **componentes lógicos** del sistema (microservicios, gateway, frontend, broker, bases de datos).
2. Los **nodos físicos / contenedores** donde cada componente se ejecuta.
3. Las **comunicaciones** entre componentes, especificando el protocolo y patrón usado.
4. Las **estrategias de seguridad** aplicadas en cada punto sensible.

El diagrama debe permitir a un lector entender de un vistazo:
- Qué hace cada microservicio.
- Por qué un canal es síncrono (REST) o asíncrono (AMQP/WebSocket).
- Dónde se aplica autenticación / autorización.

---

## 3. Componentes a representar

### 3.1 Frontend
| Componente | Tecnología | Función |
|---|---|---|
| **profeco-frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind | Interfaz web. Renderiza vistas por rol (CONSUMIDOR / TIENDA / ADMIN), guarda el JWT en cookie `profeco_token`, consume la API REST y escucha el WebSocket de notificaciones. Corre en el navegador del usuario, servido por un Node.js dev server en el host (puerto 3000). |

### 3.2 Infraestructura de entrada
| Componente | Tecnología | Función |
|---|---|---|
| **Traefik** | Traefik v3 | Reverse proxy y balanceador de carga. Recibe el tráfico en el puerto 8080 y lo distribuye en round-robin entre las réplicas del `api-gateway`. Habilita escalado horizontal (`docker compose up --scale api-gateway=N`). |
| **api-gateway** | Quarkus 3, MicroProfile JWT, REST Client | Único punto de entrada al backend. Verifica el JWT, aplica autorización por rol (`@RolesAllowed`), enruta cada petición al microservicio correspondiente vía REST. No tiene base de datos. Es escalable (puede haber N réplicas). |

### 3.3 Microservicios de dominio
| Componente | Puerto | Base de datos | Responsabilidad |
|---|---|---|---|
| **ms-usuarios** | 8083 | `usuariosdb` (Postgres) | Registro, login, generación de JWT (firma RSA-2048), perfiles y preferencias (favoritos, lista del súper). |
| **ms-tiendas** | 8082 | `tiendasdb` (Postgres) | CRUD de tiendas, reseñas (1–5 estrellas) y wishlist (peticiones de consumidores). |
| **ms-productos** | 8081 | `productosdb` (Postgres) | Catálogo de productos, precios por tienda y publicación de ofertas. **Productor** de eventos `ofertas` en RabbitMQ. |
| **ms-reportes** | 8084 | `reportesdb` (Postgres) | Reportes de inconsistencias de precio. Genera sanciones automáticas al rebasar umbrales (3 → ADVERTENCIA, 6 → MULTA_MENOR, 10 → MULTA_MAYOR). **Productor** de eventos `inconsistencias` en RabbitMQ. |
| **ms-busqueda** | 8086 (HTTP) **+ 9000 (gRPC)** | — (sin BD propia) | Servicio agregador con **doble interfaz pública**: expone los mismos casos de uso como (a) endpoints HTTP/REST en 8086 (`BusquedaResource`, consumido por el api-gateway) y (b) servicio **gRPC** en 9000 (`BusquedaGrpcService`, definido por el contrato Protobuf `busqueda.proto` con RPCs `BuscarPrecios` y `CompararPorId`). Internamente ambas interfaces delegan en la misma `BusquedaLogic`, que hace llamadas **REST** a `ms-productos` y `ms-tiendas` para agregar y comparar precios. |
| **ms-notificaciones** | 8085 | — (sin BD) | **Consumidor** de los exchanges `ofertas` e `inconsistencias` de RabbitMQ. Expone un endpoint **WebSocket** que mantiene sesiones abiertas con los clientes y les hace broadcast de los eventos recibidos. |

### 3.4 Infraestructura de datos y mensajería
| Componente | Tecnología | Función |
|---|---|---|
| **PostgreSQL** | postgres:16-alpine | Único contenedor que aloja 4 bases independientes (`usuariosdb`, `tiendasdb`, `productosdb`, `reportesdb`). Cada microservicio solo conoce su propia base; **no hay JOINs entre servicios**. La denormalización (`nombre_tienda`, `nombre_producto` copiados en `reporte`) es intencional para evitar acoplamiento. |
| **RabbitMQ** | rabbitmq:3-management-alpine | Broker AMQP. Dos exchanges de tipo **fanout** (sin routing-key, todos los suscriptores reciben todo): `ofertas` (publicado por `ms-productos`) e `inconsistencias` (publicado por `ms-reportes`). |

---

## 4. Nodos físicos / contenedores

Todos los componentes del backend corren como **contenedores Docker** en
una red bridge llamada `profeco-net`. La topología es:

```
Nodo: máquina del usuario (Windows / Linux / Mac con Docker Desktop)
│
├── Proceso: Node.js dev server (host:3000) — profeco-frontend
│
└── Docker Engine
    └── Red: profeco-net (bridge)
        ├── Contenedor: profeco-traefik          (puertos host 8080, 8090)
        ├── Contenedor: profeco-postgres         (puerto host 5433 → 5432)
        ├── Contenedor: profeco-rabbitmq         (puertos host 5672, 15672)
        ├── Contenedor: profeco-ms-usuarios      (puerto host 8083)
        ├── Contenedor: profeco-ms-tiendas       (puerto host 8082)
        ├── Contenedor: profeco-ms-productos     (puerto host 8081)
        ├── Contenedor: profeco-ms-reportes      (puerto host 8084)
        ├── Contenedor: profeco-ms-busqueda      (puerto host 8086 HTTP, puerto 9000 gRPC solo en red interna)
        ├── Contenedor: profeco-ms-notificaciones(puerto host 8085)
        └── Contenedor(es): api-gateway × N      (sin puerto host; expuesto vía Traefik)
```

El frontend NO está dockerizado en este proyecto — corre en el host con
`npm run dev` para facilitar el desarrollo. En producción se dockerizaría
también.

**En entorno productivo real**, cada contenedor podría correr en una VM o
nodo Kubernetes distinto. Lo importante es que **el diseño no asume
co-locación**: los servicios se hablan por nombre DNS (`http://ms-usuarios:8083`)
y por mensajería (`amqp://rabbitmq:5672`), nunca por `localhost` entre sí.

---

## 5. Comunicaciones — protocolos y justificación

### 5.1 Frontend ↔ Gateway: **HTTP/REST + JSON**
- **Tipo**: síncrono, request/response.
- **Endpoints**: `http://localhost:8080/api/*`.
- **Justificación**: el frontend necesita respuestas inmediatas (mostrar resultados de búsqueda, completar un login, listar tiendas). REST es estándar de facto para CRUD y es directamente consumible desde el navegador con `fetch`.

### 5.2 Frontend ↔ ms-notificaciones: **WebSocket**
- **Tipo**: asíncrono, bidireccional, conexión persistente.
- **Endpoint**: `ws://localhost:8085/ws/notificaciones/{tipo}` (tipos: `ofertas` o `inconsistencias`).
- **Justificación**: las ofertas y alertas son **eventos iniciados por el servidor**. Hacer polling cada N segundos sería ineficiente y dejaría latencia visible (un consumidor vería la oferta hasta el siguiente poll). WebSocket mantiene una conexión abierta y el servidor empuja el evento al instante. El frontend re-intenta la conexión cada 3 segundos si se cae.

### 5.3 Gateway ↔ microservicios: **HTTP/REST + JSON** (red interna)
- **Tipo**: síncrono, request/response.
- **Implementación**: MicroProfile REST Client de Quarkus. URLs configuradas vía env vars (`QUARKUS_REST_CLIENT_PRODUCTOS_API_URL=http://ms-productos:8081`).
- **Justificación**: el gateway necesita respuestas para devolver al frontend en la misma petición. REST mantiene la simplicidad y el contrato HTTP de extremo a extremo. Esto es **comunicación interna en red privada `profeco-net`** — no se expone al exterior.

### 5.4 ms-busqueda ↔ ms-productos / ms-tiendas: **HTTP/REST + JSON** (saliente)
- **Tipo**: síncrono, request/response.
- **Implementación**: MicroProfile REST Client (`ProductosInternoClient`, `TiendasInternoClient`) en `ms-busqueda`.
- **Justificación**: `ms-busqueda` es un **agregador**. Cuando llega una consulta, llama a `ms-productos` para traer el catálogo y los precios, y a `ms-tiendas` para enriquecer cada precio con el nombre/tipo de la tienda. Necesita ambas respuestas para construir la suya, así que la sincronía es inherente. Aquí se evita reproducir los catálogos por replicación porque el costo de consistencia eventual sería mayor (mostrar precios desactualizados).

### 5.5 Clientes ↔ ms-busqueda: **doble interfaz HTTP/REST + gRPC/Protobuf** (entrante)
- `ms-busqueda` **expone los mismos casos de uso por dos protocolos** simultáneamente, sobre los puertos 8086 (HTTP) y 9000 (gRPC).
- **HTTP/REST (puerto 8086)**: lo consume el `api-gateway` porque el flujo principal viene del navegador, que ya habla HTTP/JSON y porque el gateway centraliza JWT sobre HTTP.
- **gRPC/Protobuf (puerto 9000)**: contrato definido en `ms-busqueda/src/main/proto/busqueda.proto`. RPCs disponibles:
  - `BuscarPrecios(BusquedaRequest) → BusquedaResponse`
  - `CompararPorId(CompararRequest) → BusquedaResponse`
- **Justificación de exponer gRPC además de REST**:
  - **Eficiencia de serialización**: Protobuf es binario, tipado y compacto; reduce ancho de banda y latencia frente a JSON.
  - **Contrato fuerte**: el `.proto` es la fuente de verdad para la API; cualquier cliente (Java, Go, Python) puede generar stubs y obtener errores de compilación si el contrato cambia.
  - **Streaming**: gRPC habilita streaming bidireccional fácilmente, útil si en el futuro `ms-busqueda` necesita publicar resultados parciales en tiempo real.
  - **Comunicación inter-servicio**: cuando un microservicio (no un navegador) consume `ms-busqueda`, gRPC es más eficiente que REST. El puerto 9000 **no está mapeado al host** — solo es accesible dentro de la red `profeco-net`, justamente para esto.
  - En este proyecto, la doble interfaz también cumple un objetivo académico: demostrar la coexistencia de protocolos sin acoplarse a uno solo.

### 5.6 ms-productos / ms-reportes → RabbitMQ: **AMQP (publish)**
- **Tipo**: asíncrono, **fire-and-forget**.
- **Exchanges fanout**:
  - `ofertas`: lo publica `ms-productos` cuando una tienda crea una promoción.
  - `inconsistencias`: lo publica `ms-reportes` cuando una tienda rebasa el umbral de reportes (≥3).
- **Justificación**:
  - **Desacoplamiento**: `ms-productos` no necesita saber quién está escuchando — puede haber 0, 1 o N consumidores. Hoy es `ms-notificaciones`; mañana podría agregarse `ms-analytics` sin tocar al productor.
  - **Resiliencia**: si `ms-notificaciones` está caído, RabbitMQ mantiene los mensajes en la cola y los entrega cuando vuelva.
  - **Patrón fanout**: todos los suscriptores reciben todos los eventos. Útil porque la decisión de **a quién** notificar (a qué WebSockets) es responsabilidad del consumidor, no del productor.

### 5.7 RabbitMQ → ms-notificaciones: **AMQP (subscribe)**
- **Tipo**: asíncrono, **push** desde el broker.
- **Implementación**: SmallRye Reactive Messaging con `@Incoming("ofertas-in")` y `@Incoming("inconsistencias-in")`.
- **Justificación**: complementa lo anterior. El consumidor reacciona a eventos en vez de hacer polling.

### 5.8 Microservicios ↔ PostgreSQL: **TCP/JDBC**
- **Tipo**: síncrono, pool de conexiones gestionado por Quarkus / Agroal.
- **Patrón**: **database-per-service**. Cada microservicio solo ve su base. No hay JOINs cross-database. Ej.: `reporte.nombre_tienda` se copia en lugar de hacer JOIN a `tiendasdb`.
- **Justificación**: el database-per-service evita que un cambio de esquema en un servicio rompa a otros; permite escoger motores distintos por dominio (aquí todos son Postgres por simplicidad); habilita escalar la base de cada servicio independientemente.

---

## 6. Estrategias de seguridad

### 6.1 Autenticación: **JWT firmado con RSA-2048**
- `ms-usuarios` mantiene la **clave privada** (`smallrye.jwt.sign.key` en `application.properties`) y firma los tokens al hacer login.
- El **api-gateway** y `ms-reportes` mantienen solo la **clave pública** (`mp.jwt.verify.publickey`) y verifican la firma de cada petición entrante.
- El token incluye: `sub` (id de usuario), `email`, `nombre`, `rol`, `groups` (para `@RolesAllowed`), `iss=profeco-app`, `exp=3600s`.
- **Por qué RSA y no HMAC**: con RSA, solo `ms-usuarios` puede emitir tokens (tiene la privada); los demás solo pueden verificar. Esto separa responsabilidades incluso si otro microservicio se ve comprometido.

### 6.2 Almacenamiento de contraseñas: **BCrypt** (jBCrypt)
- En `ms-usuarios.AuthService.hashPassword()` con `BCrypt.gensalt()` (salt aleatorio por usuario, 10 rounds).
- La base nunca guarda la contraseña en texto plano — solo el hash.
- BCrypt es resistente a ataques por fuerza bruta gracias al *work factor* ajustable y al salt único por registro.

### 6.3 Autorización por rol en el gateway
- Cada endpoint del `GatewayResource.java` está decorado con:
  - `@PermitAll` — público (login, registro, búsqueda, catálogo).
  - `@Authenticated` — token válido, cualquier rol (reportar, reseñar, wishlist).
  - `@RolesAllowed({"TIENDA"})` — solo tiendas (publicar producto, oferta, precio).
  - `@RolesAllowed({"ADMIN"})` — solo PROFECO (ver bandeja de reportes, aplicar sanciones).
  - `@RolesAllowed({"TIENDA", "ADMIN"})` — ambos (apelar sanción, gestionar wishlist).
- La autorización vive en una sola capa (gateway) — los microservicios internos confían en que la red privada `profeco-net` no es accesible desde el exterior.

### 6.4 Aislamiento de red
- Los microservicios, Postgres y RabbitMQ corren en la red Docker `profeco-net`, que es **una red bridge interna**. Solo los puertos explícitamente mapeados al host son accesibles desde fuera.
- En producción real, solo Traefik tendría puerto público; el resto vivirían en una VPC privada.

### 6.5 CORS
- El gateway tiene `quarkus.http.cors=true` con `origins=*` para permitir al frontend (en otro origen) consumir la API. En producción se restringiría a los dominios reales.

### 6.6 Comunicación con RabbitMQ
- Autenticación básica con usuario/contraseña (`guest`/`guest` en demo; en producción se rotarían credenciales y se usaría TLS).

### 6.7 Validación de input
- Los DTOs en cada microservicio usan tipos estrictos. Hibernate ORM parametriza queries (no hay SQL crudo en endpoints públicos) → protección automática contra **inyección SQL**.

---

## 7. Notación sugerida para el diagrama

Recomiendo **UML de componentes** con las siguientes convenciones:

- **Componentes** representados con el rectángulo de UML (`<<component>>`).
- **Nodos / contenedores** representados con cajas 3D (`<<node>>`) que agrupan a los componentes que los habitan.
- **Interfaces requeridas/proporcionadas** con lollipops y sockets.
- **Etiquetar cada arista** con:
  - Protocolo: `HTTP/REST`, `WebSocket`, `AMQP`, `JDBC`.
  - Patrón: síncrono / asíncrono / pub-sub.
  - Seguridad aplicada: `JWT`, `TLS`, ninguna (red privada), etc.

Puedes generar el diagrama en **PlantUML** o **Mermaid** (`flowchart` o
`C4Container`). Ambos son texto y se pueden versionar.

### Ejemplo de aristas etiquetadas

| Origen | Destino | Etiqueta |
|---|---|---|
| profeco-frontend | Traefik | `HTTPS/REST` (en dev: HTTP) — JWT en `Authorization: Bearer` |
| profeco-frontend | ms-notificaciones | `WebSocket` — broadcast asíncrono |
| Traefik | api-gateway | `HTTP round-robin` (load balancing) |
| api-gateway | ms-* (excepto ms-busqueda) | `HTTP/REST` interno (red privada) |
| api-gateway | ms-busqueda | `HTTP/REST` interno (puerto 8086) — gateway prefiere REST porque ya proxea HTTP/JSON |
| (otro microservicio en el futuro) | ms-busqueda | `gRPC/Protobuf` (puerto 9000, solo red interna) — alternativa binaria, tipada por `.proto` |
| ms-busqueda | ms-productos, ms-tiendas | `HTTP/REST` saliente (agregación síncrona) |
| ms-productos | RabbitMQ | `AMQP publish` — exchange `ofertas` (fanout) |
| ms-reportes | RabbitMQ | `AMQP publish` — exchange `inconsistencias` (fanout) |
| RabbitMQ | ms-notificaciones | `AMQP subscribe` — push asíncrono |
| ms-* | PostgreSQL | `JDBC/TCP` — pool de conexiones, query parametrizada |

---

## 8. Prompt sugerido para Claude web

> A continuación tienes el briefing completo de la arquitectura del
> proyecto **ProFeCo**. Por favor genera un **diagrama de componentes
> UML** que represente:
>
> 1. Todos los componentes lógicos listados (frontend, gateway, los 6
>    microservicios, Postgres, RabbitMQ, Traefik).
> 2. Los nodos físicos (contenedores Docker) que los alojan, incluyendo
>    los **puertos expuestos al host vs. los puertos internos**
>    (importante: el puerto 9000 gRPC de `ms-busqueda` es solo interno).
> 3. Las comunicaciones entre componentes, etiquetadas con el protocolo
>    (HTTP/REST + JSON, **gRPC + Protobuf**, WebSocket, AMQP, JDBC) y el
>    patrón (síncrono / asíncrono / pub-sub).
> 4. La **doble interfaz** de `ms-busqueda` (REST en 8086 + gRPC en 9000)
>    debe quedar visualmente representada como dos puertos
>    proporcionados distintos sobre el mismo componente.
> 5. Los puntos donde se aplica seguridad (JWT, BCrypt, autorización por
>    rol, aislamiento de red).
>
> Genera el diagrama en **PlantUML** y también en **Mermaid** para que
> pueda elegir el formato. Acompaña cada diagrama con una **leyenda
> explicativa** que describa cada componente y justifique brevemente
> por qué cada comunicación es síncrona o asíncrona.
>
> [pegar aquí TODO el contenido de las secciones 1–7]
