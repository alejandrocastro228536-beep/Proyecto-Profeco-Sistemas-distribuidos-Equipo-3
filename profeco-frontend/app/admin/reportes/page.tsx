"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { DemoBanner } from "@/components/DemoBanner";
import { reportesApi } from "@/lib/api";
import { mockReportes } from "@/lib/mock-data";
import { formatFechaCorta, formatPrecio } from "@/lib/utils";
import type { EstadoReporte, Reporte } from "@/types";

export default function AdminReportesPage() {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);
  const [estado, setEstado] = useState<EstadoReporte | "TODOS">("TODOS");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    reportesApi
      .listar()
      .then((res) => {
        if (!cancelled) {
          setReportes(res);
          setDemo(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReportes(mockReportes);
          setDemo(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return reportes.filter((r) => {
      if (estado !== "TODOS" && r.estado !== estado) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        r.nombreTienda.toLowerCase().includes(q) ||
        r.nombreProducto.toLowerCase().includes(q)
      );
    });
  }, [reportes, estado, search]);

  const marcarRevisado = async (r: Reporte) => {
    setBusyId(r.id);
    try {
      const updated = await reportesApi.actualizarEstado(r.id, "REVISADO");
      setReportes((arr) =>
        arr.map((x) => (x.id === r.id ? updated : x)),
      );
    } catch {
      setReportes((arr) =>
        arr.map((x) =>
          x.id === r.id ? { ...x, estado: "REVISADO" as EstadoReporte } : x,
        ),
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      {demo && <DemoBanner />}
      <div className="container py-8">
        <header className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-profeco-rojo">
            Reportes
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Bandeja de reportes
          </h1>
          <p className="mt-1 text-muted-foreground">
            Reportes enviados por consumidores sobre inconsistencias de
            precio.
          </p>
        </header>

        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por tienda o producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 max-w-xs"
          />
          <Select
            value={estado}
            onChange={(e) =>
              setEstado(e.target.value as EstadoReporte | "TODOS")
            }
            className="h-9 max-w-[200px]"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="PENDIENTE">Pendientes</option>
            <option value="REVISADO">Revisados</option>
            <option value="SANCIONADO">Sancionados</option>
          </Select>
          <span className="ml-auto text-sm text-muted-foreground">
            {filtered.length} resultado{filtered.length === 1 ? "" : "s"}
          </span>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
            Sin reportes con esos filtros.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tienda</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead className="w-32 text-right">
                    Publicado
                  </TableHead>
                  <TableHead className="w-32 text-right">Cobrado</TableHead>
                  <TableHead className="w-32 text-right">
                    Diferencia
                  </TableHead>
                  <TableHead className="w-28">Estado</TableHead>
                  <TableHead className="w-32">Fecha</TableHead>
                  <TableHead className="w-36 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const diff = r.precioReal - r.precioPublicado;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        {r.nombreTienda}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{r.nombreProducto}</p>
                          <p className="line-clamp-1 text-xs text-muted-foreground">
                            {r.descripcion}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatPrecio(r.precioPublicado)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatPrecio(r.precioReal)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span
                          className={
                            diff > 0
                              ? "font-semibold text-red-700"
                              : "text-muted-foreground"
                          }
                        >
                          {diff > 0 ? "+" : ""}
                          {formatPrecio(diff)}
                        </span>
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatFechaCorta(r.fechaReporte)}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.estado === "PENDIENTE" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => marcarRevisado(r)}
                            disabled={busyId === r.id}
                            className="gap-1.5"
                          >
                            {busyId === r.id && (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            )}
                            Marcar revisado
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  );
}
