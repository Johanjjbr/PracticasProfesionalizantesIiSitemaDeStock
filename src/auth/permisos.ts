import type { Enums } from '@/lib/database.types';

export type Rol = Enums<'rol_empresa'>;

export const ROL_LABEL: Record<Rol, string> = {
  admin: 'Administrador',
  encargado: 'Encargado',
  vendedor: 'Vendedor',
  consulta: 'Consulta',
};

const TODOS: Rol[] = ['admin', 'encargado', 'vendedor', 'consulta'];
const GESTION: Rol[] = ['admin', 'encargado'];

/** Qué roles pueden ver cada ruta. Fuente única para menú y guardas de ruta. */
export const PERMISOS_RUTA: Record<string, Rol[]> = {
  '/dashboard': TODOS,
  '/productos': TODOS,
  '/ventas': ['admin', 'encargado', 'vendedor'],
  '/compras': GESTION,
  '/stock/ajustes': GESTION,
  '/stock/movimientos': ['admin', 'encargado', 'consulta'],
  '/proveedores': GESTION,
  '/caja': ['admin', 'encargado', 'vendedor'],
  '/reportes': ['admin', 'encargado', 'consulta'],
  '/usuarios': ['admin'],
  '/configuracion': ['admin'],
};

export function puedeVer(ruta: string, rol: Rol | null | undefined): boolean {
  if (!rol) return false;
  const roles = PERMISOS_RUTA[ruta];
  return roles ? roles.includes(rol) : true;
}

/** Acciones (no rutas) que dependen del rol. */
export const PERMISOS_ACCION = {
  gestionarCatalogo: GESTION, // productos, categorías, proveedores
  verCostos: GESTION,
} satisfies Record<string, Rol[]>;

export function puede(accion: keyof typeof PERMISOS_ACCION, rol: Rol | null | undefined): boolean {
  return !!rol && PERMISOS_ACCION[accion].includes(rol);
}
