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
- `ms-usuarios`, `ms-tiendas`, `ms-productos`, `ms-reportes`, `ms-busqueda`, `ms-notificaciones`
- `PostgreSQL` (4 bases independientes)
- `RabbitMQ` (exchanges fanout: `ofertas`, `inconsistencias`)

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

Se piden **cuatro diagramas de secuencia**. Cada uno cubre un flujo
end-to-end completo.

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

### Caso 4 — Comparación de precios ("Quién es Quién en los Precios")

**Actor principal**: Consumidor (puede ser anónimo, endpoint público).

**Resumen**: un usuario busca "leche" y el sistema devuelve el precio de
ese producto en todas las tiendas. Este caso ilustra la **agregación
síncrona** entre dos microservicios.

**Pasos detallados**:

1. **Usuario** escribe "leche" en la barra de búsqueda de `/busqueda`.
2. **Frontend** envía `GET http://localhost:8080/api/busqueda?nombre=leche`.
   - Endpoint público → sin JWT obligatorio.
3. **Traefik** → **api-gateway**.
4. **api-gateway** matchea `@PermitAll`, no valida JWT, reenvía a
   `http://ms-busqueda:8086/busqueda?nombre=leche`.
5. **ms-busqueda** orquesta dos llamadas REST en paralelo:
   - `GET http://ms-productos:8081/productos?nombre=leche` →
     devuelve los productos cuyo nombre matchea.
   - Por cada producto, `GET http://ms-productos:8081/productos/{id}/precios`
     → devuelve los precios en todas las tiendas.
   - `GET http://ms-tiendas:8082/tiendas` → para mapear `tiendaId` a
     `nombre`/`tipo`.
6. **ms-busqueda** **agrega** la respuesta: una lista de productos, cada
   uno con sus precios y nombre de la tienda. Identifica el precio más
   bajo y el más alto.
7. **ms-busqueda** responde al gateway con el JSON agregado.
8. **api-gateway** → **frontend**.
9. **Frontend** renderiza la comparación: tarjeta verde para el precio
   más bajo, roja para el más alto.

**Seguridad aplicada**:
- Endpoint público (`@PermitAll`). No se exponen datos sensibles — solo
  catálogo y precios, ambos pensados para visualización masiva.

**Comunicaciones (justificación)**:
- **REST síncrono** desde el inicio hasta el fin: el usuario espera el
  resultado de su búsqueda. No es un evento, es una consulta de lectura.
- `ms-busqueda` **no replica** los catálogos de productos ni tiendas;
  consulta en tiempo real. Justificación: la replicación traería
  problemas de consistencia eventual (mostrar precios desactualizados)
  y el costo de latencia agregada es aceptable porque solo hay 2–3
  llamadas REST y todas son en red privada de baja latencia.

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

### Ejemplo de etiqueta

```
Frontend -> Traefik: POST /api/reportes (HTTP, body, Bearer JWT)
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

---

## 5. Prompt sugerido para Claude web

> A continuación tienes el briefing completo de los flujos de ProFeCo.
> Por favor genera **cuatro diagramas de secuencia UML**, uno por cada
> caso de uso descrito (Login, Crear reporte + sanción, Publicar oferta,
> Comparar precios).
>
> Para cada diagrama:
> 1. Genera el código en **PlantUML** y también en **Mermaid** para que
>    pueda elegir el formato.
> 2. Distingue visualmente mensajes síncronos (flecha sólida + return
>    punteado) de asíncronos (etiqueta `async` o media flecha).
> 3. Usa `par` cuando haya pasos que ocurren en paralelo (p. ej., la
>    respuesta al usuario y la propagación del evento por RabbitMQ y
>    WebSocket).
> 4. Etiqueta cada mensaje con el protocolo (HTTP/REST, AMQP, WebSocket,
>    JDBC) y, si aplica, la cabecera de seguridad (`Bearer JWT`).
> 5. Acompaña cada diagrama con una **explicación textual** que
>    justifique por qué cada salto es síncrono o asíncrono, y qué
>    estrategia de seguridad se aplica.
>
> [pegar aquí TODO el contenido de las secciones 1–4]
