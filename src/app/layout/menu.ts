import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeftRight,
  BarChart3,
  Cog,
  LayoutDashboard,
  Package,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Truck,
  Users,
  Wallet,
} from 'lucide-react';

export interface ItemMenu {
  ruta: string;
  label: string;
  icono: LucideIcon;
  /** Fase del plan en la que se implementa (para las pantallas "en construcción"). */
  fase?: number;
}

export interface SeccionMenu {
  titulo: string | null;
  items: ItemMenu[];
}

/** Menú principal (sección 4 de PLAN_DESARROLLO_CLAUDE.md). Los permisos están en auth/permisos.ts */
export const MENU: SeccionMenu[] = [
  { titulo: null, items: [{ ruta: '/dashboard', label: 'Dashboard', icono: LayoutDashboard }] },
  {
    titulo: 'Gestión',
    items: [
      { ruta: '/productos', label: 'Productos', icono: Package, fase: 3 },
      { ruta: '/ventas', label: 'Ventas', icono: ShoppingCart, fase: 7 },
      { ruta: '/compras', label: 'Compras', icono: ShoppingBag, fase: 5 },
    ],
  },
  {
    titulo: 'Stock',
    items: [
      { ruta: '/stock/ajustes', label: 'Ajuste de inventario', icono: SlidersHorizontal, fase: 4 },
      { ruta: '/stock/movimientos', label: 'Movimientos', icono: ArrowLeftRight, fase: 4 },
    ],
  },
  {
    titulo: 'Entidades',
    items: [{ ruta: '/proveedores', label: 'Proveedores', icono: Truck, fase: 3 }],
  },
  {
    titulo: 'Finanzas',
    items: [
      { ruta: '/caja', label: 'Caja', icono: Wallet, fase: 6 },
      { ruta: '/reportes', label: 'Reportes', icono: BarChart3, fase: 8 },
    ],
  },
  {
    titulo: 'Sistema',
    items: [
      { ruta: '/usuarios', label: 'Usuarios', icono: Users, fase: 9 },
      { ruta: '/configuracion', label: 'Configuración', icono: Cog, fase: 9 },
    ],
  },
];

export const ITEMS_MENU: ItemMenu[] = MENU.flatMap((s) => s.items);
