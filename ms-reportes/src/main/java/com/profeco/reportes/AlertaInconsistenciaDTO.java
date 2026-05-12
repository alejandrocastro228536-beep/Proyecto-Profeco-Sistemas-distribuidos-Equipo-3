package com.profeco.reportes;

// Mensaje que se envia a RabbitMQ cuando una tienda supera el umbral de reportes
// ms-sanciones consume este mensaje y decide si aplica una multa
public class AlertaInconsistenciaDTO {

    public Long tiendaId;
    public String nombreTienda;
    public long totalReportes;
    public String mensaje;

    public AlertaInconsistenciaDTO() {}

    public AlertaInconsistenciaDTO(Long tiendaId, String nombreTienda, long totalReportes) {
        this.tiendaId = tiendaId;
        this.nombreTienda = nombreTienda;
        this.totalReportes = totalReportes;
        this.mensaje = "La tienda " + nombreTienda + " tiene " + totalReportes
                + " reportes pendientes. Revisar posible sancion.";
    }
}
