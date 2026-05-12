import type { ReactNode } from "react";

export default function ConsumidorLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="bg-muted/20">{children}</div>;
}
