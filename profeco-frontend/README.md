# ProFeCo — Frontend

Plataforma de comparación de precios para consumidores mexicanos, construida con
**Next.js 14 (App Router) + TypeScript + Tailwind CSS** y componentes de tipo
shadcn/ui.

Se conecta al backend Quarkus (microservicios) en
`http://localhost:8080/api` y al canal de WebSocket en `ws://localhost:8085`.

## Stack

- Next.js 14 (App Router, server components donde aplica)
- React 18 + TypeScript estricto
- Tailwind CSS 3 (paleta ProFeCo) + `tailwindcss-animate`
- `@tanstack/react-query` para data caching
- `class-variance-authority` + `tailwind-merge` para variants
- `lucide-react` para íconos
- `js-cookie` para sincronizar el JWT con el middleware (server-side)
- WebSocket nativo con auto-reconexión cada 3s

## Skills aplicados (Vercel agent skills)

Antes de generar el código se invocó `find-skills` y se instalaron:

| Skill | Para qué se usó |
|-------|----------------|
| `vercel-labs/agent-skills@vercel-react-best-practices` | patrones de Server/Client Components, memoización, fetch con cache: "no-store" |
| `anthropics/skills@frontend-design` | jerarquía visual, paleta institucional, focus states |
| `wshobson/agents@nextjs-app-router-patterns` | layouts anidados, `Suspense` para `useSearchParams`, middleware |
| `shadcn/ui@shadcn` | API de componentes (Card, Button, Tabs, Dialog…) reimplementada inline |

## Instalación

```bash
cd profeco-frontend
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Variables de entorno

Ya están en `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_WS_URL=ws://localhost:8085
```

## Rutas

| Ruta | Acceso | Descripción |
|------|--------|-------------|
| `/` | público | Búsqueda destacada y onboarding por rol |
| `/busqueda` | público | Resultados con filtros y comparación |
| `/ofertas` | público | Feed en tiempo real (WebSocket) |
| `/auth` | público | Login / registro con selector de rol |
| `/consumidor` | CONSUMIDOR | Dashboard del consumidor |
| `/consumidor/preferencias` | CONSUMIDOR | Favoritos / lista del super |
| `/consumidor/reportar` | CONSUMIDOR | Reporte multi-paso |
| `/tienda` | TIENDA | Panel de la tienda con stats de reportes |
| `/tienda/ofertas/nueva` | TIENDA | Publicación con preview en vivo |
| `/admin` | ADMIN | Resumen de sanciones |
| `/admin/sanciones` | ADMIN | Gestión (aplicar / apelar) |
| `/admin/reportes` | ADMIN | Bandeja de reportes |

La protección de rutas se hace en [`middleware.ts`](./middleware.ts): decodifica
el JWT desde la cookie `profeco_token` y redirige a `/auth?redirect=...` si no
hay sesión o el rol no coincide.

## Modo demo / degradación elegante

- Si la API REST falla, las páginas públicas muestran un banner
  **"Modo demo — datos de ejemplo"** y se renderizan con los mocks de
  [`lib/mock-data.ts`](./lib/mock-data.ts).
- Si el WebSocket se cae, aparece **"Reconectando"** y se intenta reconectar
  cada 3 segundos. El feed de ofertas sigue siendo navegable.

## Convenciones de UI

- Precios siempre en pesos mexicanos `$XX.XX` (`Intl.NumberFormat es-MX`).
- Fechas largas en español: `30 de abril de 2026`.
- Tipos de tienda con color: **azul** supermercado, **verde** mercado, **naranja** tianguis.
- Precio más bajo: tarjeta verde con estrella; más alto: rojo con advertencia.
- Mobile-first: navbar colapsa a menú hamburguesa por debajo de `lg`.
- Toda la UI está en español.
