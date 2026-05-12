"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { reportesApi } from "@/lib/api";
import { formatPrecio } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

type Step = 0 | 1 | 2 | 3;

interface FormState {
  tiendaId: string;
  nombreTienda: string;
  productoId: string;
  nombreProducto: string;
  precioPublicado: string;
  precioReal: string;
  descripcion: string;
}

const STEP_TITLES = [
  "¿En qué tienda?",
  "¿Qué producto?",
  "Diferencia de precio",
  "Confirmar reporte",
];

export function ReportForm() {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(0);
  const [form, setForm] = useState<FormState>({
    tiendaId: "",
    nombreTienda: "",
    productoId: "",
    nombreProducto: "",
    precioPublicado: "",
    precioReal: "",
    descripcion: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(k: K, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const validStep = (() => {
    if (step === 0) return form.nombreTienda.trim().length > 1;
    if (step === 1) return form.nombreProducto.trim().length > 1;
    if (step === 2)
      return (
        parseFloat(form.precioPublicado) >= 0 &&
        parseFloat(form.precioReal) > 0 &&
        form.precioPublicado !== "" &&
        form.precioReal !== ""
      );
    return form.descripcion.trim().length > 5;
  })();

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await reportesApi.crear({
        usuarioId: user?.id ?? 0,
        tiendaId: parseInt(form.tiendaId, 10) || 0,
        nombreTienda: form.nombreTienda,
        productoId: parseInt(form.productoId, 10) || 0,
        nombreProducto: form.nombreProducto,
        precioPublicado: parseFloat(form.precioPublicado),
        precioReal: parseFloat(form.precioReal),
        descripcion: form.descripcion,
      });
      setDone(true);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No pudimos enviar el reporte. Intenta de nuevo.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold">¡Gracias por tu reporte!</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Nuestro equipo lo revisará pronto. Te avisaremos cuando haya
              novedades.
            </p>
          </div>
          <Button
            onClick={() => {
              setForm({
                tiendaId: "",
                nombreTienda: "",
                productoId: "",
                nombreProducto: "",
                precioPublicado: "",
                precioReal: "",
                descripcion: "",
              });
              setStep(0);
              setDone(false);
            }}
          >
            Reportar otro
          </Button>
        </CardContent>
      </Card>
    );
  }

  const progress = ((step + 1) / 4) * 100;

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Paso {step + 1} de 4
          </p>
          <CardTitle>{STEP_TITLES[step]}</CardTitle>
          <CardDescription>
            Ayúdanos a mantener la transparencia de precios en México.
          </CardDescription>
        </div>
        <Progress value={progress} />
      </CardHeader>

      <CardContent className="space-y-5">
        {step === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="nombreTienda">Nombre de la tienda</Label>
              <Input
                id="nombreTienda"
                placeholder="Ej. Walmart Obregón"
                value={form.nombreTienda}
                onChange={(e) => set("nombreTienda", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tiendaId">ID de tienda (opcional)</Label>
              <Input
                id="tiendaId"
                inputMode="numeric"
                placeholder="Ej. 2"
                value={form.tiendaId}
                onChange={(e) =>
                  set("tiendaId", e.target.value.replace(/\D/g, ""))
                }
              />
            </div>
          </div>
        )}

        {step === 1 && (
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
              <Label htmlFor="productoId">ID de producto (opcional)</Label>
              <Input
                id="productoId"
                inputMode="numeric"
                placeholder="Ej. 12"
                value={form.productoId}
                onChange={(e) =>
                  set("productoId", e.target.value.replace(/\D/g, ""))
                }
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="precioPublicado">Precio publicado</Label>
              <Input
                id="precioPublicado"
                inputMode="decimal"
                placeholder="0.00"
                value={form.precioPublicado}
                onChange={(e) => set("precioPublicado", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                El precio que se muestra en góndola o publicidad.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="precioReal">Precio cobrado</Label>
              <Input
                id="precioReal"
                inputMode="decimal"
                placeholder="0.00"
                value={form.precioReal}
                onChange={(e) => set("precioReal", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Lo que en realidad te cobraron en caja.
              </p>
            </div>
            {parseFloat(form.precioReal) > parseFloat(form.precioPublicado) &&
              parseFloat(form.precioPublicado) > 0 && (
                <Alert variant="warning" className="sm:col-span-2">
                  <AlertTitle>Te están cobrando de más</AlertTitle>
                  <AlertDescription>
                    Diferencia:{" "}
                    <strong>
                      {formatPrecio(
                        parseFloat(form.precioReal) -
                          parseFloat(form.precioPublicado),
                      )}
                    </strong>
                  </AlertDescription>
                </Alert>
              )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción del problema</Label>
              <Textarea
                id="descripcion"
                rows={4}
                placeholder="Cuéntanos lo que pasó..."
                value={form.descripcion}
                onChange={(e) => set("descripcion", e.target.value)}
              />
            </div>
            <div className="rounded-lg border bg-muted/40 p-4 text-sm">
              <p className="mb-2 font-semibold">Resumen</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Tienda:</strong>{" "}
                  {form.nombreTienda}
                </li>
                <li>
                  <strong className="text-foreground">Producto:</strong>{" "}
                  {form.nombreProducto}
                </li>
                <li>
                  <strong className="text-foreground">Publicado:</strong>{" "}
                  {form.precioPublicado
                    ? formatPrecio(parseFloat(form.precioPublicado))
                    : "—"}
                </li>
                <li>
                  <strong className="text-foreground">Cobrado:</strong>{" "}
                  {form.precioReal
                    ? formatPrecio(parseFloat(form.precioReal))
                    : "—"}
                </li>
              </ul>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertTitle>No se pudo enviar</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => (s > 0 ? ((s - 1) as Step) : s))}
            disabled={step === 0 || submitting}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Atrás
          </Button>

          {step < 3 ? (
            <Button
              onClick={() => setStep((s) => ((s + 1) as Step))}
              disabled={!validStep}
              className="gap-2"
            >
              Siguiente
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={submit}
              disabled={!validStep || submitting}
              className="gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar reporte"
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
