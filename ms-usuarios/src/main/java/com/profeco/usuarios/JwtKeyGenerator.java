package com.profeco.usuarios;

import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import java.io.FileWriter;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.*;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

// Genera las claves RSA automaticamente al arrancar si no existen
// Esto evita tener que instalar openssl en Windows
@ApplicationScoped
public class JwtKeyGenerator {

    // Se ejecuta automaticamente cuando Quarkus arranca
    void onStart(@Observes StartupEvent event) {
        Path privateKeyPath = Path.of("src/main/resources/privateKey.pem");
        Path publicKeyPath  = Path.of("src/main/resources/publicKey.pem");

        // Solo genera las claves si no existen todavia
        if (Files.exists(privateKeyPath) && Files.exists(publicKeyPath)) {
            System.out.println("[ms-usuarios] Claves JWT ya existen, no se regeneran.");
            return;
        }

        try {
            System.out.println("[ms-usuarios] Generando claves RSA para JWT...");

            // Generar par de claves RSA de 2048 bits
            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(2048);
            KeyPair keyPair = generator.generateKeyPair();

            // Guardar clave privada en formato PEM
            String privateKeyPem = "-----BEGIN PRIVATE KEY-----\n"
                + Base64.getMimeEncoder(64, new byte[]{'\n'})
                         .encodeToString(
                             new PKCS8EncodedKeySpec(
                                 keyPair.getPrivate().getEncoded()).getEncoded())
                + "\n-----END PRIVATE KEY-----\n";

            // Guardar clave publica en formato PEM
            String publicKeyPem = "-----BEGIN PUBLIC KEY-----\n"
                + Base64.getMimeEncoder(64, new byte[]{'\n'})
                         .encodeToString(
                             new X509EncodedKeySpec(
                                 keyPair.getPublic().getEncoded()).getEncoded())
                + "\n-----END PUBLIC KEY-----\n";

            // Crear la carpeta resources si no existe
            Files.createDirectories(privateKeyPath.getParent());

            // Escribir los archivos PEM
            try (FileWriter fw = new FileWriter(privateKeyPath.toFile())) {
                fw.write(privateKeyPem);
            }
            try (FileWriter fw = new FileWriter(publicKeyPath.toFile())) {
                fw.write(publicKeyPem);
            }

            System.out.println("[ms-usuarios] Claves RSA generadas correctamente.");
            System.out.println("[ms-usuarios] Copia publicKey.pem a api-gateway/src/main/resources/");

        } catch (Exception e) {
            System.err.println("[ms-usuarios] Error generando claves JWT: " + e.getMessage());
        }
    }
}
