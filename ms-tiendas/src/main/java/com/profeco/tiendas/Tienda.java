package com.profeco.tiendas;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

// Entidad que representa un supermercado, tianguis o mercado sobre ruedas
@Entity
@Table(name = "tienda")
public class Tienda extends PanacheEntity {

    // Nombre de la tienda (ej: "Chedraui Obregon")
    public String nombre;

    // Tipo: SUPERMERCADO, MERCADO, TIANGUIS
    public String tipo;

    // Direccion o zona aproximada
    public String direccion;

    // Ciudad donde se ubica
    public String ciudad;

    // Telefono de contacto (opcional)
    public String telefono;

    // Si la tienda esta activa en el sistema
    public boolean activa;

    public Tienda() {}

    public Tienda(String nombre, String tipo, String direccion, String ciudad) {
        this.nombre = nombre;
        this.tipo = tipo;
        this.direccion = direccion;
        this.ciudad = ciudad;
        this.activa = true;
    }
}
