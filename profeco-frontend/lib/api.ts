import type {
  AuthResponse,
  BusquedaResponse,
  OfertaDTO,
  Precio,
  Preferencia,
  Producto,
  RegistroResponse,
  Reporte,
  ResultadoBusqueda,
  Sancion,
  ResumenSanciones,
  Tienda,
  TipoPreferencia,
  TipoTienda,
} from "@/types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("profeco_token");
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const body = await res.json();
      msg = body.message ?? body.error ?? msg;
    } catch {
      // ignore
    }
    throw new ApiError(res.status, msg);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ───── Auth ─────
export const authApi = {
  registro: (body: {
    email: string;
    password: string;
    nombre: string;
    rol: string;
  }) =>
    request<RegistroResponse>("/auth/registro", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  login: (body: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  // El backend `/registro` no devuelve token; auto-login para obtenerlo.
  registroYLogin: async (body: {
    email: string;
    password: string;
    nombre: string;
    rol: string;
  }) => {
    await request<RegistroResponse>("/auth/registro", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: body.email, password: body.password }),
    });
  },
};

// ───── Búsqueda ─────
export const busquedaApi = {
  buscar: (nombre: string) =>
    request<BusquedaResponse>(
      `/busqueda?nombre=${encodeURIComponent(nombre)}`,
    ),
  porProducto: (id: number) =>
    request<ResultadoBusqueda[]>(`/busqueda/producto/${id}`),
};

// ───── Productos ─────
export const productosApi = {
  listar: () => request<Producto[]>("/productos"),
  precios: (id: number) => request<Precio[]>(`/productos/${id}/precios`),
  crear: (body: { nombre: string; categoria: string; descripcion: string }) =>
    request<Producto>("/productos", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  publicarOferta: (body: OfertaDTO) =>
    request<unknown>("/productos/ofertas", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

// ───── Tiendas ─────
export const tiendasApi = {
  listar: () => request<Tienda[]>("/tiendas"),
  porTipo: (tipo: TipoTienda) =>
    request<Tienda[]>(`/tiendas/tipo/${tipo}`),
  crear: (body: {
    nombre: string;
    tipo: TipoTienda;
    direccion: string;
    ciudad: string;
    telefono?: string;
  }) =>
    request<Tienda>("/tiendas", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

// ───── Preferencias ─────
export const preferenciasApi = {
  listar: (usuarioId: number) =>
    request<Preferencia[]>(`/usuarios/${usuarioId}/preferencias`),
  porTipo: (usuarioId: number, tipo: TipoPreferencia) =>
    request<Preferencia[]>(`/usuarios/${usuarioId}/preferencias/${tipo}`),
  agregar: (
    usuarioId: number,
    body: { tipo: TipoPreferencia; elementoId: number; nombreElemento: string },
  ) =>
    request<Preferencia>(`/usuarios/${usuarioId}/preferencias`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  eliminar: (usuarioId: number, prefId: number) =>
    request<void>(`/usuarios/${usuarioId}/preferencias/${prefId}`, {
      method: "DELETE",
    }),
};

// ───── Reportes ─────
export const reportesApi = {
  crear: (body: {
    usuarioId: number;
    tiendaId: number;
    nombreTienda: string;
    productoId: number;
    nombreProducto: string;
    precioPublicado: number;
    precioReal: number;
    descripcion: string;
  }) =>
    request<Reporte>("/reportes", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  listar: () => request<Reporte[]>("/reportes"),
  porTienda: (id: number) => request<Reporte[]>(`/reportes/tienda/${id}`),
  actualizarEstado: (id: number, estado: string) =>
    request<Reporte>(`/reportes/${id}/estado?estado=${estado}`, {
      method: "PUT",
    }),
};

// ───── Sanciones ─────
export const sancionesApi = {
  listar: () => request<Sancion[]>("/sanciones"),
  pendientes: () => request<Sancion[]>("/sanciones/pendientes"),
  resumen: () => request<ResumenSanciones>("/sanciones/resumen"),
  porTienda: (id: number) => request<Sancion[]>(`/sanciones/tienda/${id}`),
  aplicar: (id: number) =>
    request<Sancion>(`/sanciones/${id}/aplicar`, { method: "PUT" }),
  apelar: (id: number) =>
    request<Sancion>(`/sanciones/${id}/apelar`, { method: "PUT" }),
};

export { ApiError };
