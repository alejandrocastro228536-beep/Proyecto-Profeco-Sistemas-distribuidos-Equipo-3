import { AlertTriangle, Sparkles, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StoreTypeBadge } from "@/components/StoreTypeBadge";
import { cn, formatPrecio } from "@/lib/utils";
import type { ResultadoBusqueda } from "@/types";

interface Props {
  resultado: ResultadoBusqueda;
  esMinimo?: boolean;
  esMaximo?: boolean;
  ahorroVsMax?: { ahorro: number; porcentaje: number };
}

export function PriceCard({
  resultado,
  esMinimo,
  esMaximo,
  ahorroVsMax,
}: Props) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all hover:shadow-md",
        esMinimo && "border-emerald-500/70 ring-1 ring-emerald-500/30",
        esMaximo && "border-red-300",
      )}
    >
      {resultado.esOferta && (
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-orange-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow animate-pulse-oferta">
          <Sparkles className="h-3 w-3" aria-hidden />
          Oferta
        </div>
      )}

      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold leading-tight text-foreground">
              {resultado.nombreTienda}
            </p>
            <div className="mt-2">
              <StoreTypeBadge tipo={resultado.tipoTienda} size="sm" />
            </div>
          </div>

          {esMinimo && (
            <Badge variant="success" className="gap-1">
              <Star className="h-3 w-3 fill-current" aria-hidden />
              Más bajo
            </Badge>
          )}
          {esMaximo && !esMinimo && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" aria-hidden />
              Más alto
            </Badge>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              "text-3xl font-bold tabular-nums tracking-tight",
              esMinimo
                ? "text-emerald-700"
                : esMaximo
                  ? "text-red-700"
                  : "text-foreground",
            )}
          >
            {formatPrecio(resultado.precio)}
          </span>
        </div>

        {ahorroVsMax && ahorroVsMax.ahorro > 0 && (
          <p className="text-xs text-emerald-700">
            Ahorra {formatPrecio(ahorroVsMax.ahorro)} (
            {ahorroVsMax.porcentaje.toFixed(0)}%) vs precio más caro
          </p>
        )}
      </CardContent>
    </Card>
  );
}
