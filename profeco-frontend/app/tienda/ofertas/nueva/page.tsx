"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { productosApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useNotifications } from "@/components/NotificationProvider";
import { formatFecha, formatPrecio } from "@/lib/utils";

export default function NuevaOfertaPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { notify } = useNotifications();
  const [form, setForm] = useState({
    productoId: "",
    nombreProducto: "",
    precioOriginal: "",
    precioOferta: "",
    descripcion: "",
    fechaExpiracion: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(k: K, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const descuento = useMemo(() => {
    const orig = parseFloat(form.precioOriginal);
    const off = parseFloat(form.precioOferta);
    if (orig > 0 && off >= 0 && off < orig) {
      return ((orig - off) / orig) * 100;
    }
    return 0;
  }, [form.precioOriginal, form.precioOferta]);

  const valid =
    form.nombreProducto.trim().length > 1 &&
    parseFloat(form.precioOriginal) > 0 &&
    parseFloat(form.precioOferta) > 0 &&
    parseFloat(form.precioOferta) < parseFloat(form.precioOriginal) &&
    form.fechaExpiracion.length > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setError(null);
    try {
      await productosApi.publicarOferta({
        productoId: parseInt(form.productoId, 10) || 0,
        nombreProducto: form.nombreProducto,
        tiendaId: user.id,
        nombreTienda: user.nombre,
        precioOriginal: parseFloat(form.precioOriginal),
        precioOferta: parseFloat(form.precioOferta),
        descripcion: form.descripcion,
        fechaExpiracion: new Date(form.fechaExpiracion).toISOString(),
      });
      notify({
        kind: "success",
        title: "Oferta publicada",
        description: `${form.nombreProducto} ya está visible para los consumidores`,
      });
      router.push("/tienda");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No se pudo publicar la oferta. Intenta de nuevo.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <header className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-profeco-rojo">
          Nueva oferta
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Publica una promoción
        </h1>
        <p className="mt-1 text-muted-foreground">
          Los consumidores la verán en tiempo real.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Datos de la oferta</CardTitle>
            <CardDescription>
              Todos los campos son obligatorios excepto la descripción.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="nombreProducto">Producto</Label>
                  <Input
                    id="nombreProducto"
                    placeholder="Ej. Leche entera 1L"
                    value={form.nombreProducto}
                    onChange={(e) => set("nombreProducto", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productoId">ID producto (opcional)</Label>
                  <Input
                    id="productoId"
                    inputMode="numeric"
                    placeholder="123"
                    value={form.productoId}
                    onChange={(e) =>
                      set("productoId", e.target.value.replace(/\D/g, ""))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="precioOriginal">Precio normal</Label>
                  <Input
                    id="precioOriginal"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={form.precioOriginal}
                    onChange={(e) => set("precioOriginal", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="precioOferta">Precio con oferta</Label>
                  <Input
                    id="precioOferta"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={form.precioOferta}
                    onChange={(e) => set("precioOferta", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaExpiracion">Vence el</Label>
                <Input
                  id="fechaExpiracion"
                  type="datetime-local"
                  value={form.fechaExpiracion}
                  onChange={(e) => set("fechaExpiracion", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción (opcional)</Label>
                <Textarea
                  id="descripcion"
                  rows={3}
                  placeholder="Ej. Sólo hoy, 2x1 en mostrador"
                  value={form.descripcion}
                  onChange={(e) => set("descripcion", e.target.value)}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTitle>No se pudo publicar</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={!valid || submitting}
                className="gap-2"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Publicar oferta
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:sticky lg:top-20 h-fit border-orange-200 bg-orange-50/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Sparkles className="h-4 w-4" />
              Vista previa
            </CardTitle>
            <CardDescription>
              Así verán tu oferta los consumidores.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-orange-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
                      Oferta nueva
                    </span>
                  </div>
                  <h3 className="mt-2 truncate text-lg font-semibold">
                    {form.nombreProducto || "Producto"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {user?.nombre ?? "Tu tienda"}
                  </p>
                </div>
                {descuento > 0 && (
                  <Badge variant="warning">-{descuento.toFixed(0)}%</Badge>
                )}
              </div>

              <div className="mt-3 flex items-baseline gap-3">
                <span className="text-3xl font-bold tabular-nums text-orange-600">
                  {form.precioOferta
                    ? formatPrecio(parseFloat(form.precioOferta))
                    : "$0.00"}
                </span>
                {parseFloat(form.precioOriginal) > 0 && (
                  <span className="text-sm text-muted-foreground line-through tabular-nums">
                    {formatPrecio(parseFloat(form.precioOriginal))}
                  </span>
                )}
              </div>

              {form.descripcion && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {form.descripcion}
                </p>
              )}
              {form.fechaExpiracion && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Vence {formatFecha(form.fechaExpiracion)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
