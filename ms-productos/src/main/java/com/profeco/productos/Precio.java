package com.profeco.productos;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "precio")
public class Precio extends PanacheEntity {

    // @Column le dice a Hibernate exactamente como llamar la columna en H2
    @Column(name = "producto_id")
    public Long productoId;

    @Column(name = "tienda_id")
    public Long tiendaId;

    public double precio;

    @Column(name = "es_oferta")
    public boolean esOferta;

    @Column(name = "fecha_registro")
    public LocalDateTime fechaRegistro;

    public Precio() {}

    public Precio(Long productoId, Long tiendaId, double precio, boolean esOferta) {
        this.productoId = productoId;
        this.tiendaId = tiendaId;
        this.precio = precio;
        this.esOferta = esOferta;
        this.fechaRegistro = LocalDateTime.now();
    }

    public static List<Precio> findByProducto(Long productoId) {
        return list("productoId", productoId);
    }

    public static List<Precio> findByTienda(Long tiendaId) {
        return list("tiendaId", tiendaId);
    }
}