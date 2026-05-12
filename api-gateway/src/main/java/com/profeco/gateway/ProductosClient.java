package com.profeco.gateway;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

// Cliente REST que el gateway usa para comunicarse con ms-productos
// La URL base se configura en application.properties como "productos-api"
@RegisterRestClient(configKey = "productos-api")
@Path("/productos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public interface ProductosClient {

    @GET
    Response listar();

    @GET
    @Path("/{id}")
    Response obtener(@PathParam("id") Long id);

    @POST
    Response crear(Object body);

    @GET
    @Path("/{id}/precios")
    Response listarPrecios(@PathParam("id") Long id);

    @POST
    @Path("/{id}/precios")
    Response agregarPrecio(@PathParam("id") Long id, Object body);

    @POST
    @Path("/ofertas")
    Response publicarOferta(Object body);
}
