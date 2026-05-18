package com.profeco.gateway;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

// Cliente REST para el panel de sanciones de ms-reportes.
// Reusa el mismo configKey que ReportesClient porque las sanciones viven
// en el mismo microservicio (ms-reportes :8084).
@RegisterRestClient(configKey = "reportes-api")
@Path("/sanciones")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public interface SancionesClient {

    @GET
    Response listar();

    @GET
    @Path("/pendientes")
    Response listarPendientes();

    @GET
    @Path("/resumen")
    Response resumen();

    @GET
    @Path("/tienda/{id}")
    Response listarPorTienda(@PathParam("id") Long id);

    @PUT
    @Path("/{id}/aplicar")
    Response aplicar(@PathParam("id") Long id);

    @PUT
    @Path("/{id}/apelar")
    Response apelar(@PathParam("id") Long id);
}
