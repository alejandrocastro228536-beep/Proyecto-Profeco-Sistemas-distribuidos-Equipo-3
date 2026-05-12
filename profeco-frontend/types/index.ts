export type Rol = "CONSUMIDOR" | "TIENDA" | "ADMIN";
export type TipoTienda = "SUPERMERCADO" | "MERCADO" | "TIANGUIS";
export type EstadoReporte = "PENDIENTE" | "REVISADO" | "SANCIONADO";
export type NivelSancion = "ADVERTENCIA" | "MULTA_MENOR" | "MULTA_MAYOR";
export type EstadoSancion = "PENDIENTE" | "APLICADA" | "APELADA";
export type TipoPreferencia = "PRODUCTO_FAVORITO" | "TIENDA_FAVORITA" | "LISTA_SUPER";

export interface Usuario {
  id: number;
  email: string;
  nombre: string;
  rol: Rol;
}

export interface Producto {
  id: number;
  nombre: string;
  categoria: string;
  descripcion: string;
}

export interface Precio {
  id: number;
  productoId: number;
  tiendaId: number;
  precio: number;
  esOferta: boolean;
  fechaRegistro: string;
}

export interface Tienda {
  id: number;
  nombre: string;
  tipo: TipoTienda;
  direccion: string;
  ciudad: string;
  telefono?: string;
  activa: boolean;
}

export interface ResultadoBusqueda {
  productoId: number;
  nombreProducto: string;
  tiendaId: number;
  nombreTienda: string;
  tipoTienda: TipoTienda;
  precio: number;
  esOferta: boolean;
}

export interface BusquedaResponse {
  total: number;
  resultados: ResultadoBusqueda[];
}

export interface OfertaDTO {
  productoId: number;
  nombreProducto: string;
  tiendaId: number;
  nombreTienda: string;
  precioOriginal: number;
  precioOferta: number;
  descripcion: string;
  fechaExpiracion: string;
}

export interface Reporte {
  id: number;
  usuarioId: number;
  tiendaId: number;
  nombreTienda: string;
  productoId: number;
  nombreProducto: string;
  precioPublicado: number;
  precioReal: number;
  descripcion: string;
  estado: EstadoReporte;
  fechaReporte: string;
}

export interface Sancion {
  id: number;
  tiendaId: number;
  nombreTienda: string;
  totalReportes: number;
  nivel: NivelSancion;
  descripcion: string;
  estado: EstadoSancion;
  fechaSancion: string;
}

export interface ResumenSanciones {
  advertencias: number;
  multaMenor: number;
  multaMayor: number;
  pendientes: number;
  aplicadas: number;
  totalSanciones: number;
}

export interface Preferencia {
  id: number;
  usuarioId: number;
  tipo: TipoPreferencia;
  elementoId: number;
  nombreElemento: string;
}

export interface AuthResponse {
  token: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  nombre: string;
  rol: Rol;
  groups?: string[];
  exp?: number;
  iat?: number;
  iss?: string;
}

export interface RegistroResponse {
  mensaje: string;
  id: number;
  rol: Rol;
}
