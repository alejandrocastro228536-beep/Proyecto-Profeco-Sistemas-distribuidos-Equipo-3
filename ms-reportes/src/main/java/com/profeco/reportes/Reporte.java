package com.profeco.reportes;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "reporte")
public class Reporte extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)  // ← IDENTITY, no SEQUENCE
    public Long id;

    @Column(name = "usuario_id")
    public Long usuarioId;
    @Column(name = "tienda_id")
    public Long tiendaId;
    @Column(name = "nombre_tienda")
    public String nombreTienda;
    @Column(name = "producto_id")
    public Long productoId;
    @Column(name = "nombre_producto")
    public String nombreProducto;
    @Column(name = "precio_publicado")
    public double precioPublicado;
    @Column(name = "precio_real")
    public double precioReal;
    public String descripcion;
    public String estado;
    @Column(name = "fecha_reporte")
    public LocalDateTime fechaReporte;

    public Reporte() {}

    public static long contarPorTienda(Long tiendaId) {
        return count("tiendaId = ?1 and estado = ?2", tiendaId, "PENDIENTE");
    }

    public static List<Reporte> findByTienda(Long tiendaId) {
        return list("tiendaId", tiendaId);
    }
}