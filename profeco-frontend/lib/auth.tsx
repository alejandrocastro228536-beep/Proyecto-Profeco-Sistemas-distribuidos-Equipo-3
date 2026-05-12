"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Cookies from "js-cookie";
import type { JwtPayload, Rol, Usuario } from "@/types";

const TOKEN_KEY = "profeco_token";

interface AuthContextValue {
  user: Usuario | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function decode(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

function tokenToUser(token: string): Usuario | null {
  const payload = decode(token);
  if (!payload) return null;
  if (payload.exp && payload.exp * 1000 < Date.now()) return null;
  const id = parseInt(payload.sub, 10);
  if (Number.isNaN(id)) return null;
  return {
    id,
    email: payload.email,
    nombre: payload.nombre,
    rol: payload.rol,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<Usuario | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(TOKEN_KEY);
    if (stored) {
      const u = tokenToUser(stored);
      if (u) {
        setToken(stored);
        setUser(u);
      } else {
        window.localStorage.removeItem(TOKEN_KEY);
        Cookies.remove(TOKEN_KEY);
      }
    }
  }, []);

  const login = useCallback((newToken: string) => {
    window.localStorage.setItem(TOKEN_KEY, newToken);
    Cookies.set(TOKEN_KEY, newToken, { path: "/", sameSite: "lax" });
    setToken(newToken);
    setUser(tokenToUser(newToken));
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    Cookies.remove(TOKEN_KEY, { path: "/" });
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: !!user,
      login,
      logout,
    }),
    [user, token, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}

export function hasRol(user: Usuario | null, rol: Rol): boolean {
  return !!user && user.rol === rol;
}
