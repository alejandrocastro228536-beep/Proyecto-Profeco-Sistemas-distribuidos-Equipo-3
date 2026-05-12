"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ListChecks,
  PackagePlus,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { reportesApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { mockReportes } from "@/lib/mock-data";
import { formatFechaCorta, formatPrecio } from "@/lib/utils";
import type { Reporte } from "@/types";

export default function TiendaDashboard() {
  const { user } = useAuth();
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    reportesApi
      .porTienda(user.id)
      .then((r) => {
        if (!cancelled) setReportes(r);
      })
      .catch(() => {
        if (!cancelled) setReportes(mockReportes);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const pendientes = reportes.filter((r) => r.estado === "PENDIENTE").length;
  const revisados = reportes.filter((r) => r.estado === "REVISADO").length;
  const sancionados = reportes.filter((r) => r.estado === "SANCIONADO").length;

  return (
    <div className="container py-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-profeco-rojo">
            Panel de tienda
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            {user?.nombre ?? "Mi tienda"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Gestiona tus ofertas y monitorea los reportes que recibes.
          </p>
        </div>
        <Link
          href="/tienda/ofertas/nueva"
          className="inline-flex items-center gap-2 rounded-md bg-profeco-rojo px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-profeco-rojoOscuro"
        >
          <PackagePlus className="h-4 w-4" />
          Publicar oferta
        </Link>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Reportes pendientes"
          value={pendientes}
          tone="warning"
          Icon={AlertTriangle}
        />
        <StatCard
          label="Reportes revisados"
          value={revisados}
          tone="info"
          Icon={ListChecks}
        />
        <StatCard
          label="Sanciones"
          value={sancionados}
          tone="danger"
          Icon={Sparkles}
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Reportes recientes</CardTitle>
          <CardDescription>
            Lo que los consumidores han reportado sobre tu tienda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : reportes.length === 0 ? (
            <p className="rounded-md border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              ¡Sin reportes! Sigue así.
            </p>
          ) : (
            <ul className="divide-y">
              {reportes.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{r.nombreProducto}</p>
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                      {r.descripcion}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Publicado {formatPrecio(r.precioPublicado)} · cobrado{" "}
                      {formatPrecio(r.precioReal)} ·{" "}
                      {formatFechaCorta(r.fechaReporte)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      r.estado === "SANCIONADO"
                        ? "destructive"
                        : r.estado === "REVISADO"
                          ? "secondary"
                          : "warning"
                    }
                  >
                    {r.estado.toLowerCase()}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  Icon,
  tone,
}: {
  label: string;
  value: number;
  Icon: typeof ListChecks;
  tone: "warning" | "info" | "danger";
}) {
  const toneMap = {
    warning: "bg-amber-100 text-amber-700",
    info: "bg-blue-100 text-blue-700",
    danger: "bg-red-100 text-red-700",
  } as const;
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${toneMap[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="text-3xl font-bold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
