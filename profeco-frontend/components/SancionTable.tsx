"use client";

import { useState } from "react";
import { Check, Gavel, Loader2 } from "lucide-react";
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
import { sancionesApi } from "@/lib/api";
import { formatFechaCorta } from "@/lib/utils";
import type { NivelSancion, Sancion } from "@/types";

const NIVEL_LABEL: Record<NivelSancion, { label: string; tone: string }> = {
  ADVERTENCIA: { label: "Advertencia", tone: "bg-amber-100 text-amber-800" },
  MULTA_MENOR: { label: "Multa menor", tone: "bg-orange-100 text-orange-800" },
  MULTA_MAYOR: { label: "Multa mayor", tone: "bg-red-100 text-red-800" },
};

interface Props {
  sanciones: Sancion[];
  onChange?: (s: Sancion) => void;
}

export function SancionTable({ sanciones, onChange }: Props) {
  const [busy, setBusy] = useState<{ id: number; action: "aplicar" | "apelar" } | null>(null);

  const run = async (id: number, action: "aplicar" | "apelar") => {
    setBusy({ id, action });
    try {
      const updated =
        action === "aplicar"
          ? await sancionesApi.aplicar(id)
          : await sancionesApi.apelar(id);
      onChange?.(updated);
    } finally {
      setBusy(null);
    }
  };

  if (sanciones.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No hay sanciones registradas.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tienda</TableHead>
            <TableHead className="w-32">Reportes</TableHead>
            <TableHead className="w-36">Nivel</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead className="w-28">Estado</TableHead>
            <TableHead className="w-32">Fecha</TableHead>
            <TableHead className="w-56 text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sanciones.map((s) => {
            const nivel = NIVEL_LABEL[s.nivel];
            const isPending = s.estado === "PENDIENTE";
            return (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.nombreTienda}</TableCell>
                <TableCell className="tabular-nums">{s.totalReportes}</TableCell>
                <TableCell>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${nivel.tone}`}>
                    {nivel.label}
                  </span>
                </TableCell>
                <TableCell className="max-w-md text-sm text-muted-foreground">
                  <span className="line-clamp-2">{s.descripcion}</span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      s.estado === "APLICADA"
                        ? "success"
                        : s.estado === "APELADA"
                          ? "secondary"
                          : "warning"
                    }
                  >
                    {s.estado.toLowerCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatFechaCorta(s.fechaSancion)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      disabled={!isPending || !!busy}
                      onClick={() => run(s.id, "aplicar")}
                      className="gap-1.5"
                    >
                      {busy?.id === s.id && busy.action === "aplicar" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Gavel className="h-3.5 w-3.5" />
                      )}
                      Aplicar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!isPending || !!busy}
                      onClick={() => run(s.id, "apelar")}
                      className="gap-1.5"
                    >
                      {busy?.id === s.id && busy.action === "apelar" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      Apelar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
