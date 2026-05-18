-- Inicializa las 4 bases que necesita cada microservicio.
-- Postgres ejecuta automaticamente cualquier .sql en /docker-entrypoint-initdb.d
-- la PRIMERA vez que se crea el volumen del contenedor.
CREATE DATABASE usuariosdb;
CREATE DATABASE tiendasdb;
CREATE DATABASE productosdb;
CREATE DATABASE reportesdb;
