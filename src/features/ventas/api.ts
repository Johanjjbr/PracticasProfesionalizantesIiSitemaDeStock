import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useEmpresa } from '@/auth/AuthProvider';
import type { Enums, Json } from '@/lib/database.types';
import type { MedioPago } from '@/features/caja/api';

export type EstadoVenta = Enums<'estado_venta'>;

export const ventasKeys = {
  todas: (empresaId: string) => ['ventas', empresaId] as const,
};

export interface ItemVentaInput {
  producto_id: string;
  cantidad: number;
  precio_unitario?: number;
}

export interface PagoInput {
  medio: MedioPago;
  monto: number;
}

function useInvalidarTrasVenta() {
  const { empresa } = useEmpresa();
  const qc = useQueryClient();
  return () => {
    for (const k of ['ventas', 'productos', 'caja', 'movimientos']) void qc.invalidateQueries({ queryKey: [k, empresa.id] });
  };
}

export function useRegistrarVenta() {
  const { empresa } = useEmpresa();
  const invalidar = useInvalidarTrasVenta();
  return useMutation({
    mutationFn: async (v: { items: ItemVentaInput[]; pagos: PagoInput[]; descuento: number; cliente: string; observaciones?: string }) => {
      const { data, error } = await supabase.rpc('registrar_venta', {
        p_empresa: empresa.id,
        p_items: v.items as unknown as Json,
        p_pagos: v.pagos as unknown as Json,
        p_descuento: v.descuento,
        p_cliente: v.cliente.trim() || undefined,
        p_observaciones: v.observaciones?.trim() || undefined,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: invalidar,
  });
}

export function useAnularVenta() {
  const invalidar = useInvalidarTrasVenta();
  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
      const { data, error } = await supabase.rpc('anular_venta', { p_venta: id, p_motivo: motivo });
      if (error) throw error;
      return data;
    },
    onSuccess: invalidar,
  });
}

export interface FiltrosVentas {
  desde: string;
  hasta: string;
  estado: EstadoVenta | '';
}

export const VENTAS_POR_PAGINA = 50;

export function useVentas(f: FiltrosVentas, pagina: number) {
  const { empresa } = useEmpresa();
  return useQuery({
    queryKey: [...ventasKeys.todas(empresa.id), 'lista', f, pagina],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let q = supabase
        .from('ventas')
        .select(
          '*, usuario:perfiles!ventas_usuario_id_fkey(nombre, email), items:venta_items(count), pagos:venta_pagos(medio_pago, monto)',
          { count: 'exact' },
        )
        .eq('empresa_id', empresa.id);
      if (f.desde) q = q.gte('fecha', `${f.desde}T00:00:00-03:00`);
      if (f.hasta) q = q.lte('fecha', `${f.hasta}T23:59:59.999-03:00`);
      if (f.estado) q = q.eq('estado', f.estado);
      const desde = pagina * VENTAS_POR_PAGINA;
      const { data, error, count } = await q
        .order('fecha', { ascending: false })
        .range(desde, desde + VENTAS_POR_PAGINA - 1);
      if (error) throw error;
      return { filas: data, total: count ?? 0 };
    },
  });
}

export type VentaListado = NonNullable<ReturnType<typeof useVentas>['data']>['filas'][number];

export function useVenta(id: string | null) {
  const { empresa } = useEmpresa();
  return useQuery({
    queryKey: [...ventasKeys.todas(empresa.id), 'detalle', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ventas')
        .select(
          '*, usuario:perfiles!ventas_usuario_id_fkey(nombre, email), anulador:perfiles!ventas_anulada_por_fkey(nombre, email), items:venta_items(*, producto:productos(codigo, nombre, unidad_codigo)), pagos:venta_pagos(*)',
        )
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export type VentaDetalle = NonNullable<ReturnType<typeof useVenta>['data']>;
