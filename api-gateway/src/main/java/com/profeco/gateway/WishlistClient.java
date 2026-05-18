package com.profeco.gateway;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

// Cliente REST para la wishlist en ms-tiendas (mismo microservicio que tiendas y resenas).
@RegisterRestClient(configKey = "tiendas-api")
@Path("/wishlist")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public interface WishlistClient {

    @POST
    Response crear(Object body);

    @GET
    @Path("/tienda/{id}")
    Response listarPorTienda(@PathParam("id") Long id);

    @GET
    @Path("/usuario/{id}")
    Response listarPorUsuario(@PathParam("id") Long id);

    @PUT
    @Path("/{id}/estado")
    Response actualizarEstado(@PathParam("id") Long id, @QueryParam("estado") String estado);
}
