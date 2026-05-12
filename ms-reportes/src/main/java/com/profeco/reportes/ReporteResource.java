package com.profeco.reportes;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.smallrye.reactive.messaging.annotations.Channel;
import io.smallrye.reactive.messaging.annotations.Emitter;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import java.time.LocalDateTime;
import java.util.List;

// Endpoints REST del servicio de reportes
// Base URL: http://localhost:8084/reportes
@Path("/reportes")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ReporteResource {

    // Canal para publicar alertas en RabbitMQ
    @Inject
    @Channel("inconsistencias-out")
    Emitter<String> alertasEmitter;

    @Inject
    ObjectMapper objectMapper;

    // Umbral de reportes antes de enviar alerta (definido en application.properties)
    @ConfigProperty(name = "profeco.reportes.umbral-alerta", defaultValue = "3")
    int umbralAlerta;

    // GET /reportes → lista todos los reportes
    @GET
    public List<Reporte> listar() {
        return Reporte.listAll();
    }

    // GET /reportes/tienda/{id} → reportes de una tienda especifica (para ProFeCo)
    @GET
    @Path("/tienda/{id}")
    public List<Reporte> listarPorTienda(@PathParam("id") Long tiendaId) {
        return Reporte.findByTienda(tiendaId);
    }

    // POST /reportes → consumidor reporta una inconsistencia de precio
    // Si la tienda supera el umbral de reportes, se envia alerta a RabbitMQ
    @POST
    @Transactional
    public Response crear(Reporte reporte) {
        reporte.estado = "PENDIENTE";
        reporte.fechaReporte = LocalDateTime.now();
        reporte.persist();

        long totalReportes = Reporte.contarPorTienda(reporte.tiendaId);

        if (totalReportes >= umbralAlerta) {
            enviarAlerta(reporte.tiendaId, reporte.nombreTienda, totalReportes);
        }

        return Response.status(Response.Status.CREATED).entity(reporte).build();
    }

    // PUT /reportes/{id}/estado → ProFeCo actualiza el estado de un reporte
    @PUT
    @Path("/{id}/estado")
    @Transactional
    public Response actualizarEstado(@PathParam("id") Long id, @QueryParam("estado") String estado) {
        Reporte r = Reporte.findById(id);
        if (r == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"Reporte no encontrado\"}")
                    .build();
        }
        r.estado = estado.toUpperCase();
        return Response.ok(r).build();
    }

    // Metodo privado: publica una alerta en RabbitMQ
    private void enviarAlerta(Long tiendaId, String nombreTienda, long total) {
        try {
            AlertaInconsistenciaDTO alerta = new AlertaInconsistenciaDTO(tiendaId, nombreTienda, total);
            String json = objectMapper.writeValueAsString(alerta);
            alertasEmitter.send(json);
            System.out.println("[ms-reportes] Alerta enviada a RabbitMQ: " + json);
        } catch (Exception e) {
            System.err.println("[ms-reportes] Error al enviar alerta: " + e.getMessage());
        }
    }
}
