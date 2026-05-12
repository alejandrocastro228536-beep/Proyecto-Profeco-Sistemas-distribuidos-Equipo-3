import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "ProFeCo — Compara precios y reporta abusos",
  description:
    "Plataforma oficial de comparación de precios para consumidores mexicanos. Encuentra el mejor precio y reporta inconsistencias en supermercados, mercados y tianguis.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <footer className="border-t bg-muted/30 py-6 text-sm">
              <div className="container flex flex-col items-center justify-between gap-2 sm:flex-row">
                <p className="text-muted-foreground">
                  © {new Date().getFullYear()} ProFeCo — Procuraduría
                  Federal del Consumidor
                </p>
                <p className="text-xs text-muted-foreground">
                  Comparación transparente · Hecho en México
                </p>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
