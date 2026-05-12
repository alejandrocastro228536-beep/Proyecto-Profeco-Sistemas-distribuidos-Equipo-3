import { ShoppingCart, Store, Tent } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TipoTienda } from "@/types";

const META: Record<
  TipoTienda,
  { label: string; classes: string; Icon: typeof ShoppingCart }
> = {
  SUPERMERCADO: {
    label: "Supermercado",
    classes: "bg-tienda-super text-white border-transparent",
    Icon: ShoppingCart,
  },
  MERCADO: {
    label: "Mercado",
    classes: "bg-tienda-mercado text-white border-transparent",
    Icon: Store,
  },
  TIANGUIS: {
    label: "Tianguis",
    classes: "bg-tienda-tianguis text-white border-transparent",
    Icon: Tent,
  },
};

interface Props {
  tipo: TipoTienda;
  size?: "sm" | "md";
  className?: string;
}

export function StoreTypeBadge({ tipo, size = "md", className }: Props) {
  const { label, classes, Icon } = META[tipo];
  return (
    <Badge
      variant="outline"
      className={cn(
        classes,
        size === "sm" ? "gap-1 px-2 py-0.5 text-[10px]" : "gap-1.5 px-2.5 py-1",
        className,
      )}
    >
      <Icon
        className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"}
        aria-hidden
      />
      <span>{label}</span>
    </Badge>
  );
}
