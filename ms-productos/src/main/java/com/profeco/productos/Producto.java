package com.profeco.productos;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

// Entidad que se guarda en la tabla "producto" de H2
@Entity
@Table(name = "producto")
public class Producto extends PanacheEntity {

    // Nombre del producto (ej: "Leche entera 1L")
    public String nombre;

    // Categoria (ej: "Lacteos", "Carnes", "Verduras")
    public String categoria;

    // Descripcion breve del producto
    public String descripcion;

    // Constructor vacio requerido por JPA
    public Producto() {}

    public Producto(String nombre, String categoria, String descripcion) {
        this.nombre = nombre;
        this.categoria = categoria;
        this.descripcion = descripcion;
    }
}
