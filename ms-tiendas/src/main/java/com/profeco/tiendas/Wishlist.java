package com.profeco.tiendas;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.List;

// Peticion de un consumidor a una tienda para que ofrezca un producto
// Ej: "Por favor traigan leche descremada deslactosada"
@Entity
@Table(name = "wishlist")
public class Wishlist extends PanacheEntity {

    @Column(name = "tienda_id")
    public Long tiendaId;

    @Column(name = "usuario_id")
    public Long usuarioId;

    @Column(name = "nombre_usuario")
    public String nombreUsuario;

    @Column(name = "descripcion_producto", length = 500)
    public String descripcionProducto;

    // PENDIENTE | ATENDIDA | RECHAZADA
    public String estado;

    public LocalDateTime fecha;

    public Wishlist() {}

    public Wishlist(Long tiendaId, Long usuarioId, String nombreUsuario,
                    String descripcionProducto) {
        this.tiendaId = tiendaId;
        this.usuarioId = usuarioId;
        this.nombreUsuario = nombreUsuario;
        this.descripcionProducto = descripcionProducto;
        this.estado = "PENDIENTE";
        this.fecha = LocalDateTime.now();
    }

    public static List<Wishlist> findByTienda(Long tiendaId) {
        return list("tiendaId = ?1 order by fecha desc", tiendaId);
    }

    public static List<Wishlist> findByUsuario(Long usuarioId) {
        return list("usuarioId = ?1 order by fecha desc", usuarioId);
    }
}
