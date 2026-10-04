# Sistema de Stock multi-empresa

Sistema de stock, compras, ventas y caja para comercios (primer cliente: una repostería; luego kiosco y tienda de repuestos).
Una sola aplicación y una sola base de datos: cada empresa ve solo sus datos (Row Level Security en Supabase).

- Plan, decisiones y bitácora: [`PLAN_DESARROLLO_CLAUDE.md`](./PLAN_DESARROLLO_CLAUDE.md)
- Esquema de base de datos: [`supabase/migrations/`](./supabase/migrations) · datos de ejemplo: [`supabase/seed.sql`](./supabase/seed.sql)

## Stack

React 18 + TypeScript + Vite · Tailwind 4 + shadcn/ui · React Router 7 · TanStack Query · zod · Supabase (Postgres, Auth, RLS).

## Cómo correrlo

```bash
pnpm install
cp .env.example .env.local   # URL y publishable key de Supabase
pnpm dev                     # http://localhost:5173
```

Otros comandos: `pnpm typecheck`, `pnpm build`, `pnpm preview`.

### Usuarios de prueba (empresa ficticia "Dulce Horno")

| Email | Rol | Contraseña |
|---|---|---|
| admin@dulcehorno.test | Administrador | Demo1234 |
| vendedor@dulcehorno.test | Vendedor | Demo1234 |

> Cambiar o eliminar estos usuarios antes de usar el sistema con datos reales.

## Estructura

```
src/
  auth/          AuthProvider (sesión, empresa activa, rol), guardas de ruta, permisos por rol
  features/      un módulo por carpeta (auth, dashboard, productos, …)
  lib/           cliente Supabase, tipos generados, formatos es-AR
  app/
    layout/      Layout con sidebar y definición del menú
    components/ui  componentes shadcn/ui
    pages/       pantallas genéricas
supabase/
  migrations/    SQL versionado (aplicado al proyecto bgrbbpviaoozrpbpoywu)
  seed.sql
```

## Reglas clave

- El stock solo cambia mediante `movimientos_stock` (lo hacen funciones de la BD). El front nunca escribe `stock_actual`.
- Toda tabla de negocio tiene `empresa_id` y RLS. Los permisos se validan en la base, no solo en la UI.
- Después de cada migración: regenerar `src/lib/database.types.ts`.
