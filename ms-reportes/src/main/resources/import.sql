-- Dos reportes de prueba ya existentes para la tienda 1
-- Al agregar un tercero via Postman se disparara la alerta en RabbitMQ
INSERT INTO reporte (usuario_id, tienda_id, nombre_tienda, producto_id, nombre_producto, precio_publicado, precio_real, descripcion, estado, fecha_reporte)
VALUES (1, 1, 'Chedraui Obregon', 1, 'Leche entera 1L', 22.00, 28.50, 'El precio en anaquel es diferente al de la app', 'PENDIENTE', CURRENT_TIMESTAMP);

INSERT INTO reporte (usuario_id, tienda_id, nombre_tienda, producto_id, nombre_producto, precio_publicado, precio_real, descripcion, estado, fecha_reporte)
VALUES (1, 1, 'Chedraui Obregon', 3, 'Tortilla de maiz 1kg', 15.00, 18.00, 'Cargaron precio diferente en caja', 'PENDIENTE', CURRENT_TIMESTAMP);