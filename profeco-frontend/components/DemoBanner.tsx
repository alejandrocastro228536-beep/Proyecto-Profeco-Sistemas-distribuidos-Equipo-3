"use client";

import { Info, X } from "lucide-react";
import { useState } from "react";

interface Props {
  message?: string;
}

export function DemoBanner({
  message = "Modo demo — mostrando datos de ejemplo porque el backend no responde",
}: Props) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <div className="border-b border-amber-200 bg-amber-50 text-amber-900">
      <div className="container flex items-center gap-3 py-2 text-sm">
        <Info className="h-4 w-4 shrink-0" aria-hidden />
        <p className="flex-1">{message}</p>
        <button
          type="button"
          onClick={() => setHidden(true)}
          className="rounded p-1 hover:bg-amber-100"
          aria-label="Ocultar aviso"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
