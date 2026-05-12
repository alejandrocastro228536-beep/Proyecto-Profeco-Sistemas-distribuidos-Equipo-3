package com.profeco.usuarios;

import io.smallrye.jwt.build.Jwt;
import jakarta.enterprise.context.ApplicationScoped;
import org.mindrot.jbcrypt.BCrypt;
import java.util.Set;

// Servicio de autenticacion: verifica credenciales y genera token JWT
@ApplicationScoped
public class AuthService {

    // Verifica email/password y devuelve un token JWT firmado con la clave privada
    // El token incluye el ID, nombre, email y rol del usuario
    public String login(String email, String password) {
        Usuario usuario = Usuario.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (!BCrypt.checkpw(password, usuario.passwordHash)) {
            throw new RuntimeException("Contrasena incorrecta");
        }

        if (!usuario.activo) {
            throw new RuntimeException("Cuenta desactivada");
        }

        // Generar token JWT — expira en 1 hora
        return Jwt.issuer("profeco-app")
                .subject(String.valueOf(usuario.id))
                .claim("email",  usuario.email)
                .claim("nombre", usuario.nombre)
                .claim("rol",    usuario.rol)
                .groups(Set.of(usuario.rol))
                .expiresIn(3600)
                .sign();
    }

    // Hashea la contrasena antes de guardarla
    public String hashPassword(String passwordPlano) {
        return BCrypt.hashpw(passwordPlano, BCrypt.gensalt());
    }
}
