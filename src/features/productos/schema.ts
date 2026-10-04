import { z } from 'zod';
import { parseNumero, vacioANull } from '@/lib/validaciones';
import type { Producto, ProductoEditable, UnidadMedida } from './api';
import { atributosComoObjeto } from './api';

/** Estado del formulario: todo como texto, tal cual lo escribe el usuario. */
export interface ProductoForm {
  codigo: string;
  codigo_barras: string;
  nombre: string;
  descripcion: string;
  categoria_id: string; // '' = sin categoría
  unidad_codigo: string;
  tipo: Producto['tipo'];
  precio_costo: string;
  precio_venta: string;
  stock_minimo: string;
  stock_inicial: string;
  controla_stock: boolean;
  activo: boolean;
  atributos: Record<string, string>;
}

export const formVacio = (): ProductoForm => ({
  codigo: '',
  codigo_barras: '',
  nombre: '',
  descripcion: '',
  categoria_id: '',
  unidad_codigo: 'un',
  tipo: 'reventa',
  precio_costo: '',
  precio_venta: '',
  stock_minimo: '0',
  stock_inicial: '',
  controla_stock: true,
  activo: true,
  atributos: {},
});

const aTexto = (n: number) => String(Number(n)).replace('.', ',');

export const formDesdeProducto = (p: Producto): ProductoForm => ({
  codigo: p.codigo,
  codigo_barras: p.codigo_barras ?? '',
  nombre: p.nombre,
  descripcion: p.descripcion ?? '',
  categoria_id: p.categoria_id ?? '',
  unidad_codigo: p.unidad_codigo,
  tipo: p.tipo,
  precio_costo: aTexto(p.precio_costo),
  precio_venta: aTexto(p.precio_venta),
  stock_minimo: aTexto(p.stock_minimo),
  stock_inicial: '',
  controla_stock: p.controla_stock,
  activo: p.activo,
  atributos: atributosComoObjeto(p.atributos),
});

const numero = (campo: string, opciones: { min?: number; entero?: boolean } = {}) =>
  z.string().transform((v, ctx) => {
    const n = v.trim() === '' ? 0 : parseNumero(v);
    if (Number.isNaN(n)) {
      ctx.addIssue({ code: 'custom', message: `${campo}: número inválido` });
      return z.NEVER;
    }
    if (opciones.min !== undefined && n < opciones.min) {
      ctx.addIssue({ code: 'custom', message: `${campo}: no puede ser negativo` });
      return z.NEVER;
    }
    if (opciones.entero && !Number.isInteger(n)) {
      ctx.addIssue({ code: 'custom', message: `${campo}: la unidad no admite decimales` });
      return z.NEVER;
    }
    return n;
  });

export type ErroresForm = Partial<Record<keyof ProductoForm, string>>;

export interface ProductoValidado {
  datos: ProductoEditable & { codigo: string; nombre: string };
  stockInicial: number;
}

export function validarProducto(
  f: ProductoForm,
  unidad: UnidadMedida | undefined,
): { ok: true; valor: ProductoValidado } | { ok: false; errores: ErroresForm } {
  const entero = unidad ? !unidad.permite_decimales : false;
  const schema = z.object({
    codigo: z.string().trim().min(1, 'Ingresá un código').max(40, 'Máximo 40 caracteres'),
    nombre: z.string().trim().min(2, 'Ingresá un nombre').max(120, 'Máximo 120 caracteres'),
    codigo_barras: z
      .string()
      .trim()
      .refine((v) => v === '' || /^[0-9A-Za-z-]{4,32}$/.test(v), 'Código de barras inválido'),
    precio_costo: numero('Precio de costo', { min: 0 }),
    precio_venta: numero('Precio de venta', { min: 0 }),
    stock_minimo: numero('Stock mínimo', { min: 0, entero }),
    stock_inicial: numero('Stock inicial', { min: 0, entero }),
    unidad_codigo: z.string().min(1, 'Elegí una unidad'),
  });

  const r = schema.safeParse(f);
  if (!r.success) {
    const errores: ErroresForm = {};
    for (const issue of r.error.issues) {
      const campo = issue.path[0] as keyof ProductoForm;
      { const m = issue.message.replace(/^[^:]+: /, ''); errores[campo] ??= m.charAt(0).toUpperCase() + m.slice(1); }
    }
    return { ok: false, errores };
  }

  const atributos = Object.fromEntries(
    Object.entries(f.atributos)
      .map(([k, v]) => [k, v.trim()] as const)
      .filter(([, v]) => v !== ''),
  );

  return {
    ok: true,
    valor: {
      datos: {
        codigo: r.data.codigo.toUpperCase(),
        nombre: r.data.nombre,
        codigo_barras: vacioANull(r.data.codigo_barras),
        descripcion: vacioANull(f.descripcion),
        categoria_id: f.categoria_id || null,
        unidad_codigo: r.data.unidad_codigo,
        tipo: f.tipo,
        precio_costo: r.data.precio_costo,
        precio_venta: r.data.precio_venta,
        stock_minimo: f.controla_stock ? r.data.stock_minimo : 0,
        controla_stock: f.controla_stock,
        atributos,
        activo: f.activo,
      },
      stockInicial: f.controla_stock ? r.data.stock_inicial : 0,
    },
  };
}

/** Margen sobre el costo, en %. null si no se puede calcular. */
export function margenSobreCosto(costo: number, venta: number): number | null {
  if (!(costo > 0) || !(venta > 0)) return null;
  return ((venta - costo) / costo) * 100;
}
