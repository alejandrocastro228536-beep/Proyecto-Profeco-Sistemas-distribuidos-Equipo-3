"use client";

import { useEffect, useState } from "react";
import { CircleDot, RadioTower, Sparkles, WifiOff } from "lucide-react";
import { StoreTypeBadge } from "@/components/StoreTypeBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWebSocket } from "@/lib/websocket";
import { useAuth } from "@/lib/auth";
import { useNotifications } from "@/components/NotificationProvider";
import { formatFecha, formatPrecio } from "@/lib/utils";
import { mockOfertas } from "@/lib/mock-data";
import type { OfertaDTO, TipoTienda } from "@/types";

interface OfertaFeed extends OfertaDTO {
  recibidaEn: number;
  tipoTienda?: TipoTienda;
}

export default function OfertasPage() {
  const { connected, lastMessage } = useWebSocket<OfertaDTO>("ofertas");
  const { markAllRead } = useNotifications();
  const { user } = useAuth();
  const [feed, setFeed] = useState<OfertaFeed[]>(
    mockOfertas.map((o) => ({ ...o, recibidaEn: Date.now() })),
  );

  useEffect(() => {
    markAllRead();
  }, [markAllRead]);

  useEffect(() => {
    if (!lastMessage) return;
    const data = lastMessage.data;
    if (!data || typeof data !== "object") return;
    setFeed((prev) =>
      [
        {
          ...(data as OfertaDTO),
          recibidaEn: lastMessage.receivedAt,
        },
        ...prev,
      ].slice(0, 30),
    );
  }, [lastMessage]);

  return (
    <div className="container py-6 sm:py-10">
      <div className="flex items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Ofertas en tiempo real
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Promociones publicadas por tiendas registradas. Se actualizan
            automáticamente.
          </p>
        </div>
        <ConnStatus connected={connected} />
      </div>

      {user && (
        <p className="mt-3 text-xs text-muted-foreground">
          Recibiendo como <strong>{user.nombre}</strong> ({user.rol.toLowerCase()})
        </p>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {feed.length === 0 ? (
          <div className="lg:col-span-2 rounded-xl border border-dashed bg-muted/30 p-10 text-center">
            <RadioTower className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">
              Esperando ofertas... aparecerán aquí en cuanto las tiendas
              publiquen.
            </p>
          </div>
        ) : (
          feed.map((o, idx) => (
            <OfertaCard key={`${o.productoId}-${o.tiendaId}-${idx}`} oferta={o} />
          ))
        )}
      </div>
    </div>
  );
}

function ConnStatus({ connected }: { connected: boolean }) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
        connected
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-700"
      }`}
      title={connected ? "Recibiendo en tiempo real" : "Reconectando..."}
    >
      {connected ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
          </span>
          En vivo
        </>
      ) : (
        <>
          <WifiOff className="h-3.5 w-3.5" />
          Reconectando
        </>
      )}
    </div>
  );
}

function OfertaCard({ oferta }: { oferta: OfertaFeed }) {
  const descuento =
    oferta.precioOriginal > 0
      ? ((oferta.precioOriginal - oferta.precioOferta) /
          oferta.precioOriginal) *
        100
      : 0;

  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-md">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-orange-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
                Oferta nueva
              </span>
            </div>
            <h3 className="mt-2 truncate text-lg font-semibold">
              {oferta.nombreProducto}
            </h3>
            <p className="text-sm text-muted-foreground">
              {oferta.nombreTienda}
            </p>
            {oferta.tipoTienda && (
              <div className="mt-2">
                <StoreTypeBadge tipo={oferta.tipoTienda} size="sm" />
              </div>
            )}
          </div>

          {descuento > 0 && (
            <Badge variant="warning" className="shrink-0">
              -{descuento.toFixed(0)}%
            </Badge>
          )}
        </div>

        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold tabular-nums text-orange-600">
            {formatPrecio(oferta.precioOferta)}
          </span>
          <span className="text-sm text-muted-foreground line-through tabular-nums">
            {formatPrecio(oferta.precioOriginal)}
          </span>
        </div>

        {oferta.descripcion && (
          <p className="text-sm text-muted-foreground">{oferta.descripcion}</p>
        )}

        <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CircleDot className="h-3 w-3 text-emerald-500" />
            Hace {hace(oferta.recibidaEn)}
          </span>
          <span>Vence {formatFecha(oferta.fechaExpiracion)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function hace(ts: number): string {
  const diff = Math.max(0, Date.now() - ts);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h`;
  return `${Math.floor(h / 24)} días`;
}
