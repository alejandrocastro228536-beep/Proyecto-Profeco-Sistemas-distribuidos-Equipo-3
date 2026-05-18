package com.profeco.gateway;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

// Cliente REST para las resenas (calificacion + comentario) en ms-tiendas.
// Reusa el mismo configKey que TiendasClient porque las resenas viven
// en el mismo microservicio (ms-tiendas :8082).
@RegisterRestClient(configKey = "tiendas-api")
@Path("/resenas")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public interface ResenasClient {

    @POST
    Response crear(Object body);

    @GET
    @Path("/tienda/{id}")
    Response listarPorTienda(@PathParam("id") Long id);

    @GET
    @Path("/tienda/{id}/resumen")
    Response resumenTienda(@PathParam("id") Long id);

    @GET
    @Path("/usuario/{id}")
    Response listarPorUsuario(@PathParam("id") Long id);

    @DELETE
    @Path("/{id}")
    Response eliminar(@PathParam("id") Long id);
}
