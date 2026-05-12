"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useNotifications } from "@/components/NotificationProvider";
import { cn } from "@/lib/utils";

export function NotificationBell({ className }: { className?: string }) {
  const { unread, markAllRead } = useNotifications();

  return (
    <Link
      href="/ofertas"
      onClick={() => markAllRead()}
      className={cn(
        "relative inline-flex h-10 w-10 items-center justify-center rounded-full text-white/90 hover:bg-white/10 transition-colors",
        className,
      )}
      aria-label={`Notificaciones${unread > 0 ? `, ${unread} sin leer` : ""}`}
    >
      <Bell className="h-5 w-5" />
      {unread > 0 && (
        <span className="absolute right-1 top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-profeco-dorado px-1 text-[10px] font-bold text-profeco-rojoOscuro shadow">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
