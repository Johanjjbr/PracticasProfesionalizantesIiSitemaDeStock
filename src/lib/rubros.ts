import type { Json, Tables } from './database.types';

export const RUBRO_LABEL: Record<Tables<'empresas'>['rubro'], string> = {
  reposteria: 'Repostería',
  kiosco: 'Kiosco',
  repuestos: 'Repuestos',
  general: 'Comercio',
};

export interface ConfigEmpresa {
  usa_vencimientos: boolean;
  usa_codigo_barras: boolean;
  permite_stock_negativo: boolean;
  usa_recetas: boolean;
  medios_pago: string[];
}

export function configDe(empresa: Pick<Tables<'empresas'>, 'config'>): ConfigEmpresa {
  const c = (empresa.config ?? {}) as Record<string, Json>;
  return {
    usa_vencimientos: c.usa_vencimientos === true,
    usa_codigo_barras: c.usa_codigo_barras === true,
    permite_stock_negativo: c.permite_stock_negativo === true,
    usa_recetas: c.usa_recetas === true,
    medios_pago: Array.isArray(c.medios_pago) ? (c.medios_pago as string[]) : ['efectivo'],
  };
}

export interface AtributoRubro {
  clave: string;
  label: string;
  placeholder?: string;
  multilinea?: boolean;
}

/** Campos extra del producto según el rubro. Se guardan en productos.atributos (jsonb). */
export const ATRIBUTOS_POR_RUBRO: Record<Tables<'empresas'>['rubro'], AtributoRubro[]> = {
  reposteria: [
    { clave: 'alergenos', label: 'Alérgenos', placeholder: 'Ej: gluten, lácteos, frutos secos' },
    { clave: 'conservacion', label: 'Conservación', placeholder: 'Ej: refrigerado, 3 días' },
  ],
  kiosco: [{ clave: 'marca', label: 'Marca' }],
  repuestos: [
    { clave: 'marca', label: 'Marca' },
    { clave: 'codigo_fabricante', label: 'Código de fabricante' },
    { clave: 'compatibilidad', label: 'Compatibilidad', placeholder: 'Ej: Fiat Palio 1.4 2010-2016', multilinea: true },
  ],
  general: [],
};

export const TIPO_PRODUCTO_LABEL: Record<Tables<'productos'>['tipo'], string> = {
  insumo: 'Insumo',
  reventa: 'Reventa',
  elaborado: 'Elaborado',
};
