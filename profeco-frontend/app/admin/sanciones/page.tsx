"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter } from "lucide-react";
import { SancionTable } from "@/components/SancionTable";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { DemoBanner } from "@/components/DemoBanner";
import { sancionesApi } from "@/lib/api";
import { mockSanciones } from "@/lib/mock-data";
import type { EstadoSancion, Sancion } from "@/types";

export default function AdminSancionesPage() {
  const [sanciones, setSanciones] = useState<Sancion[]>([]);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);
  const [estado, setEstado] = useState<EstadoSancion | "TODOS">("TODOS");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    sancionesApi
      .listar()
      .then((res) => {
        if (!cancelled) {
          setSanciones(res);
          setDemo(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSanciones(mockSanciones);
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
    return sanciones.filter((s) => {
      if (estado !== "TODOS" && s.estado !== estado) return false;
      if (
        search &&
        !s.nombreTienda.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [sanciones, estado, search]);

  const upsert = (s: Sancion) =>
    setSanciones((arr) => arr.map((x) => (x.id === s.id ? s : x)));

  return (
    <>
      {demo && <DemoBanner />}
      <div className="container py-8">
        <header className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-profeco-rojo">
            Sanciones
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Gestión de sanciones
          </h1>
          <p className="mt-1 text-muted-foreground">
            Aplica, apela o consulta sanciones a tiendas con reportes
            comprobados.
          </p>
        </header>

        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por tienda..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 max-w-xs"
          />
          <Select
            value={estado}
            onChange={(e) =>
              setEstado(e.target.value as EstadoSancion | "TODOS")
            }
            className="h-9 max-w-[200px]"
            aria-label="Filtrar por estado"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="PENDIENTE">Pendientes</option>
            <option value="APLICADA">Aplicadas</option>
            <option value="APELADA">Apeladas</option>
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
        ) : (
          <SancionTable sanciones={filtered} onChange={upsert} />
        )}
      </div>
    </>
  );
}
