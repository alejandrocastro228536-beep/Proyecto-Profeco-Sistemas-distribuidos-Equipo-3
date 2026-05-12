"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Megaphone, ShieldCheck, Sparkles, Store } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SUGERENCIAS = ["Leche", "Huevo", "Arroz", "Aceite", "Tortilla", "Frijol"];

export default function HomePage() {
  const router = useRouter();

  const goBusqueda = (q: string) => {
    const query = q.trim();
    router.push(query ? `/busqueda?q=${encodeURIComponent(query)}` : "/busqueda");
  };

  return (
    <>
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-profeco-rojo to-profeco-rojoOscuro text-white">
        <div className="container relative py-14 sm:py-20">
          <Badge variant="secondary" className="mb-5 gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Plataforma oficial ProFeCo
          </Badge>
          <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Compara precios.{" "}
            <span className="text-profeco-dorado">Defiende tu dinero.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/85 sm:text-lg">
            Encuentra el mejor precio en supermercados, mercados y tianguis
            cerca de ti. Sin registro, sin trampas.
          </p>

          <div className="mt-8 max-w-2xl">
            <div className="rounded-xl bg-white p-3 shadow-2xl">
              <SearchBar
                placeholder="Busca leche, arroz, aceite..."
                onSubmit={goBusqueda}
                autoFocus
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-white/70">
                Populares:
              </span>
              {SUGERENCIAS.map((s) => (
                <button
                  key={s}
                  onClick={() => goBusqueda(s)}
                  className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/20"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-profeco-dorado/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-profeco-dorado/10 blur-3xl"
        />
      </section>

      <section className="container py-14">
        <h2 className="text-2xl font-bold tracking-tight">
          Cómo te ayuda ProFeCo
        </h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Toda la cadena del consumidor en una sola plataforma.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Feature
            Icon={Store}
            title="Compara entre tiendas"
            desc="Supermercado, mercado o tianguis. Mismo producto, lado a lado."
          />
          <Feature
            Icon={Sparkles}
            title="Ofertas en tiempo real"
            desc="Recibe notificaciones cuando una tienda publica una promoción."
          />
          <Feature
            Icon={Megaphone}
            title="Reporta inconsistencias"
            desc="Si te cobran de más, ProFeCo investiga y sanciona."
          />
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          <Link
            href="/auth?rol=CONSUMIDOR"
            className="group rounded-xl border bg-card p-5 transition-all hover:border-profeco-rojo hover:shadow"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Soy consumidor
            </p>
            <p className="mt-2 text-lg font-semibold">
              Encuentra y reporta →
            </p>
          </Link>
          <Link
            href="/auth?rol=TIENDA"
            className="group rounded-xl border bg-card p-5 transition-all hover:border-profeco-rojo hover:shadow"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Soy tienda
            </p>
            <p className="mt-2 text-lg font-semibold">
              Publica tus precios →
            </p>
          </Link>
          <Link
            href="/auth?rol=ADMIN"
            className="group rounded-xl border bg-card p-5 transition-all hover:border-profeco-rojo hover:shadow"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Personal ProFeCo
            </p>
            <p className="mt-2 text-lg font-semibold">
              Acceso administrativo →
            </p>
          </Link>
        </div>
      </section>
    </>
  );
}

function Feature({
  Icon,
  title,
  desc,
}: {
  Icon: typeof Store;
  title: string;
  desc: string;
}) {
  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="space-y-3 p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-profeco-rojo/10 text-profeco-rojo">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </CardContent>
    </Card>
  );
}
