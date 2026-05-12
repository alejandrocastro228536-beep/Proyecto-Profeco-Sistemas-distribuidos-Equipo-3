"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8085";

export type WsChannel = "ofertas" | "inconsistencias";

export interface WsMessage<T = unknown> {
  id: number;
  channel: WsChannel;
  receivedAt: number;
  data: T;
}

interface UseWebSocketResult<T> {
  connected: boolean;
  lastMessage: WsMessage<T> | null;
  messages: WsMessage<T>[];
  clear: () => void;
}

const RECONNECT_DELAY = 3000;

export function useWebSocket<T = unknown>(
  channel: WsChannel,
): UseWebSocketResult<T> {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<WsMessage<T>[]>([]);
  const [lastMessage, setLastMessage] = useState<WsMessage<T> | null>(null);
  const idRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const wsRef = useRef<WebSocket | null>(null);
  const closedByUserRef = useRef(false);

  const clear = useCallback(() => {
    setMessages([]);
    setLastMessage(null);
  }, []);

  useEffect(() => {
    closedByUserRef.current = false;

    function connect() {
      try {
        const ws = new WebSocket(
          `${WS_URL}/ws/notificaciones/${channel}`,
        );
        wsRef.current = ws;

        ws.onopen = () => setConnected(true);

        ws.onmessage = (event) => {
          let parsed: T;
          try {
            parsed = JSON.parse(event.data) as T;
          } catch {
            parsed = event.data as unknown as T;
          }
          idRef.current += 1;
          const msg: WsMessage<T> = {
            id: idRef.current,
            channel,
            receivedAt: Date.now(),
            data: parsed,
          };
          setLastMessage(msg);
          setMessages((prev) => [msg, ...prev].slice(0, 50));
        };

        ws.onclose = () => {
          setConnected(false);
          if (!closedByUserRef.current) {
            reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_DELAY);
          }
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch {
        if (!closedByUserRef.current) {
          reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_DELAY);
        }
      }
    }

    connect();

    return () => {
      closedByUserRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, [channel]);

  return { connected, lastMessage, messages, clear };
}
