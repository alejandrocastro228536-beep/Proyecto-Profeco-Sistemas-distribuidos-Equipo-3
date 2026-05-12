package com.profeco.productos;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.smallrye.reactive.messaging.annotations.Channel;
import io.smallrye.reactive.messaging.annotations.Emitter;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

// Servicio que publica mensajes de oferta al exchange de RabbitMQ
@ApplicationScoped
public class OfertaPublisher {

    // Canal declarado en application.properties como "ofertas-out"
    @Inject
    @Channel("ofertas-out")
    Emitter<String> ofertasEmitter;

    // Jackson para convertir el objeto a JSON
    @Inject
    ObjectMapper objectMapper;

    // Convierte la oferta a JSON y la envia a RabbitMQ
    public void publicarOferta(OfertaDTO oferta) {
        try {
            String json = objectMapper.writeValueAsString(oferta);
            ofertasEmitter.send(json);
            System.out.println("[ms-productos] Oferta publicada en RabbitMQ: " + json);
        } catch (Exception e) {
            System.err.println("[ms-productos] Error al publicar oferta: " + e.getMessage());
        }
    }
}
