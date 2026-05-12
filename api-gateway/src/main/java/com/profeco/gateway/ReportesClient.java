package com.profeco.gateway;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

// Cliente REST para comunicarse con ms-reportes
@RegisterRestClient(configKey = "reportes-api")
@Path("/reportes")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public interface ReportesClient {

    @GET
    Response listar();

    @GET
    @Path("/tienda/{id}")
    Response listarPorTienda(@PathParam("id") Long tiendaId);

    @POST
    Response crear(Object body);

    @PUT
    @Path("/{id}/estado")
    Response actualizarEstado(@PathParam("id") Long id, @QueryParam("estado") String estado);
}
