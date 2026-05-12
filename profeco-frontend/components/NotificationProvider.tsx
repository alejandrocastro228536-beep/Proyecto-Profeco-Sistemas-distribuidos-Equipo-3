"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle, CheckCircle2, Info, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastKind = "info" | "success" | "warning" | "oferta";

export interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
}

interface NotificationContextValue {
  toasts: ToastItem[];
  notify: (toast: Omit<ToastItem, "id">) => void;
  dismiss: (id: number) => void;
  unread: number;
  markAllRead: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

let idCounter = 0;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [unread, setUnread] = useState(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (toast: Omit<ToastItem, "id">) => {
      idCounter += 1;
      const item: ToastItem = { id: idCounter, ...toast };
      setToasts((prev) => [...prev, item]);
      setUnread((u) => u + 1);
      const timeout = setTimeout(() => dismiss(item.id), 6000);
      return () => clearTimeout(timeout);
    },
    [dismiss],
  );

  const markAllRead = useCallback(() => setUnread(0), []);

  return (
    <NotificationContext.Provider
      value={{ toasts, notify, dismiss, unread, markAllRead }}
    >
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error(
      "useNotifications debe usarse dentro de <NotificationProvider>",
    );
  return ctx;
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4 sm:max-w-sm"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: number) => void;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const conf = TOAST_CONF[toast.kind];

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto w-full overflow-hidden rounded-lg border bg-background shadow-xl transition-all",
        visible
          ? "translate-x-0 opacity-100"
          : "translate-x-6 opacity-0",
        conf.border,
      )}
    >
      <div className="flex gap-3 p-3">
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", conf.iconBg)}>
          <conf.Icon className="h-5 w-5 text-white" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight">{toast.title}</p>
          {toast.description && (
            <p className="mt-1 text-xs text-muted-foreground">
              {toast.description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted"
          aria-label="Cerrar notificación"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

const TOAST_CONF = {
  info: {
    Icon: Info,
    border: "border-blue-300",
    iconBg: "bg-blue-600",
  },
  success: {
    Icon: CheckCircle2,
    border: "border-emerald-300",
    iconBg: "bg-emerald-600",
  },
  warning: {
    Icon: AlertTriangle,
    border: "border-amber-300",
    iconBg: "bg-amber-500",
  },
  oferta: {
    Icon: Sparkles,
    border: "border-orange-300",
    iconBg: "bg-orange-500",
  },
} as const;
