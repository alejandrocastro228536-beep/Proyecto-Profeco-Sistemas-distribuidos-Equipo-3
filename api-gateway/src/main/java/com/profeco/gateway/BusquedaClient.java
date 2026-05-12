package com.profeco.gateway;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

// Cliente REST para comunicarse con ms-busqueda
@RegisterRestClient(configKey = "busqueda-api")
@Path("/busqueda")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public interface BusquedaClient {

    // Busca productos por nombre y compara precios entre tiendas
    @GET
    Response buscar(@QueryParam("nombre") String nombre);

    // Compara precios de un producto especifico por ID
    @GET
    @Path("/producto/{id}")
    Response compararPorId(@PathParam("id") Long id);
}
