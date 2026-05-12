package com.profeco.reportes;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.List;

// Entidad que representa una sancion aplicada a una tienda por ProFeCo
// Se crea automaticamente cuando una tienda supera el umbral de reportes
@Entity
@Table(name = "sancion")
public class Sancion extends PanacheEntity {

    @Column(name = "tienda_id")
    public Long tiendaId;

    @Column(name = "nombre_tienda")
    public String nombreTienda;

    // Cantidad de reportes que genero la sancion
    @Column(name = "total_reportes")
    public long totalReportes;

    // Nivel de sancion segun reportes acumulados:
    // ADVERTENCIA (3-5), MULTA_MENOR (6-9), MULTA_MAYOR (10+)
    public String nivel;

    // Descripcion de la sancion aplicada
    public String descripcion;

    // Estado: PENDIENTE, APLICADA, APELADA
    public String estado;

    @Column(name = "fecha_sancion")
    public LocalDateTime fechaSancion;

    public Sancion() {}

    public Sancion(Long tiendaId, String nombreTienda, long totalReportes) {
        this.tiendaId     = tiendaId;
        this.nombreTienda = nombreTienda;
        this.totalReportes = totalReportes;
        this.nivel        = calcularNivel(totalReportes);
        this.descripcion  = calcularDescripcion(this.nivel, totalReportes);
        this.estado       = "PENDIENTE";
        this.fechaSancion = LocalDateTime.now();
    }

    // Calcula el nivel de sancion segun los reportes acumulados
    private String calcularNivel(long reportes) {
        if (reportes >= 10) return "MULTA_MAYOR";
        if (reportes >= 6)  return "MULTA_MENOR";
        return "ADVERTENCIA";
    }

    // Genera la descripcion segun el nivel
    private String calcularDescripcion(String nivel, long reportes) {
        return switch (nivel) {
            case "MULTA_MAYOR" -> "Multa mayor por " + reportes
                + " inconsistencias reportadas. Requiere revision inmediata.";
            case "MULTA_MENOR" -> "Multa menor por " + reportes
                + " inconsistencias reportadas.";
            default -> "Advertencia formal por " + reportes
                + " inconsistencias reportadas.";
        };
    }

    // Lista todas las sanciones de una tienda
    public static List<Sancion> findByTienda(Long tiendaId) {
        return list("tiendaId", tiendaId);
    }

    // Lista sanciones por estado
    public static List<Sancion> findByEstado(String estado) {
        return list("estado", estado);
    }
}
