import { z } from 'zod';
import { cuitValido, formatearCuit, vacioANull } from '@/lib/validaciones';
import type { Proveedor, ProveedorEditable } from './api';

export const CONDICIONES_IVA = ['Responsable Inscripto', 'Monotributista', 'Exento', 'Consumidor Final'] as const;
export const CONDICIONES_PAGO = ['Contado', '7 días', '15 días', '30 días', '60 días'] as const;

export interface ProveedorForm {
  razon_social: string;
  nombre_fantasia: string;
  cuit: string;
  condicion_iva: string;
  contacto: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
  condicion_pago: string;
  alias_cbu: string;
  observaciones: string;
  activo: boolean;
}

export const formVacio = (): ProveedorForm => ({
  razon_social: '',
  nombre_fantasia: '',
  cuit: '',
  condicion_iva: '',
  contacto: '',
  telefono: '',
  email: '',
  direccion: '',
  ciudad: '',
  condicion_pago: '',
  alias_cbu: '',
  observaciones: '',
  activo: true,
});

export const formDesdeProveedor = (p: Proveedor): ProveedorForm => ({
  razon_social: p.razon_social,
  nombre_fantasia: p.nombre_fantasia ?? '',
  cuit: p.cuit ?? '',
  condicion_iva: p.condicion_iva ?? '',
  contacto: p.contacto ?? '',
  telefono: p.telefono ?? '',
  email: p.email ?? '',
  direccion: p.direccion ?? '',
  ciudad: p.ciudad ?? '',
  condicion_pago: p.condicion_pago ?? '',
  alias_cbu: p.alias_cbu ?? '',
  observaciones: p.observaciones ?? '',
  activo: p.activo,
});

export type ErroresProveedor = Partial<Record<keyof ProveedorForm, string>>;

const schema = z.object({
  razon_social: z.string().trim().min(2, 'Ingresá la razón social').max(150),
  cuit: z
    .string()
    .trim()
    .refine((v) => v === '' || cuitValido(v), 'CUIT inválido (revisá el dígito verificador)'),
  email: z
    .string()
    .trim()
    .refine((v) => v === '' || z.email().safeParse(v).success, 'Email inválido'),
  telefono: z
    .string()
    .trim()
    .refine((v) => v === '' || /^[0-9+()\-\s]{6,25}$/.test(v), 'Teléfono inválido'),
  alias_cbu: z
    .string()
    .trim()
    .refine(
      (v) => v === '' || /^\d{22}$/.test(v.replace(/\s/g, '')) || /^[a-zA-Z0-9.-]{6,20}$/.test(v),
      'Ingresá un CBU/CVU de 22 dígitos o un alias válido',
    ),
});

export function validarProveedor(
  f: ProveedorForm,
): { ok: true; datos: ProveedorEditable & { razon_social: string } } | { ok: false; errores: ErroresProveedor } {
  const r = schema.safeParse(f);
  if (!r.success) {
    const errores: ErroresProveedor = {};
    for (const i of r.error.issues) errores[i.path[0] as keyof ProveedorForm] ??= i.message;
    return { ok: false, errores };
  }
  return {
    ok: true,
    datos: {
      razon_social: r.data.razon_social,
      nombre_fantasia: vacioANull(f.nombre_fantasia),
      cuit: r.data.cuit ? formatearCuit(r.data.cuit) : null,
      condicion_iva: vacioANull(f.condicion_iva),
      contacto: vacioANull(f.contacto),
      telefono: vacioANull(f.telefono),
      email: vacioANull(f.email)?.toLowerCase() ?? null,
      direccion: vacioANull(f.direccion),
      ciudad: vacioANull(f.ciudad),
      condicion_pago: vacioANull(f.condicion_pago),
      alias_cbu: vacioANull(f.alias_cbu),
      observaciones: vacioANull(f.observaciones),
      activo: f.activo,
    },
  };
}
