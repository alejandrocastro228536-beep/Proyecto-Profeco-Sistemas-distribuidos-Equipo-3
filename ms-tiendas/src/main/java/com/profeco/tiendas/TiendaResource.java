package com.profeco.tiendas;

import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

// Endpoints REST del servicio de tiendas
// Base URL: http://localhost:8082/tiendas
@Path("/tiendas")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TiendaResource {

    // GET /tiendas → lista todas las tiendas activas
    @GET
    public List<Tienda> listar() {
        return Tienda.list("activa", true);
    }

    // GET /tiendas/{id} → obtiene una tienda por ID
    @GET
    @Path("/{id}")
    public Response obtener(@PathParam("id") Long id) {
        Tienda t = Tienda.findById(id);
        if (t == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"Tienda no encontrada\"}")
                    .build();
        }
        return Response.ok(t).build();
    }

    // GET /tiendas/tipo/{tipo} → filtra por tipo (SUPERMERCADO, MERCADO, TIANGUIS)
    @GET
    @Path("/tipo/{tipo}")
    public List<Tienda> listarPorTipo(@PathParam("tipo") String tipo) {
        return Tienda.list("tipo", tipo.toUpperCase());
    }

    // POST /tiendas → registra una tienda nueva
    @POST
    @Transactional
    public Response crear(Tienda tienda) {
        tienda.activa = true;
        tienda.persist();
        return Response.status(Response.Status.CREATED).entity(tienda).build();
    }

    // PUT /tiendas/{id} → actualiza datos de una tienda
    @PUT
    @Path("/{id}")
    @Transactional
    public Response actualizar(@PathParam("id") Long id, Tienda datos) {
        Tienda t = Tienda.findById(id);
        if (t == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"Tienda no encontrada\"}")
                    .build();
        }
        // Solo actualizamos los campos que llegan
        if (datos.nombre != null)    t.nombre    = datos.nombre;
        if (datos.direccion != null) t.direccion = datos.direccion;
        if (datos.telefono != null)  t.telefono  = datos.telefono;
        return Response.ok(t).build();
    }

    // DELETE /tiendas/{id} → desactiva una tienda (no la borra)
    @DELETE
    @Path("/{id}")
    @Transactional
    public Response desactivar(@PathParam("id") Long id) {
        Tienda t = Tienda.findById(id);
        if (t == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"Tienda no encontrada\"}")
                    .build();
        }
        t.activa = false;
        return Response.ok("{\"mensaje\": \"Tienda desactivada\"}").build();
    }
}
