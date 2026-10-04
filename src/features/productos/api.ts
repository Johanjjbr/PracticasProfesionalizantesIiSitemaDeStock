import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useEmpresa } from '@/auth/AuthProvider';
import type { Json, Tables, TablesInsert, TablesUpdate } from '@/lib/database.types';

export type Producto = Tables<'productos'>;
export type Categoria = Tables<'categorias'>;
export type UnidadMedida = Tables<'unidades_medida'>;

/** Columnas editables desde la app (coinciden con los GRANT de la migración 0002). */
export type ProductoEditable = Pick<
  TablesUpdate<'productos'>,
  | 'codigo'
  | 'codigo_barras'
  | 'nombre'
  | 'descripcion'
  | 'categoria_id'
  | 'unidad_codigo'
  | 'tipo'
  | 'precio_costo'
  | 'precio_venta'
  | 'stock_minimo'
  | 'controla_stock'
  | 'atributos'
  | 'activo'
>;

export const productosKeys = {
  todos: (empresaId: string) => ['productos', empresaId] as const,
  categorias: (empresaId: string) => ['categorias', empresaId] as const,
  unidades: ['unidades_medida'] as const,
};

/** Productos de la empresa activa con su categoría. */
export function useProductos() {
  const { empresa } = useEmpresa();
  return useQuery({
    queryKey: productosKeys.todos(empresa.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('productos')
        .select('*, categoria:categorias(id, nombre)')
        .eq('empresa_id', empresa.id)
        .order('nombre');
      if (error) throw error;
      return data;
    },
  });
}

export type ProductoConCategoria = NonNullable<ReturnType<typeof useProductos>['data']>[number];

export function useCategorias() {
  const { empresa } = useEmpresa();
  return useQuery({
    queryKey: productosKeys.categorias(empresa.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('empresa_id', empresa.id)
        .order('nombre');
      if (error) throw error;
      return data;
    },
  });
}

export function useUnidades() {
  return useQuery({
    queryKey: productosKeys.unidades,
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase.from('unidades_medida').select('*').order('orden');
      if (error) throw error;
      return data;
    },
  });
}

// ---------------------------------------------------------------------------
// Mutaciones
// ---------------------------------------------------------------------------

function useInvalidarCatalogo() {
  const qc = useQueryClient();
  const { empresa } = useEmpresa();
  return () => {
    void qc.invalidateQueries({ queryKey: productosKeys.todos(empresa.id) });
    void qc.invalidateQueries({ queryKey: productosKeys.categorias(empresa.id) });
  };
}

export interface CrearProductoInput {
  datos: Omit<ProductoEditable, 'codigo' | 'nombre'> & { codigo: string; nombre: string };
  stockInicial: number;
}

export interface CrearProductoResultado {
  producto: Producto;
  /** Si el producto se creó pero falló la carga del stock inicial. */
  errorStock: unknown | null;
}

export function useCrearProducto() {
  const { empresa } = useEmpresa();
  const invalidar = useInvalidarCatalogo();
  return useMutation({
    mutationFn: async ({ datos, stockInicial }: CrearProductoInput): Promise<CrearProductoResultado> => {
      const fila: TablesInsert<'productos'> = { ...datos, empresa_id: empresa.id };
      const { data, error } = await supabase.from('productos').insert(fila).select().single();
      if (error) throw error;

      let errorStock: unknown | null = null;
      if (stockInicial > 0 && data.controla_stock) {
        const { error: e } = await supabase.rpc('registrar_stock_inicial', {
          p_producto: data.id,
          p_cantidad: stockInicial,
        });
        errorStock = e;
      }
      return { producto: data, errorStock };
    },
    onSuccess: invalidar,
  });
}

export function useActualizarProducto() {
  const invalidar = useInvalidarCatalogo();
  return useMutation({
    mutationFn: async ({ id, cambios }: { id: string; cambios: ProductoEditable }) => {
      const { data, error } = await supabase.from('productos').update(cambios).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidar,
  });
}

export function useGuardarCategoria() {
  const { empresa } = useEmpresa();
  const invalidar = useInvalidarCatalogo();
  return useMutation({
    mutationFn: async (c: { id?: string; nombre: string; activa?: boolean }) => {
      if (c.id) {
        const cambios: TablesUpdate<'categorias'> = { nombre: c.nombre };
        if (c.activa !== undefined) cambios.activa = c.activa;
        const { error } = await supabase.from('categorias').update(cambios).eq('id', c.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('categorias').insert({ empresa_id: empresa.id, nombre: c.nombre });
        if (error) throw error;
      }
    },
    onSuccess: invalidar,
  });
}

export const atributosComoObjeto = (a: Json): Record<string, string> =>
  a && typeof a === 'object' && !Array.isArray(a)
    ? Object.fromEntries(Object.entries(a).map(([k, v]) => [k, v == null ? '' : String(v)]))
    : {};
