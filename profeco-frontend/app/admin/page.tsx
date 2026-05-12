"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  FileWarning,
  Gavel,
  ListChecks,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { sancionesApi } from "@/lib/api";
import { mockResumen } from "@/lib/mock-data";
import type { ResumenSanciones } from "@/types";

export default function AdminDashboard() {
  const [resumen, setResumen] = useState<ResumenSanciones | null>(null);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    let cancelled = false;
    sancionesApi
      .resumen()
      .then((r) => {
        if (!cancelled) {
          setResumen(r);
          setDemo(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResumen(mockResumen);
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

  return (
    <div className="container py-8">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-profeco-rojo">
          Panel administrativo
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          ProFeCo · Centro de control
        </h1>
        <p className="mt-1 text-muted-foreground">
          Monitorea sanciones, reportes y métricas del sistema.
          {demo && (
            <span className="ml-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
              Modo demo
            </span>
          )}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Total de sanciones"
          value={resumen?.totalSanciones}
          loading={loading}
          Icon={ListChecks}
          tone="from-profeco-rojo to-profeco-rojoOscuro"
        />
        <Stat
          label="Pendientes"
          value={resumen?.pendientes}
          loading={loading}
          Icon={AlertTriangle}
          tone="from-amber-500 to-amber-600"
        />
        <Stat
          label="Aplicadas"
          value={resumen?.aplicadas}
          loading={loading}
          Icon={CheckCircle2}
          tone="from-emerald-500 to-emerald-600"
        />
        <Stat
          label="Multas mayores"
          value={resumen?.multaMayor}
          loading={loading}
          Icon={Gavel}
          tone="from-red-600 to-red-700"
        />
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <Distribucion
          label="Advertencias"
          value={resumen?.advertencias ?? 0}
          total={resumen?.totalSanciones ?? 0}
          color="bg-amber-500"
        />
        <Distribucion
          label="Multas menores"
          value={resumen?.multaMenor ?? 0}
          total={resumen?.totalSanciones ?? 0}
          color="bg-orange-500"
        />
        <Distribucion
          label="Multas mayores"
          value={resumen?.multaMayor ?? 0}
          total={resumen?.totalSanciones ?? 0}
          color="bg-red-600"
        />
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card className="transition-all hover:shadow-md">
          <Link href="/admin/sanciones" className="block">
            <CardHeader>
              <Gavel className="h-6 w-6 text-profeco-rojo" />
              <CardTitle className="mt-2">Gestionar sanciones</CardTitle>
              <CardDescription>
                Aplica, apela o consulta sanciones por tienda.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium text-profeco-rojo">Abrir →</p>
            </CardContent>
          </Link>
        </Card>

        <Card className="transition-all hover:shadow-md">
          <Link href="/admin/reportes" className="block">
            <CardHeader>
              <FileWarning className="h-6 w-6 text-profeco-rojo" />
              <CardTitle className="mt-2">Bandeja de reportes</CardTitle>
              <CardDescription>
                Revisa los reportes enviados por consumidores.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium text-profeco-rojo">Abrir →</p>
            </CardContent>
          </Link>
        </Card>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  loading,
  Icon,
  tone,
}: {
  label: string;
  value: number | undefined;
  loading: boolean;
  Icon: typeof ListChecks;
  tone: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="relative p-5">
        <div
          aria-hidden
          className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${tone} opacity-15`}
        />
        <Icon className="h-5 w-5 text-muted-foreground" />
        <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {loading ? (
          <Skeleton className="mt-1 h-9 w-20" />
        ) : (
          <p className="mt-1 text-3xl font-bold tabular-nums">
            {value ?? "—"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Distribucion({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <Card>
      <CardContent className="space-y-2 p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm font-bold tabular-nums">{value}</p>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full ${color} transition-all`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {pct.toFixed(0)}% del total
        </p>
      </CardContent>
    </Card>
  );
}
