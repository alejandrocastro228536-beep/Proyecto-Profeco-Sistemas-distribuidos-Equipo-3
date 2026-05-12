package com.profeco.usuarios;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.Optional;

// Entidad que representa a un usuario del sistema
// Puede ser CONSUMIDOR, TIENDA o ADMIN (ProFeCo)
@Entity
@Table(name = "usuario")
public class Usuario extends PanacheEntity {

    // Email unico del usuario (se usa para login)
    public String email;

    // Contrasena hasheada con BCrypt (nunca guardamos la contrasena en texto plano)
    public String passwordHash;

    // Nombre para mostrar en la app
    public String nombre;

    // Rol del usuario: CONSUMIDOR, TIENDA, ADMIN
    public String rol;

    // Si la cuenta esta activa
    public boolean activo;

    public Usuario() {}

    // Busca un usuario por su email (para login)
    public static Optional<Usuario> findByEmail(String email) {
        return find("email", email).firstResultOptional();
    }
}
