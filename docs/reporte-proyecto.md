# Briefing maestro — Reporte completo del proyecto ProFeCo

> **Cómo usar este archivo:** este documento contiene toda la información
> técnica necesaria para que Claude web genere un **reporte académico
> completo** del proyecto. Está pensado para entregarse como tal cual:
> copia y pega todo el contenido (secciones 1 a 13) en una conversación
> con Claude web y al final usa el prompt sugerido (sección 14).
>
> El archivo es **autosuficiente**: incluye contexto, requisitos,
> componentes, nodos, comunicaciones, justificaciones, seguridad,
> diagramas a generar, casos de uso y formato de entrega. No depende de
> los otros briefings (`diagrama-componentes.md`, `diagrama-secuencia.md`),
> aunque los resume.

---

## 1. Estructura sugerida del reporte

El reporte debe seguir, como mínimo, esta estructura:

1. **Portada** (título, materia, equipo, fecha)
2. **Resumen ejecutivo** (máximo media página)
3. **Introducción**
   - Contexto y problema que resuelve el sistema
   - Objetivos del proyecto
   - Alcance
4. **Marco teórico** (breve)
   - Microservicios
   - API Gateway pattern
   - Database per service
   - Mensajería asíncrona (pub/sub, fanout)
   - gRPC vs REST
   - JWT y autenticación stateless
5. **Arquitectura del sistema**
   - Vista general y decisiones arquitectónicas
   - **Diagrama de componentes UML** con explicación detallada de cada componente
   - **Diagrama de despliegue UML** mostrando los nodos físicos (contenedores Docker) y su mapeo de puertos
6. **Flujos del sistema**
   - **Cinco diagramas de secuencia UML** (login, crear reporte que dispara sanción, publicar oferta, búsqueda vía REST, búsqueda vía gRPC) — cada uno con su narrativa paso a paso
7. **Justificación de comunicaciones distribuidas**
   - Por qué REST, gRPC, WebSocket, AMQP, JDBC en cada caso
   - Trade-offs entre sincronía y asincronía
   - Por qué fanout y no direct/topic
8. **Estrategias de seguridad**
   - Autenticación (JWT RSA-2048)
   - Almacenamiento de contraseñas (BCrypt)
   - Autorización por rol (`@RolesAllowed`)
   - Aislamiento de red
   - CORS, validación de input, query parametrizada
9. **Modelo de datos**
   - 4 bases independientes, denormalización intencional
10. **Patrones de diseño aplicados**
    - API Gateway, Database per Service, Event-Driven Architecture, Publish/Subscribe, Service Discovery (vía DNS de Docker), Reverse Proxy + Load Balancer
11. **Despliegue y operación**
    - Comandos para levantar el sistema
    - Datos de prueba
    - Escalado horizontal con Traefik
12. **Limitaciones y trabajo futuro**
13. **Conclusiones**
14. **Referencias**

Cada diagrama del reporte debe ir acompañado de una **leyenda y narrativa
explicativa** suficiente para que un lector que abre el reporte en frío
entienda:
- Qué representa cada componente, comunicación y nodo.
- Por qué se eligió ese protocolo de comunicación entre dos componentes
  distribuidos.
- Qué estrategia de seguridad protege ese punto del sistema.

---

## 2. Contexto del proyecto

### 2.1 Identificación

| Campo | Valor |
|---|---|
| Nombre | **ProFeCo** |
| Tipo | Plataforma distribuida de comparación de precios |
| Inspiración | Programa "Quién es Quién en los Precios" de la Procuraduría Federal del Consumidor (PROFECO) de México |
| Contexto académico | Materia de Sistemas Distribuidos — Equipo 3 |

### 2.2 Problema que resuelve

En México, los consumidores tienen pocas herramientas para:

- Comparar precios de la canasta básica entre tiendas
- Saber dónde hay ofertas el día de hoy
- Reportar formalmente cuando una tienda cobra distinto al precio anunciado
- Pedirle a una tienda que ofrezca un producto que no maneja

ProFeCo unifica todo esto en una sola plataforma, conectando a tres actores:

| Actor | Necesidad |
|---|---|
| **Consumidor** | Comparar precios, encontrar ofertas, reportar abusos, dejar reseñas, pedir productos vía wishlist |
| **Tienda** (supermercado / mercado / tianguis) | Publicar productos, precios y ofertas; atender peticiones de clientes |
| **PROFECO** | Vigilar inconsistencias, moderar reportes, aplicar sanciones |

### 2.3 Objetivos

- Construir un sistema **distribuido** de microservicios desacoplados.
- Aplicar **patrones de arquitectura** modernos: API Gateway, database-per-service, event-driven, pub/sub.
- Demostrar la **coexistencia de múltiples protocolos** de comunicación según conviene a cada flujo (REST, gRPC, AMQP, WebSocket).
- Implementar **autenticación y autorización** basada en JWT con firma RSA y roles.
- Habilitar **escalado horizontal** mediante reverse proxy + load balancer.
- Proveer una **interfaz web** moderna y funcional para los tres actores.

### 2.4 Alcance

**Dentro del alcance:**
- Registro y autenticación de tres tipos de usuario.
- CRUD de productos, precios, tiendas, reportes, reseñas, wishlist.
- Búsqueda y comparación de precios entre tiendas.
- Publicación de ofertas con difusión en tiempo real (RabbitMQ + WebSocket).
- Generación automática de sanciones por umbral de reportes.
- Frontend Next.js con vistas diferenciadas por rol.
- Despliegue con Docker Compose y balanceo de carga con Traefik.

**Fuera del alcance:**
- Geolocalización avanzada.
- Pagos.
- Aplicación móvil nativa.
- Despliegue en la nube (Kubernetes, AWS, etc.).
- Métricas y observabilidad (Prometheus, Grafana).

---

## 3. Stack tecnológico

| Capa | Tecnología | Justificación |
|---|---|---|
| Backend (microservicios) | **Java 17 + Quarkus 3.9** | Quarkus tiene tiempo de arranque rápido, bajo consumo de memoria y extensiones listas para MicroProfile JWT, gRPC, RabbitMQ, REST Client. |
| Persistencia | Hibernate ORM + **Panache** | Reduce el boilerplate de JPA; entidades como clases con campos `public`. |
| Base de datos | **PostgreSQL 16** | Motor relacional maduro, multi-base en un solo contenedor, ACID, soporte de tipos ricos. |
| Mensajería | **RabbitMQ 3 (fanout)** + SmallRye Reactive Messaging | Broker AMQP estable; fanout permite desacoplar productores de consumidores sin enrutamiento por clave. |
| Gateway | Quarkus + MicroProfile REST Client | Reusa el mismo runtime que los microservicios. |
| Reverse proxy / LB | **Traefik 3** | Configuración por archivo, dashboard incluido, balanceo round-robin sobre Docker DNS. |
| Frontend | **Next.js 14** (App Router) + React 18 + TypeScript + Tailwind CSS | App Router con Server Components, TypeScript estricto, Tailwind para diseño rápido. |
| Estado del cliente | TanStack Query | Cache y reintentos automáticos para llamadas REST. |
| Real-time | **WebSocket** nativo | API estándar del navegador, sin dependencias. |
| Autenticación | **JWT RSA-2048** (MicroProfile JWT + SmallRye JWT Build) + **BCrypt** (jBCrypt) | Tokens stateless firmados; contraseñas hasheadas con salt y work factor. |
| Comunicación interna | HTTP/REST + JSON, **gRPC + Protobuf** | Coexistencia: REST para flujos del navegador, gRPC para tráfico inter-servicio eficiente. |
| Orquestación | **Docker Compose** | Define todos los servicios, redes y volúmenes; un solo `docker compose up` levanta todo. |

---

## 4. Componentes del sistema

Hay 11 componentes lógicos. Cada uno debe aparecer en el diagrama de
componentes con su descripción.

### 4.1 Frontend
| Componente | Tecnología | Función | Puerto |
|---|---|---|---|
| **profeco-frontend** | Next.js 14, React 18, TypeScript, Tailwind | Renderiza vistas diferenciadas por rol (CONSUMIDOR / TIENDA / ADMIN). Guarda el JWT en la cookie `profeco_token`. Consume la API REST del gateway y escucha el WebSocket de notificaciones. Corre en el navegador del usuario, servido por un Node.js dev server en el host. | 3000 (host) |

### 4.2 Infraestructura de entrada
| Componente | Tecnología | Función | Puerto |
|---|---|---|---|
| **Traefik** | Traefik v3 | Reverse proxy y load balancer. Recibe el tráfico en :8080 y lo balancea round-robin entre las réplicas del `api-gateway`. Habilita escalado horizontal. Dashboard en :8090. | 8080, 8090 (host) |
| **api-gateway** | Quarkus 3, MicroProfile JWT, REST Client | Único punto de entrada al backend. Verifica el JWT con clave pública RSA, aplica autorización por rol (`@RolesAllowed`), enruta cada petición al microservicio correspondiente vía REST Client. No tiene base de datos. Escalable a N réplicas. | 8080 (vía Traefik) |

### 4.3 Microservicios de dominio
| Componente | Puerto host | Base de datos | Responsabilidad |
|---|---|---|---|
| **ms-usuarios** | 8083 | `usuariosdb` | Registro, login, **generación del JWT** (clave privada RSA-2048), perfiles, preferencias (favoritos, lista del súper). |
| **ms-tiendas** | 8082 | `tiendasdb` | CRUD de tiendas, reseñas (1–5 estrellas + comentario), wishlist (peticiones de productos). |
| **ms-productos** | 8081 | `productosdb` | Catálogo de productos, precios por tienda, publicación de ofertas. **Productor** del exchange `ofertas` en RabbitMQ. |
| **ms-reportes** | 8084 | `reportesdb` | Reportes de inconsistencias y sanciones automáticas (umbrales: ≥3 → ADVERTENCIA, ≥6 → MULTA_MENOR, ≥10 → MULTA_MAYOR). **Productor** del exchange `inconsistencias` en RabbitMQ. |
| **ms-busqueda** | **8086 (HTTP) + 9000 (gRPC, solo red interna)** | — (sin BD) | Servicio agregador con **doble interfaz pública**: (a) REST en 8086 consumido por el api-gateway y (b) gRPC en 9000 (contrato Protobuf `busqueda.proto`) para tráfico inter-servicio. Ambas comparten `BusquedaLogic`, que hace llamadas **REST salientes** a `ms-productos` y `ms-tiendas`. |
| **ms-notificaciones** | 8085 | — (sin BD) | **Consumidor** de los exchanges `ofertas` e `inconsistencias`. Expone WebSocket `ws://.../ws/notificaciones/{tipo}`. Mantiene sesiones en memoria (`ConcurrentHashMap`) y hace broadcast del JSON recibido a todos los clientes suscritos al canal correspondiente. |

### 4.4 Infraestructura de datos y mensajería
| Componente | Tecnología | Función | Puerto host |
|---|---|---|---|
| **PostgreSQL** | postgres:16-alpine | Un solo contenedor que aloja 4 bases independientes: `usuariosdb`, `tiendasdb`, `productosdb`, `reportesdb`. **Database-per-service**: cada microservicio solo conoce su propia base. La denormalización (`nombre_tienda`, `nombre_producto` copiados en `reporte`) es intencional para evitar JOINs cross-database. | 5433 → 5432 |
| **RabbitMQ** | rabbitmq:3-management-alpine | Broker AMQP. Dos exchanges de tipo **fanout** (sin routing-key, todos los suscriptores reciben todo): `ofertas` y `inconsistencias`. Consola en :15672 (guest/guest). | 5672, 15672 |

---

## 5. Nodos físicos / contenedores (vista de despliegue)

Todos los componentes del backend corren como **contenedores Docker**
en una red bridge llamada `profeco-net`. El frontend corre en el host
(no dockerizado) para facilitar desarrollo.

```
Nodo: máquina del usuario (Windows / Linux / Mac con Docker Desktop)
│
├── Proceso: Node.js dev server (host:3000) ── profeco-frontend
│
└── Docker Engine
    └── Red bridge: profeco-net
        ├── profeco-traefik              [host: 8080, 8090]
        ├── profeco-postgres             [host: 5433 → ct: 5432]
        ├── profeco-rabbitmq             [host: 5672, 15672]
        ├── profeco-ms-usuarios          [host: 8083]
        ├── profeco-ms-tiendas           [host: 8082]
        ├── profeco-ms-productos         [host: 8081]
        ├── profeco-ms-reportes          [host: 8084]
        ├── profeco-ms-busqueda          [host: 8086 (HTTP)] [interno: 9000 (gRPC)]
        ├── profeco-ms-notificaciones    [host: 8085]
        └── api-gateway × N replicas     [SIN puerto host; expuesto por Traefik]
```

**Notas clave de despliegue:**

- Los microservicios se hablan entre sí por **nombre DNS Docker**:
  `http://ms-usuarios:8083`, `amqp://rabbitmq:5672`. Esto significa que
  el diseño **no asume co-locación** — en producción, cada contenedor
  podría correr en una VM o nodo Kubernetes distinto sin cambios de
  código, solo redefinición de DNS.
- El puerto gRPC 9000 de `ms-busqueda` **NO está mapeado al host**: es
  intencional, gRPC es para consumidores intra-clúster.
- El `api-gateway` no tiene puerto público — Traefik lo proxea y permite
  escalar a N réplicas (`docker compose up --scale api-gateway=N`).

---

## 6. Comunicaciones — protocolos y justificación

Esta es la sección **más importante del reporte**. Cada arista del
diagrama debe estar justificada.

### 6.1 Frontend ↔ Gateway: **HTTP/REST + JSON**
- **Tipo**: síncrono, request/response.
- **Endpoints**: `http://localhost:8080/api/*`.
- **Justificación**: el frontend (navegador) necesita respuestas
  inmediatas (mostrar resultados de búsqueda, completar un login). REST
  sobre HTTP es el estándar de facto consumible desde `fetch` sin
  dependencias. Mantener HTTP en la frontera externa simplifica CORS,
  proxies y monitoreo.

### 6.2 Frontend ↔ ms-notificaciones: **WebSocket**
- **Tipo**: asíncrono, bidireccional, conexión persistente.
- **Endpoint**: `ws://localhost:8085/ws/notificaciones/{tipo}` (tipos:
  `ofertas` o `inconsistencias`).
- **Justificación**: las ofertas y alertas son **eventos iniciados por
  el servidor**. Hacer polling cada N segundos sería ineficiente y
  dejaría latencia visible. WebSocket mantiene una conexión abierta y
  el servidor empuja el evento al instante. El frontend re-intenta la
  conexión cada 3 segundos si se cae.

### 6.3 Traefik → api-gateway: **HTTP** (load balancing)
- **Tipo**: round-robin entre réplicas del gateway.
- **Justificación**: Traefik balancea HTTP nativo. Permite escalar el
  punto de entrada sin que el frontend cambie de URL. Habilita
  rolling updates: tirar una réplica del gateway sin downtime.

### 6.4 api-gateway → microservicios (excepto ms-busqueda): **HTTP/REST + JSON** (red privada)
- **Tipo**: síncrono, request/response.
- **Implementación**: MicroProfile REST Client de Quarkus. URLs vía env
  vars (`QUARKUS_REST_CLIENT_PRODUCTOS_API_URL=http://ms-productos:8081`).
- **Justificación**: el gateway necesita las respuestas para devolverlas
  al frontend en la misma petición. REST mantiene la simplicidad y el
  contrato HTTP de extremo a extremo. Es **red interna en bridge
  privada** — sin exposición al exterior.

### 6.5 api-gateway → ms-busqueda: **HTTP/REST + JSON**
- **Justificación específica**: aunque `ms-busqueda` expone también
  gRPC, el gateway lo consume por REST porque el origen del flujo es un
  navegador (HTTP/JSON nativo) y el gateway centraliza JWT sobre HTTP.
  Cambiar de protocolo aquí complicaría el gateway sin beneficio.

### 6.6 (Otro microservicio o tool) → ms-busqueda: **gRPC sobre HTTP/2 + Protobuf**
- **Tipo**: síncrono, request/response (con soporte futuro de streaming).
- **Contrato**: `ms-busqueda/src/main/proto/busqueda.proto`.
  - Servicio: `BusquedaService`
  - RPCs: `BuscarPrecios(BusquedaRequest) → BusquedaResponse`,
    `CompararPorId(CompararRequest) → BusquedaResponse`
- **Justificación de exponer gRPC además de REST**:
  - **Eficiencia**: Protobuf es binario, varias veces más compacto que
    JSON; serialización/deserialización más rápida.
  - **Contrato fuerte**: el `.proto` es la fuente de verdad. Cualquier
    cliente genera stubs tipados; cambios incompatibles se detectan en
    compilación.
  - **HTTP/2 multiplexing**: múltiples RPCs concurrentes sobre una
    conexión TCP — ideal para tráfico inter-servicio sostenido.
  - **Streaming** disponible para futuros casos de uso.
- **Acceso**: puerto 9000 solo en red `profeco-net`, no expuesto al
  host. El acceso desde el navegador requeriría gRPC-web + un proxy,
  que se evita deliberadamente.

### 6.7 ms-busqueda → ms-productos / ms-tiendas: **HTTP/REST + JSON** (saliente)
- **Tipo**: síncrono.
- **Implementación**: MicroProfile REST Client
  (`ProductosInternoClient`, `TiendasInternoClient`).
- **Justificación**: `ms-busqueda` es agregador. Llama a `ms-productos`
  para catálogo y precios, y a `ms-tiendas` para nombre/tipo. Necesita
  ambas respuestas para construir la suya. No se replican los catálogos
  porque la consistencia eventual sería peor que el costo de unas
  llamadas REST en red privada de baja latencia.
- **Decisión consciente**: aunque `ms-busqueda` ofrece gRPC entrante,
  sus llamadas salientes siguen siendo REST. Cada servicio elige el
  protocolo que mejor se adapta a sus consumidores; el protocolo de
  entrada no propaga al de salida.

### 6.8 ms-productos / ms-reportes → RabbitMQ: **AMQP publish** (fanout)
- **Tipo**: asíncrono, fire-and-forget.
- **Exchanges**:
  - `ofertas` (publicado por `ms-productos` al crear una promoción).
  - `inconsistencias` (publicado por `ms-reportes` al rebasar el
    umbral de reportes).
- **Implementación**: SmallRye Reactive Messaging con
  `@Channel("ofertas-out")` / `@Channel("inconsistencias-out")`.
- **Justificación**:
  - **Desacoplamiento**: `ms-productos` no necesita saber quién está
    escuchando. Hoy es `ms-notificaciones`; mañana podría agregarse
    `ms-analytics` o un servicio de email sin tocar al productor.
  - **Resiliencia**: si `ms-notificaciones` está caído, RabbitMQ
    persiste los mensajes y los entrega cuando vuelva.
  - **Tipo fanout**: todos los suscriptores reciben todos los eventos.
    La decisión de a qué clientes finales notificar es responsabilidad
    del consumidor, no del productor — separación clara de
    responsabilidades.

### 6.9 RabbitMQ → ms-notificaciones: **AMQP subscribe**
- **Tipo**: asíncrono, push desde el broker.
- **Implementación**: `@Incoming("ofertas-in")` y
  `@Incoming("inconsistencias-in")`.
- **Justificación**: complementa 6.8. El consumidor reacciona a eventos,
  no hace polling al broker.

### 6.10 Microservicios ↔ PostgreSQL: **TCP/JDBC**
- **Tipo**: síncrono, pool de conexiones (Agroal en Quarkus).
- **Patrón**: **database-per-service**. Cada microservicio solo ve su
  base; no hay JOINs cross-database.
- **Justificación**: aislamiento de esquema (un cambio en `ms-tiendas`
  no rompe a otros servicios); posibilidad de escoger motor distinto
  por dominio en el futuro; escalado independiente.

### 6.11 Resumen tabular de comunicaciones

| Origen | Destino | Protocolo | Patrón | Justificación principal |
|---|---|---|---|---|
| Frontend | Gateway (vía Traefik) | HTTP/REST + JSON | Síncrono | Estándar de navegador, JWT en header |
| Frontend | ms-notificaciones | WebSocket | Async push | Eventos iniciados por servidor |
| Gateway | ms-usuarios, ms-tiendas, ms-productos, ms-reportes | HTTP/REST + JSON | Síncrono | Request/response inmediato para el usuario |
| Gateway | ms-busqueda | HTTP/REST + JSON (puerto 8086) | Síncrono | Continuidad HTTP desde el navegador |
| (futuro) Microservicio | ms-busqueda | **gRPC + Protobuf** (puerto 9000) | Síncrono | Eficiencia binaria intra-clúster |
| ms-busqueda | ms-productos, ms-tiendas | HTTP/REST + JSON | Síncrono | Agregación; replicación traería inconsistencia |
| ms-productos | RabbitMQ (exchange `ofertas`) | AMQP publish, fanout | Async fire-and-forget | Desacoplamiento productor/consumidor |
| ms-reportes | RabbitMQ (exchange `inconsistencias`) | AMQP publish, fanout | Async fire-and-forget | Igual; alertas no deben bloquear la respuesta |
| RabbitMQ | ms-notificaciones | AMQP subscribe | Async push | Reacciona a eventos, no hace polling |
| Todos los ms con BD | PostgreSQL | TCP/JDBC | Síncrono, pool | Database-per-service, ACID |

---

## 7. Estrategias de seguridad

### 7.1 Autenticación stateless con **JWT RSA-2048**
- `ms-usuarios` mantiene la **clave privada** (`smallrye.jwt.sign.key`) y
  firma los tokens al hacer login.
- El `api-gateway` y `ms-reportes` mantienen solo la **clave pública**
  (`mp.jwt.verify.publickey`) y verifican la firma.
- Payload del token:
  - `sub` (id del usuario)
  - claims: `email`, `nombre`, `rol`
  - `groups = { rol }` (para `@RolesAllowed`)
  - `iss = "profeco-app"`
  - `exp = 3600s` (1 hora)
- **Por qué RSA y no HMAC simétrico**: con RSA, solo `ms-usuarios` puede
  emitir tokens válidos (tiene la privada); los demás solo verifican.
  Esto separa responsabilidades: si otro microservicio se ve
  comprometido, no puede emitir tokens propios.

### 7.2 **BCrypt** para contraseñas (jBCrypt)
- En `AuthService.hashPassword()` con `BCrypt.gensalt()` — salt
  aleatorio por usuario, 10 rounds.
- La BD nunca almacena la contraseña en texto plano.
- Resistente a ataques por fuerza bruta gracias al *work factor*
  ajustable y al salt único por registro (mitiga rainbow tables).

### 7.3 Autorización por rol en el **api-gateway**
Cada endpoint del `GatewayResource.java` está decorado:

| Anotación | Significado | Endpoints típicos |
|---|---|---|
| `@PermitAll` | Público, sin token | login, registro, búsqueda, catálogo |
| `@Authenticated` | Token válido, cualquier rol | reportar, reseñar, wishlist |
| `@RolesAllowed({"TIENDA"})` | Solo tiendas | publicar producto/precio/oferta |
| `@RolesAllowed({"ADMIN"})` | Solo PROFECO | bandeja de reportes, aplicar sanciones |
| `@RolesAllowed({"TIENDA","ADMIN"})` | Ambos | apelar sanción, gestionar wishlist |

La autorización está **centralizada en el gateway**: los microservicios
internos confían en que la red privada `profeco-net` no es accesible
desde el exterior. Esto simplifica el modelo de seguridad — una sola
capa de auth.

### 7.4 Aislamiento de red
- Todos los contenedores corren en una **red bridge Docker** llamada
  `profeco-net`.
- Solo los puertos explícitamente mapeados al host (`ports:`) son
  accesibles desde fuera. Los demás (incluyendo el gRPC en 9000) son
  inalcanzables desde el navegador o cualquier proceso del host.
- En producción real, el gateway viviría en una DMZ y los microservicios
  en una VPC privada, replicando esta topología.

### 7.5 Validación de input y prevención de inyección SQL
- Hibernate ORM con Panache **parametriza todas las queries**. No hay
  SQL crudo construido por concatenación de strings.
- Los DTOs usan tipos estrictos (`Long`, `String`, `LocalDateTime`),
  no `Object`/`Map` arbitrarios en endpoints públicos.

### 7.6 CORS controlado
- El gateway tiene `quarkus.http.cors=true` con `origins=*` para
  desarrollo. En producción se restringiría al dominio del frontend.

### 7.7 Credenciales del broker
- RabbitMQ usa autenticación básica (usuario/contraseña). En demo es
  `guest/guest`. En producción se rotarían credenciales por servicio y
  se habilitaría TLS.

### 7.8 Resumen tabular de seguridad

| Capa | Estrategia | Implementación |
|---|---|---|
| Identidad | JWT RSA-2048 firmado por `ms-usuarios` | MicroProfile JWT + SmallRye JWT Build |
| Contraseñas | BCrypt salt por usuario, work factor 10 | jBCrypt en `AuthService` |
| Autorización | Decoradores por endpoint en el gateway | `@PermitAll`, `@Authenticated`, `@RolesAllowed` |
| Red | Aislamiento por bridge Docker | `profeco-net`, solo Traefik público |
| SQL | Queries parametrizadas | Hibernate ORM + Panache |
| CORS | Restringido por origen (relajado en demo) | `quarkus.http.cors` |
| Broker | Autenticación básica AMQP | Usuario/contraseña, TLS opcional |

---

## 8. Modelo de datos

### 8.1 Database per service

| Microservicio | Base | Tablas |
|---|---|---|
| ms-usuarios | `usuariosdb` | `usuario`, `preferencia` |
| ms-tiendas | `tiendasdb` | `tienda`, `resena`, `wishlist` |
| ms-productos | `productosdb` | `producto`, `precio` |
| ms-reportes | `reportesdb` | `reporte`, `sancion` |

### 8.2 Denormalización intencional

`reporte` guarda `nombre_tienda` y `nombre_producto` como strings, en
vez de JOINear a las otras bases. **Justificación**: evita acoplar
schemas, permite que la base de cada servicio evolucione
independientemente, y la denormalización es barata para datos que casi
nunca cambian (nombres de tiendas/productos).

### 8.3 Estrategia de generación de IDs

- La mayoría de las entidades usan `PanacheEntity` con secuencias
  `<tabla>_seq` (allocation size 50).
- `Reporte` usa `@GeneratedValue(strategy = IDENTITY)` con `reporte_id_seq`.

---

## 9. Patrones de diseño y arquitectura aplicados

| Patrón | Implementación | Beneficio |
|---|---|---|
| **API Gateway** | `api-gateway` con MicroProfile REST Client + JWT | Punto de entrada único, centraliza auth y enrutamiento |
| **Database per Service** | 4 bases independientes en Postgres | Aislamiento de schema, evolución independiente |
| **Service Discovery (DNS)** | Docker bridge `profeco-net` resuelve nombres de contenedores | Sin necesidad de Consul/Eureka para esta escala |
| **Reverse Proxy + Load Balancer** | Traefik delante del gateway | Escalado horizontal sin cambios de cliente |
| **Publish/Subscribe (fanout)** | RabbitMQ con exchanges `ofertas` e `inconsistencias` | Desacopla productores de N consumidores futuros |
| **Event-Driven Architecture** | Eventos AMQP + WebSocket | Procesos asíncronos para tareas que no bloquean al usuario |
| **CQRS-ish (lectura agregada)** | `ms-busqueda` agrega lecturas sin tener BD propia | Separa lectura de escritura sin las complicaciones de CQRS completo |
| **Polyglot protocol** | REST + gRPC + WebSocket + AMQP coexisten | Cada flujo usa el protocolo que mejor se ajusta |
| **Stateless authentication** | JWT en cookie/header, no hay sesión en servidor | Cualquier réplica del gateway puede atender cualquier petición |

---

## 10. Casos de uso para diagramas de secuencia

El reporte debe incluir **cinco diagramas de secuencia**. Aquí se
describen los pasos clave de cada uno; Claude web debe generarlos en
formato UML.

### Caso 1 — Login y obtención de JWT
1. Frontend POST `/api/auth/login` (HTTP/REST, sin JWT).
2. Traefik → api-gateway (HTTP round-robin).
3. Gateway matchea `@PermitAll`, reenvía a `ms-usuarios`.
4. `ms-usuarios` consulta `usuario` por email (JDBC, query parametrizada).
5. `BCrypt.checkpw(password, hash)` valida.
6. Verifica `activo = true`.
7. Construye JWT firmado RSA-2048 con `id`, `email`, `nombre`, `rol`, `groups`, `iss`, `exp=3600s`.
8. Devuelve `{ "token": "..." }` por toda la cadena.
9. Frontend lo guarda en cookie `profeco_token`.

**Seguridad**: BCrypt + RSA. **Comunicación**: síncrona en toda la
cadena porque el usuario espera el token.

### Caso 2 — Crear reporte que dispara sanción y notificación push
1. Consumidor envía POST `/api/reportes` con JWT en header.
2. Traefik → api-gateway.
3. Gateway verifica JWT con clave pública RSA y checa `@Authenticated`.
4. Reenvía a `ms-reportes` por REST.
5. `ms-reportes` persiste el reporte (JDBC).
6. Llama `contarPorTienda(tiendaId)`. Resultado: 3.
7. Como `total ≥ umbralAlerta (3)`, emite `AlertaInconsistenciaDTO` JSON
   al exchange `inconsistencias` (AMQP fanout, asíncrono).
8. Responde `201 CREATED` al usuario.
9. **(en paralelo)** RabbitMQ entrega el JSON a `ms-notificaciones`.
10. `ms-notificaciones.recibirInconsistencia()` hace broadcast a todas
    las sesiones WebSocket suscritas al canal `inconsistencias`.
11. Frontend del Admin recibe el evento por WebSocket y muestra toast.

**Seguridad**: JWT, query parametrizada, payload sin secretos.
**Comunicación**: REST síncrono (UX) + AMQP fanout asíncrono
(desacople) + WebSocket push (latencia).

### Caso 3 — Publicar oferta
1. Tienda POST `/api/productos/ofertas` con JWT.
2. Gateway verifica JWT + `@RolesAllowed({"TIENDA"})`. Si el rol no es
   TIENDA → `403 Forbidden`.
3. Reenvía a `ms-productos` por REST.
4. Persiste el precio con `esOferta=true` (JDBC).
5. Publica `OfertaDTO` al exchange `ofertas` (AMQP fanout, async).
6. Responde `201`.
7. **(en paralelo)** RabbitMQ → `ms-notificaciones` → broadcast
   WebSocket a todos los consumidores conectados al canal `ofertas`.

**Seguridad**: autorización por rol en el gateway, no en `ms-productos`.
**Comunicación**: igual patrón que Caso 2.

### Caso 4 — Comparación de precios vía REST (camino del navegador)
1. Frontend GET `/api/busqueda?nombre=leche` (público, sin JWT).
2. Gateway → `ms-busqueda:8086` (HTTP).
3. `BusquedaResource` → `BusquedaLogic.buscarPorNombre("leche")`.
4. `BusquedaLogic` hace varias llamadas REST salientes:
   - `GET ms-productos:8081/productos` → catálogo.
   - Filtra nombres que contienen "leche".
   - Por cada match: `GET ms-productos:8081/productos/{id}/precios`.
   - Por cada precio: `GET ms-tiendas:8082/tiendas/{tiendaId}`.
5. Construye lista ordenada de menor a mayor precio.
6. Responde JSON agregado al gateway → frontend.

**Seguridad**: endpoint público (catálogo no expone datos sensibles).
**Comunicación**: REST porque el origen es navegador y el costo de unas
llamadas internas en red privada es bajo. No se replica el catálogo para
evitar inconsistencia eventual.

### Caso 5 — Comparación de precios vía gRPC (camino inter-servicio)
1. Otro microservicio (o `grpcurl` desde dentro de `profeco-net`)
   construye `BusquedaRequest(nombre_producto="leche")` y lo serializa a
   **Protobuf binario**.
2. Abre conexión **HTTP/2** a `ms-busqueda:9000`.
3. `BusquedaGrpcService.buscarPrecios()` deserializa Protobuf.
4. Delega en **la misma `BusquedaLogic`** que el Caso 4.
5. `BusquedaLogic` ejecuta las **mismas llamadas REST salientes** a
   `ms-productos` y `ms-tiendas`.
6. `BusquedaGrpcService` mapea los DTOs internos al mensaje Protobuf
   `BusquedaResponse`.
7. Responde por gRPC/HTTP2.

**Seguridad**: red privada `profeco-net`, sin JWT en este demo (en
producción se agregaría mTLS o interceptor JWT).
**Comunicación**: gRPC/Protobuf por eficiencia binaria, contrato fuerte
vía `.proto`, multiplexing HTTP/2.

---

## 11. Diagramas requeridos en el reporte

Generar los siguientes diagramas en **PlantUML y Mermaid** (ambos
formatos, para que el lector elija):

### 11.1 Diagrama de componentes UML
Mostrar:
- 11 componentes lógicos (frontend, Traefik, gateway, 6 microservicios, Postgres, RabbitMQ).
- Interfaces proporcionadas/requeridas (lollipops y sockets).
- **`ms-busqueda` con DOS puertos proporcionados distintos** (REST 8086 y gRPC 9000).
- Etiquetas en cada arista con protocolo + patrón.

### 11.2 Diagrama de despliegue UML
Mostrar:
- Nodo "máquina del usuario" (host físico).
- Subnodo "navegador" donde corre el frontend.
- Nodo "Docker Engine" con la red `profeco-net` envolviendo los contenedores.
- Cada contenedor con su nombre, imagen y puertos.
- Distinguir puertos expuestos al host de puertos solo internos (gRPC 9000).

### 11.3 Cinco diagramas de secuencia UML
Uno por cada caso de uso de la sección 10. Cada uno debe:
- Distinguir mensajes síncronos (flecha sólida + return punteado) de
  asíncronos (etiqueta `async` o media flecha).
- Usar `par` para pasos en paralelo (especialmente en Casos 2 y 3).
- Etiquetar cada mensaje con protocolo y, si aplica, `Bearer JWT`.
- Acompañar con narrativa explicativa.

---

## 12. Estilo y formato del reporte

- **Idioma**: español.
- **Tono**: técnico-académico. Tercera persona ("se utiliza", "se
  decide").
- **Longitud objetivo**: 15–25 páginas A4.
- **Cada diagrama** debe ir acompañado de:
  - Una **leyenda** que liste cada componente/actor.
  - Una **narrativa** que explique paso a paso lo que muestra.
  - Una **justificación** del tipo de comunicación cuando aplique.
- **Cada decisión técnica** debe estar justificada (no decir "se usa
  RabbitMQ" sin explicar por qué).
- **Citar** los archivos del proyecto cuando se hable de implementación
  (ej. "ver `ms-reportes/src/main/java/com/profeco/reportes/Sancion.java`").

---

## 13. Información adicional disponible

Si el reporte requiere ejemplos concretos, hay disponibles:

- **Frontend rutas**: `/`, `/busqueda`, `/ofertas`, `/auth`,
  `/consumidor*`, `/tienda*`, `/admin*`.
- **API completa**: ver
  `api-gateway/src/main/java/com/profeco/gateway/GatewayResource.java`.
- **Contrato gRPC**: `ms-busqueda/src/main/proto/busqueda.proto`.
- **Datos de prueba**: `docker/seed-data.sql` (10 usuarios, 10 tiendas,
  20 productos, 74 precios, 9 reportes, 2 sanciones).
- **Despliegue**: `docker-compose.yml`, `DOCKER.md`, `README.md`.

---

## 14. Prompt sugerido para Claude web

> Eres un asistente técnico que va a redactar un **reporte académico
> completo** del proyecto **ProFeCo** (plataforma distribuida de
> comparación de precios). A continuación tienes todo el contexto técnico
> del proyecto: arquitectura, componentes, nodos físicos, comunicaciones,
> seguridad y casos de uso.
>
> Por favor produce un reporte en español, en formato Markdown, siguiendo
> **exactamente la estructura de la sección 1** de este briefing
> (Portada, Resumen ejecutivo, Introducción, Marco teórico, Arquitectura
> del sistema, Flujos del sistema, Justificación de comunicaciones
> distribuidas, Estrategias de seguridad, Modelo de datos, Patrones,
> Despliegue y operación, Limitaciones y trabajo futuro, Conclusiones,
> Referencias).
>
> Requisitos obligatorios:
>
> 1. Incluye **un diagrama de componentes UML**, **un diagrama de
>    despliegue UML** y **cinco diagramas de secuencia UML** (Login,
>    Reporte que dispara sanción, Publicar oferta, Búsqueda vía REST,
>    Búsqueda vía gRPC).
> 2. Cada diagrama debe generarse en **PlantUML y también en Mermaid**
>    para que el lector elija el formato.
> 3. Cada diagrama debe ir acompañado de **una leyenda y una narrativa
>    explicativa** suficientes para entender qué representa cada
>    componente, comunicación y nodo, sin tener que consultar otra
>    fuente.
> 4. **Justifica cada tipo de comunicación elegido** entre los
>    componentes distribuidos: REST, gRPC, WebSocket, AMQP, JDBC.
>    Explica por qué un canal es síncrono o asíncrono en cada caso.
> 5. **Explica las estrategias de seguridad** implementadas: JWT
>    RSA-2048, BCrypt, `@RolesAllowed`, aislamiento de red, queries
>    parametrizadas, CORS, credenciales del broker.
> 6. Cada decisión arquitectónica debe estar **justificada con
>    trade-offs**: no basta con decir "se usa X", hay que explicar por
>    qué X y no las alternativas.
> 7. **Documenta explícitamente** que `ms-busqueda` expone DOS
>    interfaces simultáneas (REST 8086 + gRPC 9000), por qué, y cómo
>    cada una se conecta con los demás componentes.
> 8. Cierra con **conclusiones** que evalúen cómo el sistema cumple los
>    objetivos de un curso de Sistemas Distribuidos (microservicios,
>    comunicación heterogénea, autenticación stateless, mensajería
>    asíncrona, escalado horizontal).
>
> [pegar aquí TODO el contenido de las secciones 1 a 13]
