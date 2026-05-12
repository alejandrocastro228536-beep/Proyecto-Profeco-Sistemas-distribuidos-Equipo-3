package com.profeco.productos;

import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

// Endpoints REST del servicio de productos
// Base URL: http://localhost:8081/productos
@Path("/productos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ProductoResource {

    @Inject
    OfertaPublisher ofertaPublisher;

    // -------------------------------------------------------
    // PRODUCTOS
    // -------------------------------------------------------

    // GET /productos → lista todos los productos
    @GET
    @Transactional
    public List<Producto> listar() {
        return Producto.listAll();
    }

    // GET /productos/{id} → obtiene un producto por ID
    @GET
    @Path("/{id}")
    public Response obtener(@PathParam("id") Long id) {
        Producto p = Producto.findById(id);
        if (p == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"Producto no encontrado\"}")
                    .build();
        }
        return Response.ok(p).build();
    }

    // POST /productos → crea un producto nuevo
    @POST
    @Transactional
    public Response crear(Producto producto) {
        producto.persist();
        return Response.status(Response.Status.CREATED).entity(producto).build();
    }

    // DELETE /productos/{id} → elimina un producto
    @DELETE
    @Path("/{id}")
    @Transactional
    public Response eliminar(@PathParam("id") Long id) {
        boolean eliminado = Producto.deleteById(id);
        if (!eliminado) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"Producto no encontrado\"}")
                    .build();
        }
        return Response.noContent().build();
    }

    // -------------------------------------------------------
    // PRECIOS
    // -------------------------------------------------------

    // GET /productos/{id}/precios → lista todos los precios de un producto
    @GET
    @Path("/{id}/precios")
    public List<Precio> listarPrecios(@PathParam("id") Long id) {
        return Precio.findByProducto(id);
    }

    // POST /productos/{id}/precios → agrega un precio para ese producto en una tienda
    @POST
    @Path("/{id}/precios")
    @Transactional
    public Response agregarPrecio(@PathParam("id") Long id, Precio precio) {
        // Verificar que el producto existe
        Producto p = Producto.findById(id);
        if (p == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"Producto no encontrado\"}")
                    .build();
        }
        precio.productoId = id;
        precio.persist();
        return Response.status(Response.Status.CREATED).entity(precio).build();
    }

    // -------------------------------------------------------
    // OFERTAS (publica a RabbitMQ → llega a ms-notificaciones)
    // -------------------------------------------------------

    // POST /productos/ofertas → la tienda publica una oferta
    // Esto guarda el precio con esOferta=true Y envia el evento a RabbitMQ
    // ms-notificaciones consume ese evento y lo reenvía por WebSocket a los consumidores
    // ProductoResource.java — método publicarOferta
@POST
@Path("/ofertas")
@Transactional
public Response publicarOferta(OfertaDTO oferta) {
    // Verificar que el producto existe
    Producto p = Producto.findById(oferta.productoId);
    if (p == null) {
        return Response.status(Response.Status.NOT_FOUND)
                .entity("{\"error\": \"Producto no encontrado\"}")
                .build();
    }

    // Guardar el precio de oferta en BD
    Precio precio = new Precio(
        oferta.productoId,
        oferta.tiendaId,
        oferta.precioOferta,
        true
    );
    precio.persist();

    // Publicar en RabbitMQ
    ofertaPublisher.publicarOferta(oferta);

    return Response.ok()
            .entity("{\"mensaje\": \"Oferta publicada y notificacion enviada\"}")
            .build();
}
}
