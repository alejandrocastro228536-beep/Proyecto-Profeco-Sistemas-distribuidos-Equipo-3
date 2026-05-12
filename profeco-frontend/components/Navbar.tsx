"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu, ScanSearch, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV_PUBLICO = [
  { href: "/", label: "Inicio" },
  { href: "/busqueda", label: "Buscar" },
  { href: "/ofertas", label: "Ofertas" },
];

const NAV_POR_ROL: Record<string, { href: string; label: string }[]> = {
  CONSUMIDOR: [
    { href: "/consumidor", label: "Mi panel" },
    { href: "/consumidor/preferencias", label: "Favoritos" },
    { href: "/consumidor/reportar", label: "Reportar" },
  ],
  TIENDA: [
    { href: "/tienda", label: "Mi tienda" },
    { href: "/tienda/ofertas/nueva", label: "Publicar oferta" },
  ],
  ADMIN: [
    { href: "/admin", label: "Panel ProFeCo" },
    { href: "/admin/sanciones", label: "Sanciones" },
    { href: "/admin/reportes", label: "Reportes" },
  ],
};

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [openMobile, setOpenMobile] = useState(false);

  const links = [
    ...NAV_PUBLICO,
    ...(user ? NAV_POR_ROL[user.rol] ?? [] : []),
  ];

  const handleLogout = () => {
    logout();
    setOpenMobile(false);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-profeco-rojoOscuro/40 bg-profeco-rojo text-white shadow-sm">
      <div className="container flex h-16 items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold tracking-tight"
          onClick={() => setOpenMobile(false)}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-profeco-dorado text-profeco-rojoOscuro shadow-inner">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <span className="hidden text-lg sm:inline">ProFeCo</span>
        </Link>

        <nav className="hidden flex-1 items-center gap-1 lg:flex">
          {links.map((l) => {
            const active =
              pathname === l.href ||
              (l.href !== "/" && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-white/15 text-white"
                    : "text-white/85 hover:bg-white/10 hover:text-white",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden flex-shrink-0 items-center gap-2 lg:flex">
          <NotificationBell />
          {isAuthenticated && user ? (
            <>
              <div className="hidden text-right xl:block">
                <p className="text-xs text-white/70">Hola,</p>
                <p className="text-sm font-semibold">{user.nombre}</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Salir
              </Button>
            </>
          ) : (
            <Link
              href="/auth"
              className="inline-flex h-9 items-center justify-center rounded-md bg-profeco-dorado px-3 text-sm font-semibold text-profeco-rojoOscuro hover:bg-profeco-dorado/90"
            >
              Iniciar sesión
            </Link>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1 lg:hidden">
          <Link
            href="/busqueda"
            className="rounded-md p-2 text-white/90 hover:bg-white/10"
            aria-label="Buscar"
          >
            <ScanSearch className="h-5 w-5" />
          </Link>
          <NotificationBell />
          <button
            type="button"
            onClick={() => setOpenMobile((v) => !v)}
            className="rounded-md p-2 text-white/90 hover:bg-white/10"
            aria-label="Menú"
            aria-expanded={openMobile}
          >
            {openMobile ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {openMobile && (
        <div className="lg:hidden">
          <nav className="border-t border-profeco-rojoOscuro/40 bg-profeco-rojoOscuro/30 px-4 py-3">
            <ul className="space-y-1">
              {links.map((l) => {
                const active =
                  pathname === l.href ||
                  (l.href !== "/" && pathname.startsWith(l.href));
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={() => setOpenMobile(false)}
                      className={cn(
                        "block rounded-md px-3 py-2 text-sm font-medium",
                        active
                          ? "bg-white/15"
                          : "text-white/85 hover:bg-white/10",
                      )}
                    >
                      {l.label}
                    </Link>
                  </li>
                );
              })}
              <li className="border-t border-white/10 pt-2">
                {isAuthenticated ? (
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar sesión
                  </button>
                ) : (
                  <Link
                    href="/auth"
                    onClick={() => setOpenMobile(false)}
                    className="block rounded-md bg-profeco-dorado px-3 py-2 text-center text-sm font-semibold text-profeco-rojoOscuro"
                  >
                    Iniciar sesión
                  </Link>
                )}
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}
