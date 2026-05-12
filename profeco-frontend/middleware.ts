import { NextResponse, type NextRequest } from "next/server";
import type { Rol } from "@/types";

const TOKEN_COOKIE = "profeco_token";

interface MinimalJwt {
  rol?: Rol;
  exp?: number;
}

function decodeToken(token: string | undefined): MinimalJwt | null {
  if (!token) return null;
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded =
      normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const json = Buffer.from(padded, "base64").toString("utf-8");
    return JSON.parse(json) as MinimalJwt;
  } catch {
    return null;
  }
}

function rolRequerido(pathname: string): Rol | null {
  if (pathname.startsWith("/consumidor")) return "CONSUMIDOR";
  if (pathname.startsWith("/tienda")) return "TIENDA";
  if (pathname.startsWith("/admin")) return "ADMIN";
  return null;
}

export function middleware(req: NextRequest) {
  const requerido = rolRequerido(req.nextUrl.pathname);
  if (!requerido) return NextResponse.next();

  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  const payload = decodeToken(token);

  const noAuth =
    !payload || (payload.exp && payload.exp * 1000 < Date.now());

  if (noAuth) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("redirect", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (payload.rol !== requerido) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("denied", "1");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/consumidor/:path*", "/tienda/:path*", "/admin/:path*"],
};
