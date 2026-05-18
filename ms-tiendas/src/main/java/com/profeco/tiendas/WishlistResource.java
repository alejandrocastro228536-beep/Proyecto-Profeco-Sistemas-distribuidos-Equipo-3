package com.profeco.tiendas;

import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.Map;
import java.util.Set;

// Endpoints de wishlist: el consumidor pide productos a la tienda
// Base URL: http://localhost:8082/wishlist
@Path("/wishlist")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class WishlistResource {

    private static final Set<String> ESTADOS_VALIDOS =
            Set.of("PENDIENTE", "ATENDIDA", "RECHAZADA");

    // POST /wishlist → consumidor crea una peticion
    // Body: {tiendaId, usuarioId, nombreUsuario, descripcionProducto}
    @POST
    @Transactional
    public Response crear(Map<String, Object> body) {
        Long tiendaId = toLong(body.get("tiendaId"));
        if (tiendaId == null || Tienda.findById(tiendaId) == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"Tienda no encontrada\"}")
                    .build();
        }
        String descripcion = (String) body.get("descripcionProducto");
        if (descripcion == null || descripcion.isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"descripcionProducto requerida\"}")
                    .build();
        }
        Wishlist w = new Wishlist(
            tiendaId,
            toLong(body.get("usuarioId")),
            (String) body.get("nombreUsuario"),
            descripcion
        );
        w.persist();
        return Response.status(Response.Status.CREATED).entity(w).build();
    }

    // GET /wishlist/tienda/{id} → la tienda ve las peticiones que le hicieron
    @GET
    @Path("/tienda/{id}")
    public List<Wishlist> listarPorTienda(@PathParam("id") Long tiendaId) {
        return Wishlist.findByTienda(tiendaId);
    }

    // GET /wishlist/usuario/{id} → el consumidor ve sus propias peticiones
    @GET
    @Path("/usuario/{id}")
    public List<Wishlist> listarPorUsuario(@PathParam("id") Long usuarioId) {
        return Wishlist.findByUsuario(usuarioId);
    }

    // PUT /wishlist/{id}/estado?estado=ATENDIDA → la tienda marca como atendida o rechazada
    @PUT
    @Path("/{id}/estado")
    @Transactional
    public Response actualizarEstado(@PathParam("id") Long id,
                                     @QueryParam("estado") String estado) {
        if (estado == null || !ESTADOS_VALIDOS.contains(estado.toUpperCase())) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"estado debe ser PENDIENTE, ATENDIDA o RECHAZADA\"}")
                    .build();
        }
        Wishlist w = Wishlist.findById(id);
        if (w == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"Peticion no encontrada\"}")
                    .build();
        }
        w.estado = estado.toUpperCase();
        return Response.ok(w).build();
    }

    private static Long toLong(Object v) {
        if (v == null) return null;
        if (v instanceof Number n) return n.longValue();
        return Long.parseLong(v.toString());
    }
}
