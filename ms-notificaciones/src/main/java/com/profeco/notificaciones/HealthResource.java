package com.profeco.notificaciones;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

// Endpoint simple para verificar que el servicio esta corriendo
@Path("/health")
public class HealthResource {

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public String status() {
        return "{\"servicio\": \"ms-notificaciones\", \"estado\": \"activo\"}";
    }
}
