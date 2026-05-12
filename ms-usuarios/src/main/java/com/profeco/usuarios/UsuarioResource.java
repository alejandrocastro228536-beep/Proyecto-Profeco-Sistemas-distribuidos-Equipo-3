package com.profeco.usuarios;

import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.Map;

@Path("/usuarios")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UsuarioResource {

    @Inject
    AuthService authService;

    // POST /usuarios/registro
    @POST
    @Path("/registro")
    @Transactional
    public Response registrar(Map<String, String> datos) {
        if (Usuario.findByEmail(datos.get("email")).isPresent()) {
            return Response.status(Response.Status.CONFLICT)
                    .entity("{\"error\": \"El email ya esta registrado\"}")
                    .build();
        }
        Usuario u = new Usuario();
        u.email        = datos.get("email");
        u.passwordHash = authService.hashPassword(datos.get("password"));
        u.nombre       = datos.get("nombre");
        u.rol          = datos.getOrDefault("rol", "CONSUMIDOR");
        u.activo       = true;
        u.persist();
        return Response.status(Response.Status.CREATED)
                .entity("{\"mensaje\": \"Usuario registrado\", \"id\": " + u.id
                        + ", \"rol\": \"" + u.rol + "\"}")
                .build();
    }

    // POST /usuarios/login → devuelve token JWT
    @POST
    @Path("/login")
    public Response login(Map<String, String> datos) {
        try {
            String token = authService.login(datos.get("email"), datos.get("password"));
            return Response.ok()
                    .entity("{\"token\": \"" + token + "\"}")
                    .build();
        } catch (RuntimeException e) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity("{\"error\": \"" + e.getMessage() + "\"}")
                    .build();
        }
    }

    // GET /usuarios/{id}/preferencias
    @GET
    @Path("/{id}/preferencias")
    public List<Preferencia> listarPreferencias(@PathParam("id") Long id) {
        return Preferencia.findByUsuario(id);
    }

    // GET /usuarios/{id}/preferencias/{tipo}
    @GET
    @Path("/{id}/preferencias/{tipo}")
    public List<Preferencia> listarPorTipo(
            @PathParam("id") Long id,
            @PathParam("tipo") String tipo) {
        return Preferencia.findByUsuarioYTipo(id, tipo.toUpperCase());
    }

    // POST /usuarios/{id}/preferencias
    @POST
    @Path("/{id}/preferencias")
    @Transactional
    public Response agregarPreferencia(@PathParam("id") Long id, Preferencia pref) {
        pref.usuarioId = id;
        pref.persist();
        return Response.status(Response.Status.CREATED).entity(pref).build();
    }

    // DELETE /usuarios/{id}/preferencias/{prefId}
    @DELETE
    @Path("/{id}/preferencias/{prefId}")
    @Transactional
    public Response eliminarPreferencia(
            @PathParam("id") Long id,
            @PathParam("prefId") Long prefId) {
        boolean eliminado = Preferencia.deleteById(prefId);
        if (!eliminado) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"Preferencia no encontrada\"}")
                    .build();
        }
        return Response.noContent().build();
    }
}
