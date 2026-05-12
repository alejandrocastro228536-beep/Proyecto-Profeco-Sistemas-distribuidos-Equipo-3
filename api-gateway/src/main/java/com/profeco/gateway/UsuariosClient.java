package com.profeco.gateway;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

// Cliente REST para comunicarse con ms-usuarios
@RegisterRestClient(configKey = "usuarios-api")
@Path("/usuarios")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public interface UsuariosClient {

    @POST
    @Path("/registro")
    Response registrar(Object body);

    @POST
    @Path("/login")
    Response login(Object body);

    @GET
    @Path("/{id}/preferencias")
    Response listarPreferencias(@PathParam("id") Long id);

    @GET
    @Path("/{id}/preferencias/{tipo}")
    Response listarPorTipo(@PathParam("id") Long id, @PathParam("tipo") String tipo);

    @POST
    @Path("/{id}/preferencias")
    Response agregarPreferencia(@PathParam("id") Long id, Object body);

    @DELETE
    @Path("/{id}/preferencias/{prefId}")
    Response eliminarPreferencia(@PathParam("id") Long id, @PathParam("prefId") Long prefId);
}
