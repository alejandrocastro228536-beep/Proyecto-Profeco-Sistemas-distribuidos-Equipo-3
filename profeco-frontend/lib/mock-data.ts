import type {
  OfertaDTO,
  Reporte,
  ResultadoBusqueda,
  ResumenSanciones,
  Sancion,
  Tienda,
} from "@/types";

export const mockResultados: ResultadoBusqueda[] = [
  {
    productoId: 1,
    nombreProducto: "Leche entera 1L",
    tiendaId: 2,
    nombreTienda: "Walmart Obregón",
    tipoTienda: "SUPERMERCADO",
    precio: 26.9,
    esOferta: false,
  },
  {
    productoId: 1,
    nombreProducto: "Leche entera 1L",
    tiendaId: 3,
    nombreTienda: "Ley Cajeme",
    tipoTienda: "SUPERMERCADO",
    precio: 27.5,
    esOferta: false,
  },
  {
    productoId: 1,
    nombreProducto: "Leche entera 1L",
    tiendaId: 1,
    nombreTienda: "Chedraui Obregón",
    tipoTienda: "SUPERMERCADO",
    precio: 28.5,
    esOferta: false,
  },
  {
    productoId: 1,
    nombreProducto: "Leche entera 1L",
    tiendaId: 4,
    nombreTienda: "Mercado Municipal",
    tipoTienda: "MERCADO",
    precio: 24.0,
    esOferta: true,
  },
  {
    productoId: 1,
    nombreProducto: "Leche entera 1L",
    tiendaId: 5,
    nombreTienda: "Tianguis del Jueves",
    tipoTienda: "TIANGUIS",
    precio: 22.5,
    esOferta: false,
  },
];

export const mockTiendas: Tienda[] = [
  {
    id: 1,
    nombre: "Chedraui Obregón",
    tipo: "SUPERMERCADO",
    direccion: "Blvd. García Morales 1200",
    ciudad: "Ciudad Obregón",
    activa: true,
  },
  {
    id: 2,
    nombre: "Walmart Obregón",
    tipo: "SUPERMERCADO",
    direccion: "Blvd. Hidalgo 800",
    ciudad: "Ciudad Obregón",
    activa: true,
  },
  {
    id: 3,
    nombre: "Ley Cajeme",
    tipo: "SUPERMERCADO",
    direccion: "Calle Morelos 450",
    ciudad: "Ciudad Obregón",
    activa: true,
  },
  {
    id: 4,
    nombre: "Mercado Municipal",
    tipo: "MERCADO",
    direccion: "Centro Histórico",
    ciudad: "Ciudad Obregón",
    activa: true,
  },
  {
    id: 5,
    nombre: "Tianguis del Jueves",
    tipo: "TIANGUIS",
    direccion: "Colonia Prados",
    ciudad: "Ciudad Obregón",
    activa: true,
  },
];

export const mockReportes: Reporte[] = [
  {
    id: 101,
    usuarioId: 5,
    tiendaId: 2,
    nombreTienda: "Walmart Obregón",
    productoId: 12,
    nombreProducto: "Aceite vegetal 1L",
    precioPublicado: 38.0,
    precioReal: 45.5,
    descripcion: "El precio en góndola dice $38 pero en caja cobran $45.50",
    estado: "PENDIENTE",
    fechaReporte: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: 102,
    usuarioId: 7,
    tiendaId: 3,
    nombreTienda: "Ley Cajeme",
    productoId: 21,
    nombreProducto: "Detergente líquido 3L",
    precioPublicado: 99.9,
    precioReal: 119.9,
    descripcion: "Oferta vencida pero el cartel sigue puesto",
    estado: "REVISADO",
    fechaReporte: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
  },
];

export const mockSanciones: Sancion[] = [
  {
    id: 501,
    tiendaId: 2,
    nombreTienda: "Walmart Obregón",
    totalReportes: 3,
    nivel: "ADVERTENCIA",
    descripcion: "Discrepancia recurrente entre precio publicado y cobrado",
    estado: "PENDIENTE",
    fechaSancion: new Date().toISOString(),
  },
  {
    id: 502,
    tiendaId: 3,
    nombreTienda: "Ley Cajeme",
    totalReportes: 8,
    nivel: "MULTA_MENOR",
    descripcion: "Promoción engañosa con carteles vencidos",
    estado: "PENDIENTE",
    fechaSancion: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

export const mockResumen: ResumenSanciones = {
  advertencias: 4,
  multaMenor: 2,
  multaMayor: 1,
  pendientes: 5,
  aplicadas: 2,
  totalSanciones: 7,
};

export const mockOfertas: OfertaDTO[] = [
  {
    productoId: 1,
    nombreProducto: "Leche entera 1L",
    tiendaId: 4,
    nombreTienda: "Mercado Municipal",
    precioOriginal: 27.5,
    precioOferta: 24.0,
    descripcion: "2x1 sólo hoy",
    fechaExpiracion: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(),
  },
];
