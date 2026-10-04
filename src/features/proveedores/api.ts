import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useEmpresa } from '@/auth/AuthProvider';
import type { Tables, TablesUpdate } from '@/lib/database.types';

export type Proveedor = Tables<'proveedores'>;

/** Columnas editables (coinciden con los GRANT de la migración 0002). */
export type ProveedorEditable = Pick<
  TablesUpdate<'proveedores'>,
  | 'razon_social'
  | 'nombre_fantasia'
  | 'cuit'
  | 'condicion_iva'
  | 'contacto'
  | 'telefono'
  | 'email'
  | 'direccion'
  | 'ciudad'
  | 'condicion_pago'
  | 'alias_cbu'
  | 'observaciones'
  | 'activo'
>;

export const proveedoresKeys = {
  todos: (empresaId: string) => ['proveedores', empresaId] as const,
};

export function useProveedores() {
  const { empresa } = useEmpresa();
  return useQuery({
    queryKey: proveedoresKeys.todos(empresa.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proveedores')
        .select('*')
        .eq('empresa_id', empresa.id)
        .order('razon_social');
      if (error) throw error;
      return data;
    },
  });
}

export function useGuardarProveedor() {
  const { empresa } = useEmpresa();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, datos }: { id?: string; datos: ProveedorEditable & { razon_social: string } }) => {
      if (id) {
        const { data, error } = await supabase.from('proveedores').update(datos).eq('id', id).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from('proveedores')
        .insert({ ...datos, empresa_id: empresa.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: proveedoresKeys.todos(empresa.id) }),
  });
}
