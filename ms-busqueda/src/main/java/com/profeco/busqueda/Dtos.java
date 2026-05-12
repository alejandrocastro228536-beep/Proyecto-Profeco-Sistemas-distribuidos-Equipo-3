package com.profeco.busqueda;

// DTOs que representan las respuestas JSON de ms-productos y ms-tiendas
// Quarkus los usa para deserializar automaticamente las respuestas REST

// Producto recibido de ms-productos
public class Dtos {

    // Representa un producto del catalogo
    public static class ProductoDTO {
        public Long id;
        public String nombre;
        public String categoria;
        public String descripcion;
    }

    // Representa el precio de un producto en una tienda
    public static class PrecioDTO {
        public Long id;
        public Long productoId;
        public Long tiendaId;
        public double precio;
        public boolean esOferta;
        public String fechaRegistro;
    }

    // Representa una tienda
    public static class TiendaDTO {
        public Long id;
        public String nombre;
        public String tipo;
        public String direccion;
        public String ciudad;
        public boolean activa;
    }

    // Resultado final que devuelve este servicio al gateway y al cliente
    public static class ResultadoBusquedaDTO {
        public Long productoId;
        public String nombreProducto;
        public Long tiendaId;
        public String nombreTienda;
        public String tipoTienda;
        public double precio;
        public boolean esOferta;

        public ResultadoBusquedaDTO() {}

        public ResultadoBusquedaDTO(Long productoId, String nombreProducto,
                                     Long tiendaId, String nombreTienda,
                                     String tipoTienda, double precio,
                                     boolean esOferta) {
            this.productoId     = productoId;
            this.nombreProducto = nombreProducto;
            this.tiendaId       = tiendaId;
            this.nombreTienda   = nombreTienda;
            this.tipoTienda     = tipoTienda;
            this.precio         = precio;
            this.esOferta       = esOferta;
        }
    }
}
