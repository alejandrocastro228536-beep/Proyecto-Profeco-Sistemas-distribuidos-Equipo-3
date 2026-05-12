INSERT INTO producto (id, nombre, categoria, descripcion) VALUES (NEXT VALUE FOR producto_SEQ, 'Leche entera 1L', 'Lacteos', 'Leche pasteurizada entera');
INSERT INTO producto (id, nombre, categoria, descripcion) VALUES (NEXT VALUE FOR producto_SEQ, 'Huevo blanco 30pz', 'Lacteos', 'Huevo blanco fresco de granja');
INSERT INTO producto (id, nombre, categoria, descripcion) VALUES (NEXT VALUE FOR producto_SEQ, 'Tortilla de maiz 1kg', 'Basicos', 'Tortilla de maiz amarillo');
INSERT INTO producto (id, nombre, categoria, descripcion) VALUES (NEXT VALUE FOR producto_SEQ, 'Arroz extra largo 1kg', 'Basicos', 'Arroz blanco extra largo');
INSERT INTO producto (id, nombre, categoria, descripcion) VALUES (NEXT VALUE FOR producto_SEQ, 'Aceite vegetal 1L', 'Aceites', 'Aceite 100% vegetal');

INSERT INTO precio (id, producto_id, tienda_id, precio, es_oferta, fecha_registro) VALUES (NEXT VALUE FOR precio_SEQ, 1, 1, 28.50, false, CURRENT_TIMESTAMP);
INSERT INTO precio (id, producto_id, tienda_id, precio, es_oferta, fecha_registro) VALUES (NEXT VALUE FOR precio_SEQ, 1, 2, 26.90, false, CURRENT_TIMESTAMP);
INSERT INTO precio (id, producto_id, tienda_id, precio, es_oferta, fecha_registro) VALUES (NEXT VALUE FOR precio_SEQ, 1, 3, 27.50, false, CURRENT_TIMESTAMP);
INSERT INTO precio (id, producto_id, tienda_id, precio, es_oferta, fecha_registro) VALUES (NEXT VALUE FOR precio_SEQ, 2, 1, 65.00, false, CURRENT_TIMESTAMP);
INSERT INTO precio (id, producto_id, tienda_id, precio, es_oferta, fecha_registro) VALUES (NEXT VALUE FOR precio_SEQ, 2, 2, 62.00, false, CURRENT_TIMESTAMP);
INSERT INTO precio (id, producto_id, tienda_id, precio, es_oferta, fecha_registro) VALUES (NEXT VALUE FOR precio_SEQ, 3, 1, 18.00, false, CURRENT_TIMESTAMP);
INSERT INTO precio (id, producto_id, tienda_id, precio, es_oferta, fecha_registro) VALUES (NEXT VALUE FOR precio_SEQ, 3, 3, 17.50, false, CURRENT_TIMESTAMP);
INSERT INTO precio (id, producto_id, tienda_id, precio, es_oferta, fecha_registro) VALUES (NEXT VALUE FOR precio_SEQ, 4, 2, 22.00, false, CURRENT_TIMESTAMP);
INSERT INTO precio (id, producto_id, tienda_id, precio, es_oferta, fecha_registro) VALUES (NEXT VALUE FOR precio_SEQ, 5, 1, 35.00, false, CURRENT_TIMESTAMP);
INSERT INTO precio (id, producto_id, tienda_id, precio, es_oferta, fecha_registro) VALUES (NEXT VALUE FOR precio_SEQ, 5, 2, 33.50, false, CURRENT_TIMESTAMP);