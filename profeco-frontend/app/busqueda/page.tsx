"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, PackageSearch } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { PriceCard } from "@/components/PriceCard";
import { DemoBanner } from "@/components/DemoBanner";
import { Skeleton } from "@/components/ui/skeleton";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { busquedaApi } from "@/lib/api";
import { mockResultados } from "@/lib/mock-data";
import { calcularAhorro, formatPrecio } from "@/lib/utils";
import type {
  BusquedaResponse,
  ResultadoBusqueda,
  TipoTienda,
} from "@/types";

export default function BusquedaPage() {
  return (
    <Suspense fallback={<BusquedaLoading />}>
      <BusquedaContent />
    </Suspense>
  );
}

function BusquedaContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const initialQ = sp.get("q") ?? "";

  const [query, setQuery] = useState(initialQ);
  const [data, setData] = useState<BusquedaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [demo, setDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<TipoTienda | "TODOS">("TODOS");
  const [ordenAsc, setOrdenAsc] = useState(true);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setData(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    busquedaApi
      .buscar(q)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setDemo(false);
      })
      .catch(() => {
        if (cancelled) return;
        const filtered = mockResultados.filter((r) =>
          r.nombreProducto.toLowerCase().includes(q.toLowerCase()),
        );
        setData({ total: filtered.length, resultados: filtered });
        setDemo(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  const filteredSorted = useMemo<ResultadoBusqueda[]>(() => {
    if (!data) return [];
    let arr = data.resultados;
    if (filtroTipo !== "TODOS") {
      arr = arr.filter((r) => r.tipoTienda === filtroTipo);
    }
    return [...arr].sort((a, b) =>
      ordenAsc ? a.precio - b.precio : b.precio - a.precio,
    );
  }, [data, filtroTipo, ordenAsc]);

  const precios = filteredSorted.map((r) => r.precio);
  const minPrecio = precios.length ? Math.min(...precios) : 0;
  const maxPrecio = precios.length ? Math.max(...precios) : 0;
  const ahorroVsMax = calcularAhorro(minPrecio, maxPrecio);

  const goSearch = (q: string) => {
    setQuery(q);
    router.replace(q ? `/busqueda?q=${encodeURIComponent(q)}` : "/busqueda");
  };

  return (
    <>
      {demo && <DemoBanner />}
      <div className="container py-6 sm:py-8">
        <div className="mb-6 max-w-3xl">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Compara precios
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Resultados de supermercados, mercados y tianguis registrados en
            ProFeCo.
          </p>
        </div>

        <SearchBar
          initialValue={query}
          onSearch={(q) => goSearch(q)}
          onSubmit={(q) => goSearch(q)}
        />

        {query && data && filteredSorted.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>{filteredSorted.length} resultados</span>
            </div>
            <Select
              value={filtroTipo}
              onChange={(e) =>
                setFiltroTipo(e.target.value as TipoTienda | "TODOS")
              }
              className="h-9 max-w-[180px]"
              aria-label="Filtrar por tipo de tienda"
            >
              <option value="TODOS">Todas las tiendas</option>
              <option value="SUPERMERCADO">Supermercados</option>
              <option value="MERCADO">Mercados</option>
              <option value="TIANGUIS">Tianguis</option>
            </Select>
            <button
              type="button"
              onClick={() => setOrdenAsc((v) => !v)}
              className="rounded-md border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted"
            >
              Precio {ordenAsc ? "↑ menor a mayor" : "↓ mayor a menor"}
            </button>
            <div className="ml-auto hidden text-xs text-muted-foreground sm:block">
              Más bajo:{" "}
              <strong className="text-emerald-700">
                {formatPrecio(minPrecio)}
              </strong>
              {ahorroVsMax.ahorro > 0 && (
                <>
                  {" · "}
                  Ahorra hasta{" "}
                  <Badge variant="success" className="ml-1">
                    {formatPrecio(ahorroVsMax.ahorro)}
                  </Badge>
                </>
              )}
            </div>
          </div>
        )}

        <div className="mt-6">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>No se pudo buscar</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : loading ? (
            <ResultadosSkeleton />
          ) : !query ? (
            <EmptyHero />
          ) : filteredSorted.length === 0 ? (
            <SinResultados query={query} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSorted.map((r, idx) => {
                const esMin = r.precio === minPrecio;
                const esMax =
                  r.precio === maxPrecio && minPrecio !== maxPrecio;
                return (
                  <PriceCard
                    key={`${r.tiendaId}-${r.productoId}-${idx}`}
                    resultado={r}
                    esMinimo={esMin}
                    esMaximo={esMax}
                    ahorroVsMax={
                      esMin
                        ? calcularAhorro(r.precio, maxPrecio)
                        : undefined
                    }
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ResultadosSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="space-y-3 rounded-xl border bg-card p-5 shadow-sm"
        >
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      ))}
    </div>
  );
}

function BusquedaLoading() {
  return (
    <div className="container py-8">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="mt-4 h-12 w-full max-w-3xl" />
    </div>
  );
}

function EmptyHero() {
  return (
    <div className="rounded-xl border border-dashed bg-muted/30 p-10 text-center">
      <PackageSearch className="mx-auto h-10 w-10 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold">
        Busca un producto para comparar precios
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Escribe el nombre de un producto o presiona algún sugerido del inicio.
      </p>
    </div>
  );
}

function SinResultados({ query }: { query: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-muted/30 p-10 text-center">
      <PackageSearch className="mx-auto h-10 w-10 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold">
        Sin resultados para «{query}»
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Intenta con otra palabra o revisa la ortografía.
      </p>
    </div>
  );
}
