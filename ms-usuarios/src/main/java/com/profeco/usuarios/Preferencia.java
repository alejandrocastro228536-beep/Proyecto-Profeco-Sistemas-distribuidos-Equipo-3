package com.profeco.usuarios;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.List;

// Guarda las preferencias de un consumidor:
// productos favoritos, tiendas favoritas, lista del super
@Entity
@Table(name = "preferencia")
public class Preferencia extends PanacheEntity {

    // ID del usuario al que pertenece esta preferencia
    public Long usuarioId;

    // Tipo de preferencia: PRODUCTO_FAVORITO, TIENDA_FAVORITA, LISTA_SUPER
    public String tipo;

    // ID del elemento guardado (producto o tienda)
    public Long elementoId;

    // Nombre del elemento (para mostrarlo sin consultar otro servicio)
    public String nombreElemento;

    public Preferencia() {}

    public Preferencia(Long usuarioId, String tipo, Long elementoId, String nombreElemento) {
        this.usuarioId = usuarioId;
        this.tipo = tipo;
        this.elementoId = elementoId;
        this.nombreElemento = nombreElemento;
    }

    // Lista todas las preferencias de un usuario
    public static List<Preferencia> findByUsuario(Long usuarioId) {
        return list("usuarioId", usuarioId);
    }

    // Lista preferencias de un usuario por tipo especifico
    public static List<Preferencia> findByUsuarioYTipo(Long usuarioId, String tipo) {
        return list("usuarioId = ?1 and tipo = ?2", usuarioId, tipo);
    }
}
