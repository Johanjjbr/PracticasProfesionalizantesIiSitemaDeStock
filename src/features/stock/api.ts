import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useEmpresa } from '@/auth/AuthProvider';
import type { Json } from '@/lib/database.types';
import type { MotivoAjuste, TipoMovimiento } from './etiquetas';

export const stockKeys = {
  ajustes: (empresaId: string) => ['ajustes', empresaId] as const,
  movimientos: (empresaId: string) => ['movimientos', empresaId] as const,
};

// ---------------------------------------------------------------------------
// Ajustes
// ---------------------------------------------------------------------------

export interface ItemAjusteInput {
  producto_id: string;
  modo: 'diferencia' | 'conteo';
  cantidad: number;
}

export function useRegistrarAjuste() {
  const { empresa } = useEmpresa();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: { motivo: MotivoAjuste; items: ItemAjusteInput[]; observaciones: string }) => {
      const { data, error } = await supabase.rpc('registrar_ajuste', {
        p_empresa: empresa.id,
        p_motivo: a.motivo,
        p_items: a.items as unknown as Json,
        p_observaciones: a.observaciones.trim() || undefined,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['productos', empresa.id] });
      void qc.invalidateQueries({ queryKey: stockKeys.ajustes(empresa.id) });
      void qc.invalidateQueries({ queryKey: stockKeys.movimientos(empresa.id) });
    },
  });
}

export function useAjustes(limite = 50) {
  const { empresa } = useEmpresa();
  return useQuery({
    queryKey: [...stockKeys.ajustes(empresa.id), limite],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ajustes')
        .select(
          '*, usuario:perfiles(nombre, email), items:ajuste_items(*, producto:productos(codigo, nombre, unidad_codigo))',
        )
        .eq('empresa_id', empresa.id)
        .order('fecha', { ascending: false })
        .limit(limite);
      if (error) throw error;
      return data;
    },
  });
}

export type AjusteConDetalle = NonNullable<ReturnType<typeof useAjustes>['data']>[number];

// ---------------------------------------------------------------------------
// Movimientos
// ---------------------------------------------------------------------------

export interface FiltrosMovimientos {
  desde: string; // yyyy-mm-dd ('' = sin límite)
  hasta: string;
  tipo: TipoMovimiento | '';
  productoId: string;
}

export const MOV_POR_PAGINA = 50;
const SELECT_MOV = '*, producto:productos(codigo, nombre, unidad_codigo), usuario:perfiles(nombre, email)';

/** Día calendario de Buenos Aires (UTC-3, sin horario de verano) → límites ISO. */
const inicioDia = (d: string) => `${d}T00:00:00-03:00`;
const finDia = (d: string) => `${d}T23:59:59.999-03:00`;

function consultaMovimientos(empresaId: string, f: FiltrosMovimientos, conteo: boolean) {
  let q = supabase
    .from('movimientos_stock')
    .select(SELECT_MOV, conteo ? { count: 'exact' } : undefined)
    .eq('empresa_id', empresaId);
  if (f.desde) q = q.gte('fecha', inicioDia(f.desde));
  if (f.hasta) q = q.lte('fecha', finDia(f.hasta));
  if (f.tipo) q = q.eq('tipo', f.tipo);
  if (f.productoId) q = q.eq('producto_id', f.productoId);
  return q.order('fecha', { ascending: false }).order('created_at', { ascending: false });
}

export function useMovimientos(filtros: FiltrosMovimientos, pagina: number) {
  const { empresa } = useEmpresa();
  return useQuery({
    queryKey: [...stockKeys.movimientos(empresa.id), filtros, pagina],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const desde = pagina * MOV_POR_PAGINA;
      const { data, error, count } = await consultaMovimientos(empresa.id, filtros, true).range(
        desde,
        desde + MOV_POR_PAGINA - 1,
      );
      if (error) throw error;
      return { filas: data, total: count ?? 0 };
    },
  });
}

export type MovimientoConDetalle = NonNullable<ReturnType<typeof useMovimientos>['data']>['filas'][number];

/** Para exportar: trae hasta `max` movimientos con los filtros actuales. */
export async function traerMovimientosParaExportar(empresaId: string, filtros: FiltrosMovimientos, max = 5000) {
  const { data, error } = await consultaMovimientos(empresaId, filtros, false).range(0, max - 1);
  if (error) throw error;
  return data;
}
