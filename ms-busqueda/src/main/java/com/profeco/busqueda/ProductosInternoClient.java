package com.profeco.busqueda;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;
import java.util.List;

// Cliente REST interno que llama a ms-productos
// Solo lo usa ms-busqueda — no es el mismo client del gateway
@RegisterRestClient(configKey = "productos-interno")
@Path("/productos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public interface ProductosInternoClient {

    // Lista todos los productos del catalogo
    @GET
    List<Dtos.ProductoDTO> listar();

    // Obtiene los precios de un producto en todas las tiendas
    @GET
    @Path("/{id}/precios")
    List<Dtos.PrecioDTO> listarPrecios(@PathParam("id") Long id);
}
