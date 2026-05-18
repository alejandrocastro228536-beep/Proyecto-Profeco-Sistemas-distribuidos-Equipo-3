package com.profeco.tiendas;

import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.Map;

// Endpoints de resenas (calificacion + comentario) a tiendas
// Base URL: http://localhost:8082/resenas
@Path("/resenas")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ResenaResource {

    // POST /resenas → crea una resena
    // Body: {tiendaId, usuarioId, nombreUsuario, calificacion, comentario}
    @POST
    @Transactional
    public Response crear(Map<String, Object> body) {
        Long tiendaId = toLong(body.get("tiendaId"));
        if (tiendaId == null || Tienda.findById(tiendaId) == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"Tienda no encontrada\"}")
                    .build();
        }
        int cal = toInt(body.get("calificacion"));
        if (cal < 1 || cal > 5) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"calificacion debe estar entre 1 y 5\"}")
                    .build();
        }
        Resena r = new Resena(
            tiendaId,
            toLong(body.get("usuarioId")),
            (String) body.get("nombreUsuario"),
            cal,
            (String) body.get("comentario")
        );
        r.persist();
        return Response.status(Response.Status.CREATED).entity(r).build();
    }

    // GET /resenas/tienda/{id} → lista resenas de una tienda (consumidores ven antes de ir)
    @GET
    @Path("/tienda/{id}")
    public List<Resena> listarPorTienda(@PathParam("id") Long tiendaId) {
        return Resena.findByTienda(tiendaId);
    }

    // GET /resenas/tienda/{id}/resumen → promedio + total para el dashboard de la tienda
    @GET
    @Path("/tienda/{id}/resumen")
    public Response resumenTienda(@PathParam("id") Long tiendaId) {
        List<Resena> all = Resena.findByTienda(tiendaId);
        if (all.isEmpty()) {
            return Response.ok("{\"promedio\": 0, \"total\": 0}").build();
        }
        double promedio = all.stream().mapToInt(r -> r.calificacion).average().orElse(0.0);
        String json = "{\"promedio\": " + Math.round(promedio * 10) / 10.0
                + ", \"total\": " + all.size() + "}";
        return Response.ok(json).build();
    }

    // GET /resenas/usuario/{id} → resenas que un consumidor ha dejado
    @GET
    @Path("/usuario/{id}")
    public List<Resena> listarPorUsuario(@PathParam("id") Long usuarioId) {
        return Resena.findByUsuario(usuarioId);
    }

    // DELETE /resenas/{id} → borra una resena (el gateway controla quien puede)
    @DELETE
    @Path("/{id}")
    @Transactional
    public Response eliminar(@PathParam("id") Long id) {
        if (!Resena.deleteById(id)) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"Resena no encontrada\"}")
                    .build();
        }
        return Response.noContent().build();
    }

    private static Long toLong(Object v) {
        if (v == null) return null;
        if (v instanceof Number n) return n.longValue();
        return Long.parseLong(v.toString());
    }

    private static int toInt(Object v) {
        if (v == null) return 0;
        if (v instanceof Number n) return n.intValue();
        return Integer.parseInt(v.toString());
    }
}
