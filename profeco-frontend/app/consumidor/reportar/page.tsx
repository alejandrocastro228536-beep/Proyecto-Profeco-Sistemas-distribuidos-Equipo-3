"use client";

import { ReportForm } from "@/components/ReportForm";

export default function ReportarPage() {
  return (
    <div className="container max-w-2xl py-8">
      <header className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-profeco-rojo">
          Reportar inconsistencia
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Cuéntanos qué pasó
        </h1>
        <p className="mt-1 text-muted-foreground">
          Tu reporte ayuda a ProFeCo a tomar acción contra prácticas
          engañosas.
        </p>
      </header>
      <ReportForm />
    </div>
  );
}
