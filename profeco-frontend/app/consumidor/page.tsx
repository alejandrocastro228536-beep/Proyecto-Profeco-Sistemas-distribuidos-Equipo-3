"use client";

import Link from "next/link";
import { Heart, Megaphone, ShoppingBasket, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/lib/auth";

export default function ConsumidorDashboard() {
  const { user } = useAuth();
  return (
    <div className="container py-8">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-profeco-rojo">
          Panel del consumidor
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Hola, {user?.nombre?.split(" ")[0] ?? "consumidor"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Todo lo que necesitas para gastar mejor.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DashCard
          href="/busqueda"
          Icon={ShoppingBasket}
          title="Comparar precios"
          desc="Busca productos y encuentra el mejor precio."
        />
        <DashCard
          href="/ofertas"
          Icon={Sparkles}
          title="Ofertas en vivo"
          desc="Notificaciones de promociones en tiempo real."
        />
        <DashCard
          href="/consumidor/preferencias"
          Icon={Heart}
          title="Mis favoritos"
          desc="Productos, tiendas y tu lista del super."
        />
        <DashCard
          href="/consumidor/reportar"
          Icon={Megaphone}
          title="Reportar inconsistencia"
          desc="Si te cobraron de más, levanta un reporte."
        />
      </div>
    </div>
  );
}

function DashCard({
  href,
  Icon,
  title,
  desc,
}: {
  href: string;
  Icon: typeof Heart;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href} className="group">
      <Card className="h-full transition-all group-hover:border-profeco-rojo group-hover:shadow-md">
        <CardHeader>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-profeco-rojo/10 text-profeco-rojo">
            <Icon className="h-5 w-5" />
          </div>
          <CardTitle className="mt-3">{title}</CardTitle>
          <CardDescription>{desc}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium text-profeco-rojo group-hover:underline">
            Ir →
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
