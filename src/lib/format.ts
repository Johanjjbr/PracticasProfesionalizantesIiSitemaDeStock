const ars = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 });
const num = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 3 });
const fecha = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Argentina/Buenos_Aires',
});

export const formatMoneda = (v: number | null | undefined) => ars.format(Number(v ?? 0));
export const formatNumero = (v: number | null | undefined) => num.format(Number(v ?? 0));
export const formatFecha = (iso: string | null | undefined) => (iso ? fecha.format(new Date(iso)) : '—');

const DUPLICADOS: Record<string, string> = {
  uq_productos_codigo_barras: 'Ya existe un producto con ese código de barras.',
  uq_productos_codigo: 'Ya existe un producto con ese código.',
  uq_categorias_nombre: 'Ya existe una categoría con ese nombre.',
  uq_proveedores_cuit: 'Ya existe un proveedor con ese CUIT.',
  uq_compras_comprobante: 'Ese comprobante de ese proveedor ya fue cargado.',
};

/** Traduce errores de Postgres/Supabase a un mensaje legible. */
export function mensajeError(err: unknown): string {
  if (!err) return 'Error desconocido';
  if (typeof err === 'string') return err;
  const e = err as { message?: string; code?: string };
  if (e.code === '42501') return 'No tenés permisos para realizar esta acción.';
  if (e.code === '23505') {
    const m = e.message ?? '';
    for (const [restriccion, texto] of Object.entries(DUPLICADOS)) if (m.includes(restriccion)) return texto;
    return 'Ya existe un registro con esos datos.';
  }
  if (e.message === 'Invalid login credentials') return 'Email o contraseña incorrectos.';
  if (e.message === 'Email not confirmed') return 'Tenés que confirmar tu email antes de ingresar.';
  return e.message ?? 'Error desconocido';
}

/** Fecha de hoy en Buenos Aires como yyyy-mm-dd (para inputs type="date"). */
export function hoyISO(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());
}

/** Formatea una fecha "yyyy-mm-dd" (sin hora) como dd/mm/aaaa. */
export const formatFechaCorta = (d: string | null | undefined) => {
  if (!d) return '—';
  const [a, m, dia] = d.slice(0, 10).split('-');
  return `${dia}/${m}/${a}`;
};
