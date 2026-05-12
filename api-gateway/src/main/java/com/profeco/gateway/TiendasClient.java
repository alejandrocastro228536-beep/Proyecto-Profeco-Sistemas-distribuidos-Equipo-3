package com.profeco.gateway;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

// Cliente REST para comunicarse con ms-tiendas
@RegisterRestClient(configKey = "tiendas-api")
@Path("/tiendas")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public interface TiendasClient {

    @GET
    Response listar();

    @GET
    @Path("/{id}")
    Response obtener(@PathParam("id") Long id);

    @GET
    @Path("/tipo/{tipo}")
    Response listarPorTipo(@PathParam("tipo") String tipo);

    @POST
    Response crear(Object body);

    @PUT
    @Path("/{id}")
    Response actualizar(@PathParam("id") Long id, Object body);

    @DELETE
    @Path("/{id}")
    Response desactivar(@PathParam("id") Long id);
}
