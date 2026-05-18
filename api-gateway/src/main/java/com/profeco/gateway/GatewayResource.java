package com.profeco.gateway;

import io.quarkus.security.Authenticated;
import jakarta.annotation.security.PermitAll;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.rest.client.inject.RestClient;

// Punto de entrada unico del sistema: http://localhost:8080
// Cada endpoint declara su politica de acceso:
//   @PermitAll               -> publico (status, login, registro, catalogo)
//   @Authenticated           -> requiere token valido, cualquier rol
//   @RolesAllowed({"TIENDA"})-> solo tiendas (publicar productos/precios/ofertas)
//   @RolesAllowed({"ADMIN"}) -> solo ProFeCo (ver reportes, sancionar)
@Path("/api")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class GatewayResource {

    @Inject @RestClient ProductosClient productosClient;
    @Inject @RestClient TiendasClient tiendasClient;
    @Inject @RestClient ReportesClient reportesClient;
    @Inject @RestClient UsuariosClient usuariosClient;

    // -------------------------------------------------------
    // STATUS — verifica que el gateway responde
    // -------------------------------------------------------

    // GET /api/status
    @GET
    @Path("/status")
    @PermitAll
    public Response status() {
        return Response.ok("{\"gateway\": \"activo\", \"version\": \"1.0.0\"}").build();
    }

    // -------------------------------------------------------
    // AUTENTICACION
    // -------------------------------------------------------

    // POST /api/auth/registro
    @POST
    @Path("/auth/registro")
    @PermitAll
    public Response registro(Object body) {
        return usuariosClient.registrar(body);
    }

    // POST /api/auth/login → devuelve token JWT
    @POST
    @Path("/auth/login")
    @PermitAll
    public Response login(Object body) {
        return usuariosClient.login(body);
    }

    // -------------------------------------------------------
    // PREFERENCIAS DEL CONSUMIDOR
    // -------------------------------------------------------

    @GET
    @Path("/usuarios/{id}/preferencias")
    @Authenticated
    public Response listarPreferencias(@PathParam("id") Long id) {
        return usuariosClient.listarPreferencias(id);
    }

    @GET
    @Path("/usuarios/{id}/preferencias/{tipo}")
    @Authenticated
    public Response preferenciasPorTipo(
            @PathParam("id") Long id,
            @PathParam("tipo") String tipo) {
        return usuariosClient.listarPorTipo(id, tipo);
    }

    @POST
    @Path("/usuarios/{id}/preferencias")
    @Authenticated
    public Response agregarPreferencia(@PathParam("id") Long id, Object body) {
        return usuariosClient.agregarPreferencia(id, body);
    }

    @DELETE
    @Path("/usuarios/{id}/preferencias/{prefId}")
    @Authenticated
    public Response eliminarPreferencia(
            @PathParam("id") Long id,
            @PathParam("prefId") Long prefId) {
        return usuariosClient.eliminarPreferencia(id, prefId);
    }

    // -------------------------------------------------------
    // PRODUCTOS
    // -------------------------------------------------------

    // GET /api/productos → lista catalogo completo
    @GET
    @Path("/productos")
    @PermitAll
    public Response listarProductos() {
        return productosClient.listar();
    }

    @GET
    @Path("/productos/{id}")
    @PermitAll
    public Response obtenerProducto(@PathParam("id") Long id) {
        return productosClient.obtener(id);
    }

    @POST
    @Path("/productos")
    @RolesAllowed({"TIENDA"})
    public Response crearProducto(Object body) {
        return productosClient.crear(body);
    }

    // GET /api/productos/{id}/precios → compara precios en todas las tiendas
    @GET
    @Path("/productos/{id}/precios")
    @PermitAll
    public Response verPrecios(@PathParam("id") Long id) {
        return productosClient.listarPrecios(id);
    }

    @POST
    @Path("/productos/{id}/precios")
    @RolesAllowed({"TIENDA"})
    public Response agregarPrecio(@PathParam("id") Long id, Object body) {
        return productosClient.agregarPrecio(id, body);
    }

    // POST /api/productos/ofertas → publica oferta + dispara RabbitMQ + WebSocket
    @POST
    @Path("/productos/ofertas")
    @RolesAllowed({"TIENDA"})
    public Response publicarOferta(Object body) {
        return productosClient.publicarOferta(body);
    }

    // -------------------------------------------------------
    // TIENDAS
    // -------------------------------------------------------

    @GET
    @Path("/tiendas")
    @PermitAll
    public Response listarTiendas() {
        return tiendasClient.listar();
    }

    @GET
    @Path("/tiendas/{id}")
    @PermitAll
    public Response obtenerTienda(@PathParam("id") Long id) {
        return tiendasClient.obtener(id);
    }

    // GET /api/tiendas/tipo/{tipo} → filtra SUPERMERCADO, MERCADO, TIANGUIS
    @GET
    @Path("/tiendas/tipo/{tipo}")
    @PermitAll
    public Response tiendaPorTipo(@PathParam("tipo") String tipo) {
        return tiendasClient.listarPorTipo(tipo);
    }

    @POST
    @Path("/tiendas")
    @RolesAllowed({"TIENDA", "ADMIN"})
    public Response crearTienda(Object body) {
        return tiendasClient.crear(body);
    }

    @PUT
    @Path("/tiendas/{id}")
    @RolesAllowed({"TIENDA", "ADMIN"})
    public Response actualizarTienda(@PathParam("id") Long id, Object body) {
        return tiendasClient.actualizar(id, body);
    }

    @DELETE
    @Path("/tiendas/{id}")
    @RolesAllowed({"ADMIN"})
    public Response desactivarTienda(@PathParam("id") Long id) {
        return tiendasClient.desactivar(id);
    }

    // -------------------------------------------------------
    // REPORTES DE INCONSISTENCIAS
    // -------------------------------------------------------

    // GET /api/reportes → panel ProFeCo ve todos los reportes
    @GET
    @Path("/reportes")
    @RolesAllowed({"ADMIN"})
    public Response listarReportes() {
        return reportesClient.listar();
    }

    @GET
    @Path("/reportes/tienda/{id}")
    @RolesAllowed({"ADMIN"})
    public Response reportesPorTienda(@PathParam("id") Long id) {
        return reportesClient.listarPorTienda(id);
    }

    // POST /api/reportes → consumidor reporta precio incorrecto
    // Al llegar al 3er reporte de la misma tienda se dispara alerta en RabbitMQ
    @POST
    @Path("/reportes")
    @Authenticated
    public Response crearReporte(Object body) {
        return reportesClient.crear(body);
    }

    // PUT /api/reportes/{id}/estado?estado=SANCIONADO → ProFeCo aplica sancion
    @PUT
    @Path("/reportes/{id}/estado")
    @RolesAllowed({"ADMIN"})
    public Response actualizarEstadoReporte(
            @PathParam("id") Long id,
            @QueryParam("estado") String estado) {
        return reportesClient.actualizarEstado(id, estado);
    }
}
