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
    @Inject @RestClient BusquedaClient busquedaClient;
    @Inject @RestClient SancionesClient sancionesClient;
    @Inject @RestClient ResenasClient resenasClient;
    @Inject @RestClient WishlistClient wishlistClient;

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

    // -------------------------------------------------------
    // BUSQUEDA — comparador "Quien es Quien en los Precios"
    // -------------------------------------------------------

    // GET /api/busqueda?nombre=leche → precios del producto en todas las tiendas
    @GET
    @Path("/busqueda")
    @PermitAll
    public Response buscar(@QueryParam("nombre") String nombre) {
        return busquedaClient.buscar(nombre);
    }

    // GET /api/busqueda/producto/{id} → compara precios de un producto especifico
    @GET
    @Path("/busqueda/producto/{id}")
    @PermitAll
    public Response compararProducto(@PathParam("id") Long id) {
        return busquedaClient.compararPorId(id);
    }

    // -------------------------------------------------------
    // SANCIONES — panel de ProFeCo
    // -------------------------------------------------------

    @GET
    @Path("/sanciones")
    @RolesAllowed({"ADMIN"})
    public Response listarSanciones() {
        return sancionesClient.listar();
    }

    @GET
    @Path("/sanciones/pendientes")
    @RolesAllowed({"ADMIN"})
    public Response listarSancionesPendientes() {
        return sancionesClient.listarPendientes();
    }

    @GET
    @Path("/sanciones/resumen")
    @RolesAllowed({"ADMIN"})
    public Response resumenSanciones() {
        return sancionesClient.resumen();
    }

    @GET
    @Path("/sanciones/tienda/{id}")
    @RolesAllowed({"ADMIN"})
    public Response sancionesPorTienda(@PathParam("id") Long id) {
        return sancionesClient.listarPorTienda(id);
    }

    @PUT
    @Path("/sanciones/{id}/aplicar")
    @RolesAllowed({"ADMIN"})
    public Response aplicarSancion(@PathParam("id") Long id) {
        return sancionesClient.aplicar(id);
    }

    // La tienda apela su propia sancion
    @PUT
    @Path("/sanciones/{id}/apelar")
    @RolesAllowed({"TIENDA", "ADMIN"})
    public Response apelarSancion(@PathParam("id") Long id) {
        return sancionesClient.apelar(id);
    }

    // -------------------------------------------------------
    // RESENAS — calificacion + comentario de un consumidor a una tienda
    // -------------------------------------------------------

    // POST /api/resenas → cualquier usuario logueado deja resena
    @POST
    @Path("/resenas")
    @Authenticated
    public Response crearResena(Object body) {
        return resenasClient.crear(body);
    }

    // GET /api/resenas/tienda/{id} → publico: ver resenas de una tienda
    @GET
    @Path("/resenas/tienda/{id}")
    @PermitAll
    public Response resenasDeTienda(@PathParam("id") Long id) {
        return resenasClient.listarPorTienda(id);
    }

    // GET /api/resenas/tienda/{id}/resumen → publico: promedio + total
    @GET
    @Path("/resenas/tienda/{id}/resumen")
    @PermitAll
    public Response resumenResenasTienda(@PathParam("id") Long id) {
        return resenasClient.resumenTienda(id);
    }

    // GET /api/resenas/usuario/{id} → el consumidor ve sus propias resenas
    @GET
    @Path("/resenas/usuario/{id}")
    @Authenticated
    public Response resenasDeUsuario(@PathParam("id") Long id) {
        return resenasClient.listarPorUsuario(id);
    }

    // DELETE /api/resenas/{id} → admin modera (o el consumidor borra la propia)
    @DELETE
    @Path("/resenas/{id}")
    @Authenticated
    public Response eliminarResena(@PathParam("id") Long id) {
        return resenasClient.eliminar(id);
    }

    // -------------------------------------------------------
    // WISHLIST — el consumidor le pide a la tienda que ofrezca un producto
    // -------------------------------------------------------

    // POST /api/wishlist → cualquier usuario logueado pide
    @POST
    @Path("/wishlist")
    @Authenticated
    public Response crearWishlist(Object body) {
        return wishlistClient.crear(body);
    }

    // GET /api/wishlist/tienda/{id} → la tienda (o ProFeCo) ve las peticiones
    @GET
    @Path("/wishlist/tienda/{id}")
    @RolesAllowed({"TIENDA", "ADMIN"})
    public Response wishlistDeTienda(@PathParam("id") Long id) {
        return wishlistClient.listarPorTienda(id);
    }

    // GET /api/wishlist/usuario/{id} → el consumidor ve sus propias peticiones
    @GET
    @Path("/wishlist/usuario/{id}")
    @Authenticated
    public Response wishlistDeUsuario(@PathParam("id") Long id) {
        return wishlistClient.listarPorUsuario(id);
    }

    // PUT /api/wishlist/{id}/estado → la tienda marca atendida/rechazada
    @PUT
    @Path("/wishlist/{id}/estado")
    @RolesAllowed({"TIENDA", "ADMIN"})
    public Response actualizarEstadoWishlist(
            @PathParam("id") Long id,
            @QueryParam("estado") String estado) {
        return wishlistClient.actualizarEstado(id, estado);
    }
}
