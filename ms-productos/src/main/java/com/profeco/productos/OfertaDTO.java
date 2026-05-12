package com.profeco.productos;

// Objeto que se envia como mensaje a RabbitMQ cuando se publica una oferta
// Este mismo objeto llega a ms-notificaciones y se reenvía por WebSocket
public class OfertaDTO {

    public Long productoId;
    public String nombreProducto;
    public Long tiendaId;
    public String nombreTienda;
    public double precioOriginal;
    public double precioOferta;
    public String descripcion;
    public String fechaExpiracion;

    // Constructor vacio requerido para deserializacion JSON
    public OfertaDTO() {}

    public OfertaDTO(Long productoId, String nombreProducto,
                     Long tiendaId, String nombreTienda,
                     double precioOriginal, double precioOferta,
                     String descripcion, String fechaExpiracion) {
        this.productoId = productoId;
        this.nombreProducto = nombreProducto;
        this.tiendaId = tiendaId;
        this.nombreTienda = nombreTienda;
        this.precioOriginal = precioOriginal;
        this.precioOferta = precioOferta;
        this.descripcion = descripcion;
        this.fechaExpiracion = fechaExpiracion;
    }
}
