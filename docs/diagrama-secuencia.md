# Briefing — Diagramas de secuencia de ProFeCo

> **Cómo usar este archivo:** copia y pega todo este contenido en una
> conversación con Claude web pidiéndole que genere los **diagramas de
> secuencia UML** descritos. Al final hay un prompt explícito.

---

## 1. Contexto del proyecto

**ProFeCo** es una plataforma distribuida de comparación de precios entre
supermercados, mercados y tianguis en México, basada en microservicios
Quarkus, una API Gateway, mensajería asíncrona con RabbitMQ y
notificaciones en tiempo real vía WebSocket.

Actores:
- **Consumidor** (rol `CONSUMIDOR`)
- **Tienda** (rol `TIENDA`)
- **PROFECO** (rol `ADMIN`)

Componentes que aparecen en los diagramas:
- `profeco-frontend` (Next.js, en el navegador del usuario)
- `Traefik` (reverse proxy + load balancer, host:8080)
- `api-gateway` (Quarkus, valida JWT y enruta)
- `ms-usuarios`, `ms-tiendas`, `ms-productos`, `ms-reportes`, `ms-notificaciones`
- **`ms-busqueda`** — caso especial: expone dos interfaces simultáneas:
  - **HTTP/REST** en puerto 8086 (lo que consume el api-gateway)
  - **gRPC/Protobuf** en puerto 9000 (contrato `busqueda.proto`, solo accesible dentro de la red interna `profeco-net`)
- `PostgreSQL` (4 bases independientes)
- `RabbitMQ` (exchanges fanout: `ofertas`, `inconsistencias`)

> **Nota importante sobre `ms-busqueda`**: aunque expone gRPC, las
> llamadas **salientes** desde `ms-busqueda` hacia `ms-productos` y
> `ms-tiendas` se hacen por **HTTP/REST** (a través de los
> `@RegisterRestClient` `ProductosInternoClient` y `TiendasInternoClient`).
> El gRPC es solo para los **clientes** de `ms-busqueda`, no para sus
> dependencias.

---

## 2. Objetivo de los diagramas

Mostrar, paso a paso y con tiempos, **cómo fluyen las peticiones y
eventos** en los casos de uso más representativos del sistema, dejando
claro:

- Quién inicia cada interacción.
- Qué protocolo se usa en cada salto (HTTP/REST, AMQP, WebSocket, JDBC).
- Por qué la comunicación es síncrona o asíncrona en ese punto.
- Dónde se valida la seguridad (JWT, rol).
- Qué pasa cuando aparecen efectos laterales (publicación de eventos,
  actualización de estado, generación automática de sanciones).

---

## 3. Casos de uso a diagramar

Se piden **cinco diagramas de secuencia**. Cada uno cubre un flujo
end-to-end completo. Los casos 4 y 5 son variantes del mismo caso de uso
("Quién es Quién en los Precios") accedido por dos protocolos distintos,
para mostrar la coexistencia REST + gRPC.

---

### Caso 1 — Login y obtención de JWT

**Actor principal**: Consumidor (o cualquier rol).

**Resumen**: el usuario abre la página de login, envía email + password,
y el sistema le devuelve un JWT firmado que el frontend guarda en una
cookie (`profeco_token`).

**Pasos detallados**:

1. **Usuario** abre `/auth` en el navegador y llena el formulario.
2. **Frontend** envía `POST http://localhost:8080/api/auth/login` con
   body `{ "email": "...", "password": "..." }`.
   - Protocolo: HTTP/REST sobre TCP.
   - Comunicación **síncrona**: el frontend bloquea hasta recibir el
     token.
3. **Traefik** recibe la petición en el puerto 8080 y la reenvía a una
   réplica del `api-gateway` (round-robin).
   - Protocolo: HTTP interno en la red `profeco-net`.
4. **api-gateway** matchea la ruta `/api/auth/login`. Como el endpoint
   está marcado con `@PermitAll`, **NO** valida JWT (es el login mismo,
   todavía no hay token). Reenvía vía REST Client a
   `http://ms-usuarios:8083/usuarios/login`.
5. **ms-usuarios** recibe la petición. Llama a `AuthService.login()`:
   1. Consulta la BD: `SELECT * FROM usuario WHERE email = ?` (JDBC,
      query parametrizada → segura contra SQL injection).
   2. PostgreSQL devuelve la fila con el `passwordhash` (BCrypt).
   3. `BCrypt.checkpw(password, usuario.passwordHash)` compara.
      - Si no coincide → lanza excepción → 401 al cliente.
   4. Verifica `usuario.activo = true`.
   5. Construye el JWT con SmallRye JWT Builder:
      - `subject = id del usuario`
      - claims: `email`, `nombre`, `rol`
      - `groups = { rol }` (para `@RolesAllowed`)
      - `issuer = "profeco-app"`
      - `exp = 3600s` (1 hora)
      - firma con clave privada RSA-2048.
6. **ms-usuarios** devuelve `200 OK` con `{ "token": "eyJ0eXAi..." }` al
   gateway.
7. **api-gateway** propaga la respuesta a Traefik y a su vez al frontend.
8. **Frontend** guarda el token:
   - `document.cookie = "profeco_token=<token>; ..."`.
   - Header `Authorization: Bearer <token>` se incluirá en todas las
     llamadas siguientes.

**Seguridad aplicada**:
- Contraseña nunca viaja en BD en texto plano (BCrypt con salt único por
  usuario).
- JWT firmado con RSA-2048 → solo `ms-usuarios` puede emitir tokens
  válidos (tiene la clave privada).
- El token expira en 3600s → mitiga el robo de token a mediano plazo.

**Comunicaciones (justificación)**:
- Toda la cadena es **síncrona** porque el usuario espera el resultado
  del login. No tiene sentido publicar el login en una cola; necesitamos
  la respuesta para autorizar la sesión.
- HTTP/REST porque es el protocolo universal del navegador y permite
  contratos JSON simples.

---

### Caso 2 — Crear reporte que dispara sanción y notificación push

**Actor principal**: Consumidor autenticado.

**Resumen**: un consumidor reporta una inconsistencia de precio en
Chedraui Obregón. Era el **tercer reporte** pendiente contra esa tienda,
así que `ms-reportes` genera automáticamente una sanción y publica una
alerta en RabbitMQ. El panel de Admin (PROFECO) está suscrito al
WebSocket y recibe la alerta al instante.

Este es el caso más rico del sistema porque encadena: REST síncrono +
escritura en BD + publicación AMQP + recepción AMQP + push WebSocket.

**Pasos detallados**:

1. **Consumidor** llena el formulario en `/consumidor/reportar` con
   tienda, producto, precio publicado, precio real, descripción.
2. **Frontend** envía `POST http://localhost:8080/api/reportes` con el
   body del reporte y header `Authorization: Bearer <jwt>`.
3. **Traefik** → réplica del **api-gateway** (HTTP/REST, balanceado).
4. **api-gateway** verifica el JWT:
   - Decodifica con la clave pública RSA-2048.
   - Valida `issuer = "profeco-app"` y que no esté expirado.
   - Confirma que el endpoint admite `@Authenticated` (cualquier rol
     logueado).
5. **api-gateway** llama vía REST Client a
   `http://ms-reportes:8084/reportes`.
6. **ms-reportes** ejecuta `ReporteResource.crear()`:
   1. Setea `estado = "PENDIENTE"` y `fechaReporte = now()`.
   2. `reporte.persist()` → INSERT en `reportesdb.reporte` (JDBC).
   3. `Reporte.contarPorTienda(tiendaId)` → SELECT COUNT(*) WHERE
      `tienda_id = ?` AND `estado = 'PENDIENTE'`. Resultado: **3**.
   4. Como `total >= umbralAlerta (3)`, llama `enviarAlerta(...)`.
   5. `enviarAlerta` construye un DTO `AlertaInconsistenciaDTO(tiendaId,
      nombreTienda, total)`, lo serializa a JSON y lo emite por el canal
      `inconsistencias-out` (anotado con `@Channel("inconsistencias-out")`).
7. **SmallRye Reactive Messaging** publica el JSON al exchange
   `inconsistencias` de RabbitMQ.
   - Protocolo: AMQP 0.9.1.
   - Tipo de exchange: **fanout** (sin routing-key).
   - Comunicación **asíncrona, fire-and-forget**: `ms-reportes` no espera
     ack del consumidor; vuelve a su flujo y responde al gateway.
8. **ms-reportes** responde `201 CREATED` con el reporte al gateway.
9. **api-gateway** propaga la respuesta al frontend (síncrono).
10. **Frontend** muestra "Reporte enviado" al consumidor.

**(en paralelo, asíncronamente):**

11. **RabbitMQ** entrega el mensaje del exchange `inconsistencias` a
    todos los consumidores suscritos. Hoy hay uno: **ms-notificaciones**.
12. **ms-notificaciones** recibe el mensaje en `recibirInconsistencia()`
    (método anotado con `@Incoming("inconsistencias-in")`).
13. **ms-notificaciones** ejecuta `broadcast("inconsistencias", json)`:
    - Itera todas las sesiones WebSocket abiertas en el canal
      `inconsistencias` (la lista vive en memoria, `ConcurrentHashMap`).
    - Para cada sesión, llama `session.getAsyncRemote().sendText(json)`.
14. **Frontend del Admin** (que está conectado a
    `ws://localhost:8085/ws/notificaciones/inconsistencias`) recibe el
    JSON y muestra un toast/notificación: "Nueva alerta: Chedraui
    Obregón acumula 3 reportes pendientes".

**Seguridad aplicada**:
- Header `Authorization: Bearer <jwt>` validado en el gateway.
- El consumidor debe estar autenticado (`@Authenticated`).
- La consulta SQL usa parámetros (Panache) → segura contra inyección.
- El JSON publicado en RabbitMQ no contiene secretos (solo IDs y total).

**Comunicaciones (justificación)**:
- **REST síncrono** del frontend al gateway al `ms-reportes`: el usuario
  espera confirmación de que el reporte se registró.
- **AMQP asíncrono** de `ms-reportes` a RabbitMQ: la generación de la
  alerta no debe bloquear ni fallar la respuesta al usuario. Si
  RabbitMQ está caído, el reporte igual se registra; el broker reintenta
  cuando vuelva.
- **AMQP fanout**: hoy solo `ms-notificaciones` consume; mañana se
  podría agregar `ms-analytics` o un sistema de email sin modificar al
  productor.
- **WebSocket** de `ms-notificaciones` al frontend del Admin:
  *push iniciado por el servidor*. Un Admin no debería tener que
  recargar la página o hacer polling — la alerta es urgente.

---

### Caso 3 — Publicación de oferta y broadcast en tiempo real

**Actor principal**: Usuario con rol `TIENDA`.

**Resumen**: una tienda publica una oferta de "Leche entera 1L a $22.00".
El evento se publica en RabbitMQ y todos los consumidores conectados al
WebSocket de ofertas la reciben al instante.

**Pasos detallados**:

1. **Usuario TIENDA** llena el formulario en `/tienda/ofertas/nueva`.
2. **Frontend** envía `POST http://localhost:8080/api/productos/ofertas`
   con el cuerpo de la oferta y el JWT.
3. **Traefik** → **api-gateway**.
4. **api-gateway** verifica JWT y comprueba
   `@RolesAllowed({"TIENDA"})`. Si el rol no es TIENDA → `403 Forbidden`.
5. **api-gateway** llama por REST a
   `http://ms-productos:8081/productos/ofertas`.
6. **ms-productos**:
   1. Persiste la oferta (precio con `esOferta = true`) en
      `productosdb.precio` (JDBC).
   2. Construye `OfertaDTO` y lo emite por `@Channel("ofertas-out")`
      → publica al exchange `ofertas` (fanout) en RabbitMQ.
   3. Responde `201 CREATED` al gateway.
7. **api-gateway** → **frontend de la tienda**: "Oferta publicada".

**(asíncronamente):**

8. **RabbitMQ** entrega el mensaje del exchange `ofertas` a
   **ms-notificaciones**.
9. **ms-notificaciones** ejecuta `broadcast("ofertas", json)` a todos
   los WebSockets conectados a
   `ws://localhost:8085/ws/notificaciones/ofertas`.
10. **Frontends de los consumidores** que están en `/ofertas` (o
    cualquier vista que escuche el WS) reciben el JSON y agregan la
    nueva oferta a la lista al instante.

**Seguridad aplicada**:
- `@RolesAllowed({"TIENDA"})` impide que un consumidor publique ofertas
  haciéndose pasar por tienda.
- La autorización se valida en el gateway, no en `ms-productos`: una
  sola capa de auth para todo el sistema.

**Comunicaciones (justificación)**:
- Igual que el caso 2: **REST síncrono** hasta confirmar el alta,
  **AMQP asíncrono** para difundir el evento, **WebSocket** para empujar
  al cliente.
- Si en el futuro se agregan canales (email, push notification de móvil),
  solo hay que sumar consumidores al exchange `ofertas`.

---

### Caso 4 — Comparación de precios vía REST (camino del navegador)

**Actor principal**: Consumidor (puede ser anónimo, endpoint público).

**Resumen**: un usuario busca "leche" desde el navegador y el sistema
devuelve el precio de ese producto en todas las tiendas. Este caso
ilustra la **agregación síncrona** dentro de `ms-busqueda`, que combina
datos de `ms-productos` y `ms-tiendas`.

**Pasos detallados**:

1. **Usuario** escribe "leche" en la barra de búsqueda de `/busqueda`.
2. **Frontend** envía `GET http://localhost:8080/api/busqueda?nombre=leche`.
   - Protocolo: HTTP/REST + JSON.
   - Endpoint público → sin JWT obligatorio.
3. **Traefik** → **api-gateway**.
4. **api-gateway** matchea `@PermitAll`, no valida JWT, reenvía vía REST
   a `http://ms-busqueda:8086/busqueda?nombre=leche` (puerto **HTTP/REST**
   de `ms-busqueda`, atendido por `BusquedaResource`).
5. **ms-busqueda.BusquedaResource** delega en `BusquedaLogic`, que
   orquesta llamadas REST salientes a los otros microservicios:
   - `GET http://ms-productos:8081/productos` (`ProductosInternoClient.listar()`)
     → trae el catálogo y filtra los productos cuyo nombre contiene "leche".
   - Por cada producto que matchea:
     `GET http://ms-productos:8081/productos/{id}/precios`
     (`ProductosInternoClient.listarPrecios(id)`) → trae los precios en
     todas las tiendas.
     Y por cada precio: `GET http://ms-tiendas:8082/tiendas/{tiendaId}`
     (`TiendasInternoClient.obtener(id)`) → enriquece con
     `nombre`/`tipo` de la tienda.
   - **Todas estas llamadas son HTTP/REST + JSON.** No son gRPC.
6. **ms-busqueda** **agrega** la respuesta: lista de resultados ordenada
   por precio (de menor a mayor) con producto, tienda y bandera de
   oferta.
7. **ms-busqueda** responde al gateway con el JSON agregado
   (`BusquedaResponseDTO`).
8. **api-gateway** → **frontend**.
9. **Frontend** renderiza la comparación.

**Seguridad aplicada**:
- Endpoint público (`@PermitAll`). No se exponen datos sensibles — solo
  catálogo y precios, ambos pensados para visualización masiva.

**Comunicaciones (justificación)**:
- **REST síncrono** desde el inicio hasta el fin: el usuario espera el
  resultado de su búsqueda. No es un evento, es una consulta de lectura.
- Se usa REST y no gRPC porque el cliente original es un **navegador**.
  El navegador no habla gRPC nativo (necesitaría gRPC-web + un proxy
  adicional), y el gateway ya centraliza HTTP/JWT. Mantener HTTP en este
  camino simplifica la arquitectura.
- `ms-busqueda` **no replica** los catálogos; consulta en tiempo real.
  La replicación traería problemas de consistencia eventual (precios
  desactualizados) y el costo de latencia agregada es aceptable porque
  todas las llamadas son en red privada `profeco-net` de baja latencia.

---

### Caso 5 — Comparación de precios vía gRPC (camino inter-servicio)

**Actor principal**: Otro microservicio o herramienta de prueba
(p. ej. `grpcurl`) que vive dentro de la red `profeco-net`.

**Resumen**: el mismo caso de uso del Caso 4, pero accediendo por la
**interfaz gRPC** de `ms-busqueda`. Sirve para mostrar la coexistencia
de protocolos y por qué un consumidor inter-servicio escogería gRPC en
lugar de REST.

**Contexto técnico**:
- `ms-busqueda` corre dos servidores simultáneos:
  - HTTP server en puerto **8086** (atiende REST)
  - gRPC server en puerto **9000** (atiende Protobuf)
- El contrato gRPC está en `ms-busqueda/src/main/proto/busqueda.proto`:
  - Servicio: `BusquedaService`
  - RPC: `BuscarPrecios(BusquedaRequest) returns (BusquedaResponse)`
  - RPC: `CompararPorId(CompararRequest) returns (BusquedaResponse)`
- El puerto 9000 **NO está mapeado al host** en `docker-compose.yml` —
  solo es alcanzable desde dentro de la red Docker `profeco-net`. Esto
  es intencional: gRPC es para comunicación intra-clúster.

**Pasos detallados**:

1. **Cliente gRPC** (otro microservicio o `grpcurl` dentro de un
   contenedor de la red `profeco-net`) construye un `BusquedaRequest`
   con `nombre_producto = "leche"`.
2. **Cliente** serializa el mensaje a **Protobuf binario** y abre una
   conexión **HTTP/2** a `ms-busqueda:9000` (gRPC corre sobre HTTP/2).
3. **ms-busqueda.BusquedaGrpcService** recibe el RPC `BuscarPrecios`.
   Quarkus deserializa el Protobuf a la clase generada `BusquedaRequest`
   a partir del `.proto`.
4. **BusquedaGrpcService.buscarPrecios()** delega en la **misma**
   `BusquedaLogic` que usa la interfaz REST (sección 5 del Caso 4).
5. `BusquedaLogic` ejecuta las mismas llamadas REST salientes a
   `ms-productos` y `ms-tiendas`:
   - `GET http://ms-productos:8081/productos`
   - `GET http://ms-productos:8081/productos/{id}/precios`
   - `GET http://ms-tiendas:8082/tiendas/{tiendaId}`
6. **BusquedaGrpcService** convierte los `ResultadoBusquedaDTO`
   internos al mensaje Protobuf `ResultadoPrecio` y los empaqueta en
   un `BusquedaResponse`.
7. **ms-busqueda** serializa el `BusquedaResponse` a Protobuf y lo
   envía al cliente sobre HTTP/2.
8. **Cliente gRPC** deserializa el binario a la clase generada y
   consume el resultado.

**Seguridad aplicada**:
- En esta implementación demo, el endpoint gRPC **no requiere JWT**:
  vive en la red privada `profeco-net` y se asume confianza
  intra-clúster (mismo modelo de seguridad que las llamadas REST
  internas entre `api-gateway` y los demás microservicios).
- En producción real se podría agregar TLS mutuo (mTLS) entre
  microservicios o un interceptor de gRPC que valide JWT, igual que el
  gateway lo hace sobre HTTP.

**Comunicaciones (justificación)**:
- **gRPC sobre HTTP/2 + Protobuf**:
  - **Eficiencia**: payload binario, varias veces más pequeño que el
    JSON equivalente; serialización/deserialización más rápida.
  - **Contrato fuerte**: el `.proto` es la fuente de verdad. Tanto el
    servidor como el cliente generan código tipado a partir del
    archivo; cualquier cambio incompatible se detecta en compilación.
  - **Multiplexing HTTP/2**: múltiples RPCs concurrentes sobre una
    misma conexión TCP, ideal para tráfico inter-servicio sostenido.
  - **Streaming** disponible (no usado aquí, pero parte del contrato
    gRPC) para futuros casos de uso de resultados parciales.
- **Sigue siendo REST** la salida de `ms-busqueda` hacia `ms-productos`
  y `ms-tiendas` — el cambio de protocolo de entrada no propaga; cada
  microservicio elige el protocolo que mejor se ajusta a sus
  consumidores.

---

## 4. Notación sugerida para los diagramas

- **UML de secuencia clásico**: actores arriba como columnas, líneas de
  vida verticales, mensajes como flechas horizontales etiquetadas con el
  método/protocolo, activaciones rectangulares en cada participante.
- Distinguir visualmente:
  - **Mensaje síncrono**: flecha sólida con cabeza llena.
  - **Respuesta**: flecha punteada hacia atrás.
  - **Mensaje asíncrono** (AMQP, WebSocket push): flecha sólida con
    media cabeza (o etiquetada `async`).
- Usar **`alt` / `opt` / `par`** para ramas (ej.: en el Caso 2,
  envolver los pasos 11–14 en un `par` que indique que ocurren en
  paralelo al return al usuario).
- Etiquetar cada mensaje con:
  - Verbo HTTP + path (`POST /api/reportes`) o método del componente
    (`emitter.send(json)`).
  - Protocolo entre paréntesis (`HTTP/REST`, `AMQP fanout`, `WebSocket`).
  - Seguridad si aplica (`+ Authorization: Bearer JWT`).

Se puede generar en **PlantUML** (`@startuml ... @enduml` con
`participant`/`actor`/`->`/`-->>`) o en **Mermaid**
(`sequenceDiagram`). Ambos texto.

### Ejemplo de etiqueta (Caso 2 — reporte que dispara sanción)

```
Frontend -> Traefik: POST /api/reportes (HTTP/REST, Bearer JWT)
Traefik -> api-gateway: HTTP (round-robin)
api-gateway -> api-gateway: verify JWT (RSA pubkey)
api-gateway -> ms-reportes: POST /reportes (HTTP/REST interno)
ms-reportes -> PostgreSQL: INSERT reporte (JDBC)
PostgreSQL --> ms-reportes: ok, id=...
ms-reportes -> RabbitMQ: publish alerta (AMQP fanout, async)
ms-reportes --> api-gateway: 201 Created
api-gateway --> Frontend: 201 Created

par
  RabbitMQ -> ms-notificaciones: deliver (AMQP)
  ms-notificaciones -> Frontend (Admin): send (WebSocket, async)
end
```

### Ejemplo de etiqueta (Caso 5 — comparación vía gRPC)

```
Cliente gRPC -> ms-busqueda: BuscarPrecios(nombre="leche")  \
                                                            } gRPC/HTTP2 + Protobuf
note: payload binario, no JSON                              /

ms-busqueda -> ms-productos: GET /productos        (HTTP/REST + JSON saliente)
ms-productos --> ms-busqueda: [productos...]
ms-busqueda -> ms-productos: GET /productos/{id}/precios (HTTP/REST + JSON)
ms-productos --> ms-busqueda: [precios...]
ms-busqueda -> ms-tiendas: GET /tiendas/{id}       (HTTP/REST + JSON)
ms-tiendas --> ms-busqueda: tienda
ms-busqueda --> Cliente gRPC: BusquedaResponse     (gRPC/HTTP2 + Protobuf)
```

---

## 5. Prompt sugerido para Claude web

> A continuación tienes el briefing completo de los flujos de ProFeCo.
> Por favor genera **cinco diagramas de secuencia UML**, uno por cada
> caso de uso descrito (Login, Crear reporte + sanción, Publicar oferta,
> Comparar precios vía REST, Comparar precios vía gRPC).
>
> Para cada diagrama:
> 1. Genera el código en **PlantUML** y también en **Mermaid** para que
>    pueda elegir el formato.
> 2. Distingue visualmente mensajes síncronos (flecha sólida + return
>    punteado) de asíncronos (etiqueta `async` o media flecha).
> 3. Usa `par` cuando haya pasos que ocurren en paralelo (p. ej., la
>    respuesta al usuario y la propagación del evento por RabbitMQ y
>    WebSocket).
> 4. Etiqueta cada mensaje con el protocolo (**HTTP/REST + JSON**,
>    **gRPC sobre HTTP/2 + Protobuf**, **AMQP**, **WebSocket**, **JDBC**)
>    y, si aplica, la cabecera de seguridad (`Bearer JWT`).
> 5. En los Casos 4 y 5, muestra explícitamente que `ms-busqueda` corre
>    **dos servidores simultáneos** (HTTP en 8086 y gRPC en 9000) y que
>    ambos delegan en la misma `BusquedaLogic`, que internamente sale por
>    REST a `ms-productos` y `ms-tiendas`.
> 6. Acompaña cada diagrama con una **explicación textual** que
>    justifique por qué cada salto es síncrono o asíncrono, qué protocolo
>    se eligió en cada punto y qué estrategia de seguridad se aplica.
>
> [pegar aquí TODO el contenido de las secciones 1–4]
