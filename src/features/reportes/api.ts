import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useEmpresa } from '@/auth/AuthProvider';

export interface Rango {
  desde: string;
  hasta: string;
}

function useReporte<T>(nombre: string, rango: Rango, fn: (empresaId: string) => PromiseLike<{ data: T | null; error: unknown }>) {
  const { empresa } = useEmpresa();
  return useQuery({
    // Prefijo 'ventas' para que se invalide al registrar/anular ventas
    queryKey: ['ventas', empresa.id, 'reporte', nombre, rango.desde, rango.hasta],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await fn(empresa.id);
      if (error) throw error;
      return data as T;
    },
  });
}

const args = (empresaId: string, r: Rango) => ({ p_empresa: empresaId, p_desde: r.desde, p_hasta: r.hasta });

export function useResumenVentas(r: Rango) {
  return useReporte('resumen', r, (e) =>
    supabase.rpc('reporte_ventas_resumen', args(e, r)).then(({ data, error }) => ({ data: data?.[0] ?? null, error })),
  );
}

export const usePorDia = (r: Rango) => useReporte('dia', r, (e) => supabase.rpc('reporte_ventas_por_dia', args(e, r)));
export const usePorMedio = (r: Rango) => useReporte('medio', r, (e) => supabase.rpc('reporte_ventas_por_medio', args(e, r)));
export const usePorProducto = (r: Rango) => useReporte('producto', r, (e) => supabase.rpc('reporte_ventas_por_producto', args(e, r)));
export const usePorUsuario = (r: Rango) => useReporte('usuario', r, (e) => supabase.rpc('reporte_ventas_por_usuario', args(e, r)));

export function useComprasPorProveedor(r: Rango) {
  const { empresa } = useEmpresa();
  return useQuery({
    queryKey: ['compras', empresa.id, 'reporte', r.desde, r.hasta],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('reporte_compras_por_proveedor', args(empresa.id, r));
      if (error) throw error;
      return data;
    },
  });
}

export function useReposicion(dias: number) {
  const { empresa } = useEmpresa();
  return useQuery({
    queryKey: ['productos', empresa.id, 'reposicion', dias],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('reporte_reposicion', { p_empresa: empresa.id, p_dias: dias });
      if (error) throw error;
      return data;
    },
  });
}
