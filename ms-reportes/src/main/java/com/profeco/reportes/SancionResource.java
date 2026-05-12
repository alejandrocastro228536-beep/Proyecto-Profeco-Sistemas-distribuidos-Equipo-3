package com.profeco.reportes;

import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

// Panel de sanciones para ProFeCo
// URL base: http://localhost:8084/sanciones
@Path("/sanciones")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SancionResource {

    // GET /sanciones → lista todas las sanciones
    @GET
    public List<Sancion> listar() {
        return Sancion.listAll();
    }

    // GET /sanciones/pendientes → solo las que estan pendientes de aplicar
    @GET
    @Path("/pendientes")
    public List<Sancion> listarPendientes() {
        return Sancion.findByEstado("PENDIENTE");
    }

    // GET /sanciones/tienda/{id} → historial de sanciones de una tienda
    @GET
    @Path("/tienda/{id}")
    public List<Sancion> listarPorTienda(@PathParam("id") Long tiendaId) {
        return Sancion.findByTienda(tiendaId);
    }

    // GET /sanciones/resumen → resumen para el dashboard de ProFeCo
    // Muestra cuantas tiendas hay en cada nivel de sancion
    @GET
    @Path("/resumen")
    public Response resumen() {
        long advertencias  = Sancion.count("nivel", "ADVERTENCIA");
        long multaMenor    = Sancion.count("nivel", "MULTA_MENOR");
        long multaMayor    = Sancion.count("nivel", "MULTA_MAYOR");
        long pendientes    = Sancion.count("estado", "PENDIENTE");
        long aplicadas     = Sancion.count("estado", "APLICADA");

        String json = "{"
            + "\"advertencias\": "  + advertencias + ","
            + "\"multaMenor\": "    + multaMenor   + ","
            + "\"multaMayor\": "    + multaMayor   + ","
            + "\"pendientes\": "    + pendientes   + ","
            + "\"aplicadas\": "     + aplicadas    + ","
            + "\"totalSanciones\": " + Sancion.count()
            + "}";

        return Response.ok(json).build();
    }

    // PUT /sanciones/{id}/aplicar → ProFeCo confirma y aplica la sancion
    @PUT
    @Path("/{id}/aplicar")
    @Transactional
    public Response aplicar(@PathParam("id") Long id) {
        Sancion s = Sancion.findById(id);
        if (s == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"Sancion no encontrada\"}")
                    .build();
        }
        if (!"PENDIENTE".equals(s.estado)) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"Solo se pueden aplicar sanciones en estado PENDIENTE\"}")
                    .build();
        }
        s.estado = "APLICADA";

        // Marcar como SANCIONADO todos los reportes de esa tienda
        Reporte.update("estado = 'SANCIONADO' where tiendaId = ?1 and estado = 'PENDIENTE'",
                s.tiendaId);

        return Response.ok(s).build();
    }

    // PUT /sanciones/{id}/apelar → la tienda apela la sancion
    @PUT
    @Path("/{id}/apelar")
    @Transactional
    public Response apelar(@PathParam("id") Long id) {
        Sancion s = Sancion.findById(id);
        if (s == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"Sancion no encontrada\"}")
                    .build();
        }
        s.estado = "APELADA";
        return Response.ok(s).build();
    }
}
