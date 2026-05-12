"use client";

import { useEffect, useRef } from "react";
import { useWebSocket } from "@/lib/websocket";
import { useNotifications } from "@/components/NotificationProvider";
import { formatPrecio } from "@/lib/utils";

interface OfertaPayload {
  nombreProducto?: string;
  nombreTienda?: string;
  precioOferta?: number;
  precioOriginal?: number;
}

interface InconsistenciaPayload {
  nombreTienda?: string;
  nivel?: string;
  descripcion?: string;
}

export function WebSocketListener() {
  const ofertas = useWebSocket<OfertaPayload>("ofertas");
  const inconsistencias = useWebSocket<InconsistenciaPayload>(
    "inconsistencias",
  );
  const { notify } = useNotifications();
  const lastOfertaId = useRef<number>(0);
  const lastIncId = useRef<number>(0);

  useEffect(() => {
    const m = ofertas.lastMessage;
    if (!m || m.id === lastOfertaId.current) return;
    lastOfertaId.current = m.id;
    const data = m.data ?? {};
    notify({
      kind: "oferta",
      title: data.nombreProducto
        ? `Nueva oferta: ${data.nombreProducto}`
        : "Nueva oferta disponible",
      description: [
        data.nombreTienda,
        data.precioOferta != null
          ? `desde ${formatPrecio(data.precioOferta)}`
          : null,
      ]
        .filter(Boolean)
        .join(" · "),
    });
  }, [ofertas.lastMessage, notify]);

  useEffect(() => {
    const m = inconsistencias.lastMessage;
    if (!m || m.id === lastIncId.current) return;
    lastIncId.current = m.id;
    const data = m.data ?? {};
    notify({
      kind: "warning",
      title: data.nombreTienda
        ? `Alerta: ${data.nombreTienda}`
        : "Alerta de inconsistencia",
      description: data.descripcion ?? "Se detectó una inconsistencia de precios",
    });
  }, [inconsistencias.lastMessage, notify]);

  return null;
}
