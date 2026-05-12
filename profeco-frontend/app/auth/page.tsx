"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Rol } from "@/types";

const ROL_REDIRECT: Record<Rol, string> = {
  CONSUMIDOR: "/consumidor",
  TIENDA: "/tienda",
  ADMIN: "/admin",
};

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="container py-12">Cargando...</div>}>
      <AuthContent />
    </Suspense>
  );
}

function AuthContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const initialRol = (sp.get("rol") as Rol) ?? "CONSUMIDOR";
  const redirect = sp.get("redirect");
  const { login, user } = useAuth();
  const [tab, setTab] = useState<"login" | "registro">("login");

  useEffect(() => {
    if (user) {
      router.replace(redirect ?? ROL_REDIRECT[user.rol]);
    }
  }, [user, redirect, router]);

  if (user) return null;

  return (
    <div className="container max-w-md py-10">
      <div className="mb-6 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-profeco-rojo text-white">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <p className="text-sm font-semibold text-muted-foreground">
          Acceso ProFeCo
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bienvenido</CardTitle>
          <CardDescription>
            Inicia sesión o crea una cuenta para usar todas las funciones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue={tab}
            value={tab}
            onValueChange={(v) => setTab(v as "login" | "registro")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
              <TabsTrigger value="registro">Crear cuenta</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <LoginForm
                onSuccess={(token, rol) => {
                  login(token);
                  router.replace(redirect ?? ROL_REDIRECT[rol]);
                }}
              />
            </TabsContent>

            <TabsContent value="registro">
              <RegistroForm
                initialRol={initialRol}
                onSuccess={(token, rol) => {
                  login(token);
                  router.replace(redirect ?? ROL_REDIRECT[rol]);
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        <Link href="/" className="hover:underline">
          Volver al inicio
        </Link>
      </p>
    </div>
  );
}

function LoginForm({
  onSuccess,
}: {
  onSuccess: (token: string, rol: Rol) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await authApi.login({ email, password });
      const rol = inferRol(res.token);
      onSuccess(res.token, rol);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No se pudo iniciar sesión",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-4 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" disabled={busy} className="w-full gap-2">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        Iniciar sesión
      </Button>
    </form>
  );
}

function RegistroForm({
  initialRol,
  onSuccess,
}: {
  initialRol: Rol;
  onSuccess: (token: string, rol: Rol) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<Rol>(initialRol);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await authApi.registroYLogin({
        email,
        password,
        nombre,
        rol,
      });
      onSuccess(res.token, rol);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No se pudo crear la cuenta",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-4 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre completo</Label>
        <Input
          id="nombre"
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="rmail">Correo electrónico</Label>
        <Input
          id="rmail"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="rpassword">Contraseña</Label>
        <Input
          id="rpassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="rol">Tipo de cuenta</Label>
        <Select
          id="rol"
          value={rol}
          onChange={(e) => setRol(e.target.value as Rol)}
        >
          <option value="CONSUMIDOR">Consumidor</option>
          <option value="TIENDA">Tienda</option>
          <option value="ADMIN">Personal ProFeCo</option>
        </Select>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" disabled={busy} className="w-full gap-2">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        Crear cuenta
      </Button>
    </form>
  );
}

function inferRol(token: string): Rol {
  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded =
      normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const parsed = JSON.parse(atob(padded)) as { rol?: Rol };
    return parsed.rol ?? "CONSUMIDOR";
  } catch {
    return "CONSUMIDOR";
  }
}
