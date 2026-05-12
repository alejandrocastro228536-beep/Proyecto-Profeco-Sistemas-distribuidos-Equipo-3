package com.profeco.busqueda;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

// Cliente REST interno que llama a ms-tiendas
@RegisterRestClient(configKey = "tiendas-interno")
@Path("/tiendas")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public interface TiendasInternoClient {

    // Obtiene el detalle de una tienda por su ID
    @GET
    @Path("/{id}")
    Dtos.TiendaDTO obtener(@PathParam("id") Long id);
}
