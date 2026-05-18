package com.profeco.tiendas;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.List;

// Resena de un consumidor sobre una tienda: calificacion 1-5 + comentario opcional
@Entity
@Table(name = "resena")
public class Resena extends PanacheEntity {

    @Column(name = "tienda_id")
    public Long tiendaId;

    @Column(name = "usuario_id")
    public Long usuarioId;

    @Column(name = "nombre_usuario")
    public String nombreUsuario;

    // 1 a 5 estrellas
    public int calificacion;

    public String comentario;

    public LocalDateTime fecha;

    public Resena() {}

    public Resena(Long tiendaId, Long usuarioId, String nombreUsuario,
                  int calificacion, String comentario) {
        this.tiendaId = tiendaId;
        this.usuarioId = usuarioId;
        this.nombreUsuario = nombreUsuario;
        this.calificacion = calificacion;
        this.comentario = comentario;
        this.fecha = LocalDateTime.now();
    }

    public static List<Resena> findByTienda(Long tiendaId) {
        return list("tiendaId = ?1 order by fecha desc", tiendaId);
    }

    public static List<Resena> findByUsuario(Long usuarioId) {
        return list("usuarioId = ?1 order by fecha desc", usuarioId);
    }
}
