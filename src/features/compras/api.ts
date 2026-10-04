import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useEmpresa } from '@/auth/AuthProvider';
import type { Enums, Json } from '@/lib/database.types';

export type EstadoCompra = Enums<'estado_compra'>;

export const comprasKeys = {
  todas: (empresaId: string) => ['compras', empresaId] as const,
};

export interface FiltrosCompras {
  proveedorId: string;
  estado: EstadoCompra | '';
  desde: string;
  hasta: string;
}

export const COMPRAS_POR_PAGINA = 25;

const SELECT_LISTA =
  '*, proveedor:proveedores(razon_social, nombre_fantasia), usuario:perfiles!compras_usuario_id_fkey(nombre, email), items:compra_items(count)';

function consultaCompras(empresaId: string, f: FiltrosCompras, conteo: boolean) {
  let q = supabase
    .from('compras')
    .select(SELECT_LISTA, conteo ? { count: 'exact' } : undefined)
    .eq('empresa_id', empresaId);
  if (f.proveedorId) q = q.eq('proveedor_id', f.proveedorId);
  if (f.estado) q = q.eq('estado', f.estado);
  if (f.desde) q = q.gte('fecha', `${f.desde}T00:00:00-03:00`);
  if (f.hasta) q = q.lte('fecha', `${f.hasta}T23:59:59.999-03:00`);
  return q.order('fecha', { ascending: false });
}

export function useCompras(filtros: FiltrosCompras, pagina: number) {
  const { empresa } = useEmpresa();
  return useQuery({
    queryKey: [...comprasKeys.todas(empresa.id), 'lista', filtros, pagina],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const desde = pagina * COMPRAS_POR_PAGINA;
      const { data, error, count } = await consultaCompras(empresa.id, filtros, true).range(
        desde,
        desde + COMPRAS_POR_PAGINA - 1,
      );
      if (error) throw error;
      return { filas: data, total: count ?? 0 };
    },
  });
}

export type CompraListado = NonNullable<ReturnType<typeof useCompras>['data']>['filas'][number];

export async function traerComprasParaExportar(empresaId: string, filtros: FiltrosCompras, max = 2000) {
  const { data, error } = await consultaCompras(empresaId, filtros, false).range(0, max - 1);
  if (error) throw error;
  return data;
}

export function useCompra(id: string | null) {
  const { empresa } = useEmpresa();
  return useQuery({
    queryKey: [...comprasKeys.todas(empresa.id), 'detalle', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compras')
        .select(
          '*, proveedor:proveedores(razon_social, nombre_fantasia, cuit), usuario:perfiles!compras_usuario_id_fkey(nombre, email), anulador:perfiles!compras_anulada_por_fkey(nombre, email), items:compra_items(*, producto:productos(codigo, nombre, unidad_codigo))',
        )
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export type CompraDetalle = NonNullable<ReturnType<typeof useCompra>['data']>;

function useInvalidarTrasCompra() {
  const { empresa } = useEmpresa();
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: comprasKeys.todas(empresa.id) });
    void qc.invalidateQueries({ queryKey: ['productos', empresa.id] });
    void qc.invalidateQueries({ queryKey: ['movimientos', empresa.id] });
    void qc.invalidateQueries({ queryKey: ['caja', empresa.id] });
  };
}

export interface ItemCompraInput {
  producto_id: string;
  cantidad: number;
  costo_unitario: number;
  lote?: string;
  vencimiento?: string;
}

export interface NuevaCompraInput {
  proveedorId: string;
  items: ItemCompraInput[];
  tipoComprobante: string;
  nroComprobante: string;
  fechaComprobante: string;
  observaciones: string;
  actualizarCostos: boolean;
  pagadaDesdeCaja: boolean;
}

export function useRegistrarCompra() {
  const { empresa } = useEmpresa();
  const qc = useQueryClient();
  const invalidar = useInvalidarTrasCompra();
  return useMutation({
    mutationFn: async (c: NuevaCompraInput) => {
      const { data, error } = await supabase.rpc('registrar_compra', {
        p_empresa: empresa.id,
        p_proveedor: c.proveedorId,
        p_items: c.items as unknown as Json,
        p_tipo_comprobante: c.tipoComprobante || undefined,
        p_nro_comprobante: c.nroComprobante.trim() || undefined,
        p_fecha_comprobante: c.fechaComprobante || undefined,
        p_observaciones: c.observaciones.trim() || undefined,
        p_actualizar_costos: c.actualizarCostos,
        p_pagada_desde_caja: c.pagadaDesdeCaja,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidar();
      void qc.invalidateQueries({ queryKey: ['caja', empresa.id] });
    },
  });
}

export function useAnularCompra() {
  const invalidar = useInvalidarTrasCompra();
  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
      const { data, error } = await supabase.rpc('anular_compra', { p_compra: id, p_motivo: motivo });
      if (error) throw error;
      return data;
    },
    onSuccess: invalidar,
  });
}

export const TIPOS_COMPROBANTE = ['Factura A', 'Factura B', 'Factura C', 'Remito', 'Ticket', 'Otro'] as const;
