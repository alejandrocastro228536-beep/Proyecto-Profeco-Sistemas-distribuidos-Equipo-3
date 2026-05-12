package com.profeco.notificaciones;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.websocket.*;
import jakarta.websocket.server.PathParam;
import jakarta.websocket.server.ServerEndpoint;
import org.eclipse.microprofile.reactive.messaging.Incoming;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

// Servidor WebSocket que recibe eventos de RabbitMQ y los reenvía al browser
// Los clientes se conectan a: ws://localhost:8085/ws/notificaciones/{tipo}
// Tipos: "ofertas" o "inconsistencias"
@ServerEndpoint("/ws/notificaciones/{tipo}")
@ApplicationScoped
public class NotificacionSocket {

    // Mapa de sesiones activas agrupadas por tipo de canal
    // Clave: tipo (ofertas / inconsistencias), Valor: mapa sessionId → Session
    private final Map<String, Map<String, Session>> sesiones = new ConcurrentHashMap<>();

    // Se ejecuta cuando un cliente abre conexion WebSocket
    @OnOpen
    public void onOpen(Session session, @PathParam("tipo") String tipo) {
        // Agregar la sesion al grupo correspondiente
        sesiones.computeIfAbsent(tipo, k -> new ConcurrentHashMap<>())
                .put(session.getId(), session);
        System.out.println("[ms-notificaciones] Cliente conectado al canal '" + tipo
                + "' | sesion: " + session.getId());
    }

    // Se ejecuta cuando el cliente cierra la conexion
    @OnClose
    public void onClose(Session session, @PathParam("tipo") String tipo) {
        Map<String, Session> grupo = sesiones.get(tipo);
        if (grupo != null) {
            grupo.remove(session.getId());
        }
        System.out.println("[ms-notificaciones] Cliente desconectado del canal '" + tipo + "'");
    }

    // Se ejecuta si hay un error en la conexion
    @OnError
    public void onError(Session session, @PathParam("tipo") String tipo, Throwable error) {
        Map<String, Session> grupo = sesiones.get(tipo);
        if (grupo != null) {
            grupo.remove(session.getId());
        }
        System.err.println("[ms-notificaciones] Error en canal '" + tipo + "': " + error.getMessage());
    }

    // Escucha el exchange "ofertas" de RabbitMQ y reenvía a los clientes WebSocket suscritos
    @Incoming("ofertas-in")
    public void recibirOferta(String mensajeJson) {
        System.out.println("[ms-notificaciones] Oferta recibida de RabbitMQ → " + mensajeJson);
        broadcast("ofertas", mensajeJson);
    }

    // Escucha el exchange "inconsistencias" de RabbitMQ y reenvía al panel ProFeCo
    @Incoming("inconsistencias-in")
    public void recibirInconsistencia(String mensajeJson) {
        System.out.println("[ms-notificaciones] Inconsistencia recibida de RabbitMQ → " + mensajeJson);
        broadcast("inconsistencias", mensajeJson);
    }

    // Envia un mensaje a todos los clientes conectados en un canal especifico
    private void broadcast(String tipo, String mensaje) {
        Map<String, Session> grupo = sesiones.getOrDefault(tipo, Map.of());
        grupo.values().forEach(session ->
            session.getAsyncRemote().sendText(mensaje, result -> {
                if (!result.isOK()) {
                    System.err.println("[ms-notificaciones] Error enviando a sesion "
                            + session.getId() + ": " + result.getException().getMessage());
                }
            })
        );
        System.out.println("[ms-notificaciones] Mensaje enviado a " + grupo.size()
                + " cliente(s) en canal '" + tipo + "'");
    }
}
