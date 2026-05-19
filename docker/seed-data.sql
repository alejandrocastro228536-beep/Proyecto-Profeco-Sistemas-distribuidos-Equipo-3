-- =============================================================================
-- Seed de datos para ProFeCo
-- Pobla las 4 bases (usuariosdb, tiendasdb, productosdb, reportesdb) con datos
-- coherentes entre si (los tienda_id y producto_id coinciden entre tablas).
--
-- Como ejecutar (desde la raiz del repo):
--   Get-Content docker\seed-data.sql | docker exec -i profeco-postgres psql -U postgres
--   o bien:   docker\seed.ps1
--
-- IDs reservados a partir de 1001 para no chocar con datos existentes ni con
-- los IDs que Hibernate ya asigno via auto-increment.
--
-- Idempotente: cada INSERT lleva ON CONFLICT (id) DO NOTHING.
-- Al final de cada bloque se avanza la secuencia para que las proximas altas
-- (por la API) no choquen con los IDs sembrados.
--
-- password_hash: hash bcrypt valido para la contrasena "password".
--   Si quieres iniciar sesion con un usuario seed, esa es la contrasena.
-- =============================================================================


-- =============================================================================
-- usuariosdb
-- =============================================================================
\c usuariosdb

INSERT INTO usuario (id, email, passwordhash, nombre, rol, activo) VALUES
  (1001, 'ana.lopez@demo.mx',     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Ana Lopez',     'CONSUMIDOR', true),
  (1002, 'carlos.ruiz@demo.mx',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Carlos Ruiz',   'CONSUMIDOR', true),
  (1003, 'maria.flores@demo.mx',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Maria Flores',  'CONSUMIDOR', true),
  (1004, 'jose.martinez@demo.mx', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Jose Martinez', 'CONSUMIDOR', true),
  (1005, 'laura.gomez@demo.mx',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Laura Gomez',   'CONSUMIDOR', true),
  (1006, 'pedro.sanchez@demo.mx', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Pedro Sanchez', 'CONSUMIDOR', true),
  (1007, 'chedraui@demo.mx',      '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Chedraui Obregon', 'TIENDA', true),
  (1008, 'walmart@demo.mx',       '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Walmart Obregon',  'TIENDA', true),
  (1009, 'ley@demo.mx',           '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Ley Cajeme',       'TIENDA', true),
  (1010, 'profeco.admin@demo.mx', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ProFeCo Admin',    'ADMIN',  true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO preferencia (id, usuarioid, tipo, elementoid, nombreelemento) VALUES
  -- productos favoritos
  (1001, 1001, 'PRODUCTO_FAVORITO', 1001, 'Leche entera 1L'),
  (1002, 1001, 'PRODUCTO_FAVORITO', 1003, 'Tortilla de maiz 1kg'),
  (1003, 1002, 'PRODUCTO_FAVORITO', 1005, 'Aceite vegetal 1L'),
  (1004, 1003, 'PRODUCTO_FAVORITO', 1010, 'Pollo entero 1kg'),
  -- tiendas favoritas
  (1005, 1001, 'TIENDA_FAVORITA', 1001, 'Chedraui Obregon'),
  (1006, 1002, 'TIENDA_FAVORITA', 1002, 'Walmart Obregon'),
  (1007, 1004, 'TIENDA_FAVORITA', 1004, 'Mercado Municipal'),
  -- lista del super
  (1008, 1001, 'LISTA_SUPER', 1002, 'Huevo blanco 30pz'),
  (1009, 1001, 'LISTA_SUPER', 1004, 'Arroz extra largo 1kg'),
  (1010, 1003, 'LISTA_SUPER', 1011, 'Frijol bayo 1kg'),
  (1011, 1003, 'LISTA_SUPER', 1012, 'Azucar estandar 1kg')
ON CONFLICT (id) DO NOTHING;

SELECT setval('usuario_seq',     1100, true);
SELECT setval('preferencia_seq', 1100, true);


-- =============================================================================
-- tiendasdb
-- =============================================================================
\c tiendasdb

INSERT INTO tienda (id, nombre, tipo, direccion, ciudad, telefono, activa) VALUES
  (1001, 'Chedraui Obregon',      'SUPERMERCADO', 'Blvd. Garcia Morales 1200', 'Ciudad Obregon', '6441234567', true),
  (1002, 'Walmart Obregon',       'SUPERMERCADO', 'Blvd. Hidalgo 800',         'Ciudad Obregon', '6447654321', true),
  (1003, 'Ley Cajeme',            'SUPERMERCADO', 'Calle Morelos 450',         'Ciudad Obregon', '6441112233', true),
  (1004, 'Mercado Municipal',     'MERCADO',      'Centro Historico',          'Ciudad Obregon', NULL, true),
  (1005, 'Tianguis del Jueves',   'TIANGUIS',     'Colonia Prados',            'Ciudad Obregon', NULL, true),
  (1006, 'Soriana Hermosillo',    'SUPERMERCADO', 'Blvd. Solidaridad 250',     'Hermosillo',     '6629876543', true),
  (1007, 'Bodega Aurrera Navojoa','SUPERMERCADO', 'Av. No Reelecion 555',      'Navojoa',        '6425551122', true),
  (1008, 'Tianguis del Sabado',   'TIANGUIS',     'Colonia Centro',            'Guaymas',        NULL, true),
  (1009, 'Mercado de Abastos',    'MERCADO',      'Carretera Internacional',   'Ciudad Obregon', NULL, true),
  (1010, 'Smart Yaqui',           'SUPERMERCADO', 'Calle 5 de Febrero 300',    'Ciudad Obregon', '6442223344', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO resena (id, tienda_id, usuario_id, nombre_usuario, calificacion, comentario, fecha) VALUES
  (1001, 1001, 1001, 'Ana Lopez',     5, 'Siempre encuentro todo, los precios estan bien.',                CURRENT_TIMESTAMP - INTERVAL '12 days'),
  (1002, 1001, 1002, 'Carlos Ruiz',   4, 'Muy limpio, aunque a veces falta personal en cajas.',            CURRENT_TIMESTAMP - INTERVAL '10 days'),
  (1003, 1001, 1003, 'Maria Flores',  3, 'Buenos precios pero los pasillos estan saturados.',              CURRENT_TIMESTAMP - INTERVAL '8 days'),
  (1004, 1002, 1001, 'Ana Lopez',     5, 'Las ofertas del fin de semana son las mejores de la ciudad.',    CURRENT_TIMESTAMP - INTERVAL '7 days'),
  (1005, 1002, 1004, 'Jose Martinez', 4, 'Bien surtido en frutas y verduras.',                             CURRENT_TIMESTAMP - INTERVAL '6 days'),
  (1006, 1002, 1005, 'Laura Gomez',   2, 'Ya van dos veces que me cobran un precio diferente al de anaquel.', CURRENT_TIMESTAMP - INTERVAL '5 days'),
  (1007, 1003, 1006, 'Pedro Sanchez', 4, 'Cerca de mi casa, atencion amable.',                             CURRENT_TIMESTAMP - INTERVAL '4 days'),
  (1008, 1003, 1003, 'Maria Flores',  5, 'Los abarrotes a buen precio. Recomiendo el area de panaderia.',  CURRENT_TIMESTAMP - INTERVAL '3 days'),
  (1009, 1004, 1004, 'Jose Martinez', 5, 'La carne y el pollo siempre frescos. Mejor que cualquier super.',CURRENT_TIMESTAMP - INTERVAL '14 days'),
  (1010, 1004, 1002, 'Carlos Ruiz',   4, 'Precios justos en frutas y verduras de temporada.',              CURRENT_TIMESTAMP - INTERVAL '2 days'),
  (1011, 1005, 1005, 'Laura Gomez',   5, 'El tianguis siempre es la mejor opcion los jueves.',             CURRENT_TIMESTAMP - INTERVAL '9 days'),
  (1012, 1005, 1001, 'Ana Lopez',     3, 'Variedad pero hay que regatear los precios.',                    CURRENT_TIMESTAMP - INTERVAL '15 days'),
  (1013, 1006, 1006, 'Pedro Sanchez', 4, 'Buena experiencia, instalaciones modernas.',                     CURRENT_TIMESTAMP - INTERVAL '20 days'),
  (1014, 1007, 1002, 'Carlos Ruiz',   3, 'Precios razonables pero a veces faltan productos basicos.',      CURRENT_TIMESTAMP - INTERVAL '18 days'),
  (1015, 1010, 1003, 'Maria Flores',  5, 'Mi favorito para la despensa quincenal.',                        CURRENT_TIMESTAMP - INTERVAL '1 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO wishlist (id, tienda_id, usuario_id, nombre_usuario, descripcion_producto, estado, fecha) VALUES
  (1001, 1001, 1001, 'Ana Lopez',     'Por favor traigan leche deslactosada de marca propia, no la encuentro.', 'PENDIENTE', CURRENT_TIMESTAMP - INTERVAL '5 days'),
  (1002, 1001, 1003, 'Maria Flores',  'Quisiera ver pan integral sin azucar agregada.',                          'ATENDIDA',  CURRENT_TIMESTAMP - INTERVAL '20 days'),
  (1003, 1002, 1002, 'Carlos Ruiz',   'Necesito formula para bebe etapa 2 marca Enfagrow.',                      'PENDIENTE', CURRENT_TIMESTAMP - INTERVAL '3 days'),
  (1004, 1002, 1005, 'Laura Gomez',   'Por favor tengan queso panela bajo en sodio.',                            'PENDIENTE', CURRENT_TIMESTAMP - INTERVAL '2 days'),
  (1005, 1003, 1004, 'Jose Martinez', 'Pedido: harina de avena, no la manejan en su sucursal.',                  'RECHAZADA', CURRENT_TIMESTAMP - INTERVAL '8 days'),
  (1006, 1004, 1001, 'Ana Lopez',     'Quisiera comprar nopal en penca, llegan los miercoles?',                  'ATENDIDA',  CURRENT_TIMESTAMP - INTERVAL '6 days'),
  (1007, 1005, 1006, 'Pedro Sanchez', 'Vendan tortillas de harina recien hechas.',                               'PENDIENTE', CURRENT_TIMESTAMP - INTERVAL '4 days'),
  (1008, 1006, 1002, 'Carlos Ruiz',   'Por favor introduzcan productos veganos.',                                'PENDIENTE', CURRENT_TIMESTAMP - INTERVAL '10 days'),
  (1009, 1010, 1003, 'Maria Flores',  'Cafe de grano de Chiapas tostado oscuro.',                                'PENDIENTE', CURRENT_TIMESTAMP - INTERVAL '1 days'),
  (1010, 1010, 1005, 'Laura Gomez',   'Mas variedad de mariscos congelados.',                                    'PENDIENTE', CURRENT_TIMESTAMP - INTERVAL '7 days')
ON CONFLICT (id) DO NOTHING;

SELECT setval('tienda_seq',   1100, true);
SELECT setval('resena_seq',   1100, true);
SELECT setval('wishlist_seq', 1100, true);


-- =============================================================================
-- productosdb
-- =============================================================================
\c productosdb

INSERT INTO producto (id, nombre, categoria, descripcion) VALUES
  (1001, 'Leche entera 1L',        'Lacteos',    'Leche pasteurizada entera marca generica'),
  (1002, 'Huevo blanco 30pz',      'Lacteos',    'Huevo blanco fresco de granja'),
  (1003, 'Tortilla de maiz 1kg',   'Basicos',    'Tortilla de maiz amarillo nixtamalizado'),
  (1004, 'Arroz extra largo 1kg',  'Basicos',    'Arroz blanco extra largo'),
  (1005, 'Aceite vegetal 1L',      'Aceites',    'Aceite 100% vegetal de canola'),
  (1006, 'Pasta para sopa 200g',   'Basicos',    'Pasta de coditos, marca generica'),
  (1007, 'Jamon de pavo 250g',     'Carnes',     'Jamon de pavo bajo en sodio'),
  (1008, 'Queso panela 500g',      'Lacteos',    'Queso panela fresco'),
  (1009, 'Carne molida 1kg',       'Carnes',     'Molida especial 80/20'),
  (1010, 'Pollo entero 1kg',       'Carnes',     'Pollo limpio refrigerado'),
  (1011, 'Frijol bayo 1kg',        'Basicos',    'Frijol bayo seleccionado'),
  (1012, 'Azucar estandar 1kg',    'Basicos',    'Azucar blanca estandar'),
  (1013, 'Cafe soluble 200g',      'Bebidas',    'Cafe soluble clasico'),
  (1014, 'Refresco cola 2L',       'Bebidas',    'Refresco sabor cola 2 litros'),
  (1015, 'Agua mineral 1.5L',      'Bebidas',    'Agua mineral natural'),
  (1016, 'Jitomate 1kg',           'Verduras',   'Jitomate saladet de temporada'),
  (1017, 'Cebolla blanca 1kg',     'Verduras',   'Cebolla blanca de primera'),
  (1018, 'Manzana roja 1kg',       'Frutas',     'Manzana red delicious'),
  (1019, 'Platano tabasco 1kg',    'Frutas',     'Platano tabasco maduro'),
  (1020, 'Detergente liquido 3L',  'Limpieza',   'Detergente liquido para ropa')
ON CONFLICT (id) DO NOTHING;

-- precios: cada producto en 3-5 tiendas, algunos con oferta
INSERT INTO precio (id, producto_id, tienda_id, precio, es_oferta, fecha_registro) VALUES
  -- Leche entera 1L (1001)
  (1001, 1001, 1001, 28.50, false, CURRENT_TIMESTAMP),
  (1002, 1001, 1002, 26.90, true,  CURRENT_TIMESTAMP),
  (1003, 1001, 1003, 27.50, false, CURRENT_TIMESTAMP),
  (1004, 1001, 1006, 27.00, false, CURRENT_TIMESTAMP),
  (1005, 1001, 1010, 28.00, false, CURRENT_TIMESTAMP),
  -- Huevo blanco 30pz (1002)
  (1006, 1002, 1001, 95.00, false, CURRENT_TIMESTAMP),
  (1007, 1002, 1002, 89.90, true,  CURRENT_TIMESTAMP),
  (1008, 1002, 1003, 92.00, false, CURRENT_TIMESTAMP),
  (1009, 1002, 1004, 85.00, false, CURRENT_TIMESTAMP),
  (1010, 1002, 1009, 82.00, false, CURRENT_TIMESTAMP),
  -- Tortilla de maiz 1kg (1003)
  (1011, 1003, 1001, 22.00, false, CURRENT_TIMESTAMP),
  (1012, 1003, 1003, 20.50, false, CURRENT_TIMESTAMP),
  (1013, 1003, 1004, 18.00, false, CURRENT_TIMESTAMP),
  (1014, 1003, 1010, 21.00, false, CURRENT_TIMESTAMP),
  -- Arroz extra largo 1kg (1004)
  (1015, 1004, 1001, 38.00, false, CURRENT_TIMESTAMP),
  (1016, 1004, 1002, 35.90, true,  CURRENT_TIMESTAMP),
  (1017, 1004, 1003, 36.50, false, CURRENT_TIMESTAMP),
  (1018, 1004, 1007, 34.00, false, CURRENT_TIMESTAMP),
  -- Aceite vegetal 1L (1005)
  (1019, 1005, 1001, 45.00, false, CURRENT_TIMESTAMP),
  (1020, 1005, 1002, 42.50, true,  CURRENT_TIMESTAMP),
  (1021, 1005, 1003, 44.00, false, CURRENT_TIMESTAMP),
  (1022, 1005, 1006, 43.50, false, CURRENT_TIMESTAMP),
  -- Pasta sopa 200g (1006)
  (1023, 1006, 1001,  8.50, false, CURRENT_TIMESTAMP),
  (1024, 1006, 1002,  7.90, false, CURRENT_TIMESTAMP),
  (1025, 1006, 1010,  8.00, false, CURRENT_TIMESTAMP),
  -- Jamon de pavo 250g (1007)
  (1026, 1007, 1001, 52.00, false, CURRENT_TIMESTAMP),
  (1027, 1007, 1002, 49.90, true,  CURRENT_TIMESTAMP),
  (1028, 1007, 1003, 50.50, false, CURRENT_TIMESTAMP),
  -- Queso panela 500g (1008)
  (1029, 1008, 1001, 78.00, false, CURRENT_TIMESTAMP),
  (1030, 1008, 1002, 74.90, false, CURRENT_TIMESTAMP),
  (1031, 1008, 1003, 76.00, false, CURRENT_TIMESTAMP),
  (1032, 1008, 1004, 65.00, false, CURRENT_TIMESTAMP),
  -- Carne molida 1kg (1009)
  (1033, 1009, 1001, 165.00, false, CURRENT_TIMESTAMP),
  (1034, 1009, 1002, 159.00, true,  CURRENT_TIMESTAMP),
  (1035, 1009, 1003, 162.00, false, CURRENT_TIMESTAMP),
  (1036, 1009, 1004, 145.00, false, CURRENT_TIMESTAMP),
  (1037, 1009, 1009, 142.00, false, CURRENT_TIMESTAMP),
  -- Pollo entero 1kg (1010)
  (1038, 1010, 1001,  85.00, false, CURRENT_TIMESTAMP),
  (1039, 1010, 1002,  82.50, false, CURRENT_TIMESTAMP),
  (1040, 1010, 1004,  75.00, false, CURRENT_TIMESTAMP),
  (1041, 1010, 1009,  72.00, false, CURRENT_TIMESTAMP),
  -- Frijol bayo 1kg (1011)
  (1042, 1011, 1001, 38.00, false, CURRENT_TIMESTAMP),
  (1043, 1011, 1003, 36.50, false, CURRENT_TIMESTAMP),
  (1044, 1011, 1007, 34.00, false, CURRENT_TIMESTAMP),
  -- Azucar 1kg (1012)
  (1045, 1012, 1001, 28.00, false, CURRENT_TIMESTAMP),
  (1046, 1012, 1002, 26.90, true,  CURRENT_TIMESTAMP),
  (1047, 1012, 1003, 27.50, false, CURRENT_TIMESTAMP),
  -- Cafe soluble 200g (1013)
  (1048, 1013, 1001, 89.00, false, CURRENT_TIMESTAMP),
  (1049, 1013, 1002, 84.90, true,  CURRENT_TIMESTAMP),
  (1050, 1013, 1003, 87.00, false, CURRENT_TIMESTAMP),
  -- Refresco cola 2L (1014)
  (1051, 1014, 1001, 35.00, false, CURRENT_TIMESTAMP),
  (1052, 1014, 1002, 32.90, true,  CURRENT_TIMESTAMP),
  (1053, 1014, 1003, 34.00, false, CURRENT_TIMESTAMP),
  (1054, 1014, 1010, 33.50, false, CURRENT_TIMESTAMP),
  -- Agua mineral 1.5L (1015)
  (1055, 1015, 1001, 18.00, false, CURRENT_TIMESTAMP),
  (1056, 1015, 1002, 16.50, false, CURRENT_TIMESTAMP),
  (1057, 1015, 1010, 17.00, false, CURRENT_TIMESTAMP),
  -- Jitomate 1kg (1016)
  (1058, 1016, 1001, 22.00, false, CURRENT_TIMESTAMP),
  (1059, 1016, 1004, 15.00, false, CURRENT_TIMESTAMP),
  (1060, 1016, 1005, 14.00, false, CURRENT_TIMESTAMP),
  (1061, 1016, 1009, 13.50, false, CURRENT_TIMESTAMP),
  -- Cebolla blanca 1kg (1017)
  (1062, 1017, 1001, 20.00, false, CURRENT_TIMESTAMP),
  (1063, 1017, 1004, 14.00, false, CURRENT_TIMESTAMP),
  (1064, 1017, 1005, 12.50, false, CURRENT_TIMESTAMP),
  -- Manzana roja 1kg (1018)
  (1065, 1018, 1001, 45.00, false, CURRENT_TIMESTAMP),
  (1066, 1018, 1002, 42.00, true,  CURRENT_TIMESTAMP),
  (1067, 1018, 1004, 38.00, false, CURRENT_TIMESTAMP),
  -- Platano tabasco 1kg (1019)
  (1068, 1019, 1001, 18.00, false, CURRENT_TIMESTAMP),
  (1069, 1019, 1004, 12.00, false, CURRENT_TIMESTAMP),
  (1070, 1019, 1005, 11.00, false, CURRENT_TIMESTAMP),
  -- Detergente liquido 3L (1020)
  (1071, 1020, 1001, 165.00, false, CURRENT_TIMESTAMP),
  (1072, 1020, 1002, 158.00, true,  CURRENT_TIMESTAMP),
  (1073, 1020, 1003, 162.00, false, CURRENT_TIMESTAMP),
  (1074, 1020, 1010, 160.00, false, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

SELECT setval('producto_seq', 1100, true);
SELECT setval('precio_seq',   1200, true);


-- =============================================================================
-- reportesdb
-- =============================================================================
\c reportesdb

-- reporte.id es IDENTITY (autogenerado por Postgres), pero podemos forzar IDs
-- para que el ON CONFLICT (id) DO NOTHING tenga efecto e idempotencia.
-- Mas abajo se reinicia la secuencia para no chocar.
INSERT INTO reporte (id, usuario_id, tienda_id, nombre_tienda, producto_id, nombre_producto, precio_publicado, precio_real, descripcion, estado, fecha_reporte) VALUES
  (1001, 1001, 1001, 'Chedraui Obregon', 1001, 'Leche entera 1L',       22.00, 28.50, 'El precio en anaquel marcaba 22 pero en caja me cobraron mas.', 'PENDIENTE',     CURRENT_TIMESTAMP - INTERVAL '15 days'),
  (1002, 1002, 1001, 'Chedraui Obregon', 1003, 'Tortilla de maiz 1kg',  15.00, 22.00, 'Cargaron precio diferente al de la etiqueta.',                  'PENDIENTE',     CURRENT_TIMESTAMP - INTERVAL '12 days'),
  (1003, 1003, 1001, 'Chedraui Obregon', 1005, 'Aceite vegetal 1L',     38.00, 45.00, 'Etiqueta dice un precio, ticket otro.',                         'EN_REVISION',   CURRENT_TIMESTAMP - INTERVAL '10 days'),
  (1004, 1001, 1002, 'Walmart Obregon',  1002, 'Huevo blanco 30pz',     79.00, 89.90, 'Cobraron 10 pesos arriba sin justificacion.',                   'RESUELTO',      CURRENT_TIMESTAMP - INTERVAL '20 days'),
  (1005, 1004, 1002, 'Walmart Obregon',  1014, 'Refresco cola 2L',      28.00, 32.90, 'Promocion 28 pesos pero cobraron 32.90.',                       'PENDIENTE',     CURRENT_TIMESTAMP - INTERVAL '5 days'),
  (1006, 1005, 1003, 'Ley Cajeme',       1008, 'Queso panela 500g',     69.00, 76.00, 'No respetan el precio del folleto.',                            'PENDIENTE',     CURRENT_TIMESTAMP - INTERVAL '8 days'),
  (1007, 1002, 1010, 'Smart Yaqui',      1020, 'Detergente liquido 3L',149.00,160.00, 'Diferencia de 11 pesos sin aviso.',                             'PENDIENTE',     CURRENT_TIMESTAMP - INTERVAL '3 days'),
  (1008, 1006, 1010, 'Smart Yaqui',      1013, 'Cafe soluble 200g',     79.00, 89.00, 'La oferta del fin de semana no se aplico.',                     'PENDIENTE',     CURRENT_TIMESTAMP - INTERVAL '2 days'),
  (1009, 1001, 1001, 'Chedraui Obregon', 1009, 'Carne molida 1kg',     150.00,165.00, 'Tercer reporte contra Chedraui Obregon por inconsistencia.',    'PENDIENTE',     CURRENT_TIMESTAMP - INTERVAL '1 days')
ON CONFLICT (id) DO NOTHING;

-- Avanza la secuencia IDENTITY mas alla de los IDs sembrados para que las
-- proximas altas (desde la API) no choquen.
SELECT setval(pg_get_serial_sequence('reporte', 'id'), 1100, true);

-- Una sancion historica para Chedraui (rebaso umbral en una epoca pasada)
INSERT INTO sancion (id, tienda_id, nombre_tienda, total_reportes, nivel, descripcion, estado, fecha_sancion) VALUES
  (1001, 1001, 'Chedraui Obregon', 3, 'ADVERTENCIA',
   'Advertencia formal por 3 inconsistencias reportadas.',
   'APLICADA', CURRENT_TIMESTAMP - INTERVAL '30 days'),
  (1002, 1010, 'Smart Yaqui',      6, 'MULTA_MENOR',
   'Multa menor por 6 inconsistencias reportadas.',
   'PENDIENTE', CURRENT_TIMESTAMP - INTERVAL '15 days')
ON CONFLICT (id) DO NOTHING;

SELECT setval('sancion_seq', 1100, true);


-- =============================================================================
-- Resumen
-- =============================================================================
\c usuariosdb
SELECT 'usuarios'   AS tabla, COUNT(*) AS total FROM usuario
UNION ALL SELECT 'preferencias', COUNT(*) FROM preferencia;

\c tiendasdb
SELECT 'tiendas'  AS tabla, COUNT(*) FROM tienda
UNION ALL SELECT 'resenas',  COUNT(*) FROM resena
UNION ALL SELECT 'wishlist', COUNT(*) FROM wishlist;

\c productosdb
SELECT 'productos' AS tabla, COUNT(*) FROM producto
UNION ALL SELECT 'precios',  COUNT(*) FROM precio;

\c reportesdb
SELECT 'reportes'  AS tabla, COUNT(*) FROM reporte
UNION ALL SELECT 'sanciones', COUNT(*) FROM sancion;
