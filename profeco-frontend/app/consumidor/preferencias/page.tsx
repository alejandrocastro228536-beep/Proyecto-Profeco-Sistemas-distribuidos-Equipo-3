"use client";

import { useEffect, useState } from "react";
import { Heart, Loader2, ShoppingBasket, Store, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { preferenciasApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Preferencia, TipoPreferencia } from "@/types";

const TABS: { value: TipoPreferencia; label: string; Icon: typeof Heart }[] = [
  { value: "PRODUCTO_FAVORITO", label: "Productos", Icon: ShoppingBasket },
  { value: "TIENDA_FAVORITA", label: "Tiendas", Icon: Store },
  { value: "LISTA_SUPER", label: "Lista del super", Icon: Heart },
];

export default function PreferenciasPage() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Preferencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TipoPreferencia>("PRODUCTO_FAVORITO");
  const [nombre, setNombre] = useState("");
  const [elementoId, setElementoId] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    preferenciasApi
      .listar(user.id)
      .then((res) => {
        if (!cancelled) setPrefs(res);
      })
      .catch(() => {
        if (!cancelled) setPrefs([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) return null;

  const filtered = prefs.filter((p) => p.tipo === tab);

  const agregar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setBusy(true);
    try {
      const nueva = await preferenciasApi.agregar(user.id, {
        tipo: tab,
        elementoId: parseInt(elementoId, 10) || Date.now(),
        nombreElemento: nombre.trim(),
      });
      setPrefs((p) => [nueva, ...p]);
      setNombre("");
      setElementoId("");
    } catch {
      // optimistic offline
      setPrefs((p) => [
        {
          id: Date.now(),
          usuarioId: user.id,
          tipo: tab,
          elementoId: parseInt(elementoId, 10) || Date.now(),
          nombreElemento: nombre.trim(),
        },
        ...p,
      ]);
      setNombre("");
      setElementoId("");
    } finally {
      setBusy(false);
    }
  };

  const eliminar = async (p: Preferencia) => {
    setPrefs((arr) => arr.filter((x) => x.id !== p.id));
    try {
      await preferenciasApi.eliminar(user.id, p.id);
    } catch {
      // silent
    }
  };

  return (
    <div className="container py-8">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-profeco-rojo">
          Mis preferencias
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Favoritos y lista del super
        </h1>
        <p className="mt-1 text-muted-foreground">
          Guarda los productos y tiendas que más consultas.
        </p>
      </header>

      <Tabs
        defaultValue={tab}
        value={tab}
        onValueChange={(v) => setTab(v as TipoPreferencia)}
      >
        <TabsList className="grid w-full max-w-md grid-cols-3">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="gap-1.5">
              <t.Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((t) => (
          <TabsContent key={t.value} value={t.value}>
            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_400px]">
              <Card>
                <CardHeader>
                  <CardTitle>{t.label}</CardTitle>
                  <CardDescription>
                    {filtered.length} elemento
                    {filtered.length === 1 ? "" : "s"} guardado
                    {filtered.length === 1 ? "" : "s"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : filtered.length === 0 ? (
                    <p className="rounded-md border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                      Aún no has guardado nada aquí.
                    </p>
                  ) : (
                    <ul className="divide-y">
                      {filtered.map((p) => (
                        <li
                          key={p.id}
                          className="flex items-center justify-between gap-3 py-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {p.nombreElemento}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ID #{p.elementoId}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => eliminar(p)}
                            className="gap-1.5 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Agregar</CardTitle>
                  <CardDescription>
                    Guarda un nuevo {t.label.toLowerCase()}.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={agregar} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Nombre</label>
                      <Input
                        placeholder={
                          t.value === "TIENDA_FAVORITA"
                            ? "Walmart Obregón"
                            : t.value === "PRODUCTO_FAVORITO"
                              ? "Leche 1L"
                              : "Mis compras del mes"
                        }
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">
                        ID (opcional)
                      </label>
                      <Input
                        inputMode="numeric"
                        placeholder="Si lo conoces"
                        value={elementoId}
                        onChange={(e) =>
                          setElementoId(e.target.value.replace(/\D/g, ""))
                        }
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={!nombre.trim() || busy}
                      className="w-full gap-2"
                    >
                      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                      Guardar
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
