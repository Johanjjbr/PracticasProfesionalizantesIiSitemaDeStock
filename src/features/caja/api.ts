import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth, useEmpresa } from '@/auth/AuthProvider';
import type { Enums, Tables } from '@/lib/database.types';

export type MedioPago = Enums<'medio_pago'>;
export type TipoMovCaja = Enums<'tipo_mov_caja'>;
export type OrigenMovCaja = Enums<'origen_mov_caja'>;
export type MovimientoCaja = Tables<'caja_movimientos'>;

export const MEDIO_PAGO_LABEL: Record<MedioPago, string> = {
  efectivo: 'Efectivo',
  debito: 'Débito',
  credito: 'Crédito',
  transferencia: 'Transferencia',
  billetera: 'Billetera / QR',
  otro: 'Otro',
};

export const ORIGEN_LABEL: Record<OrigenMovCaja, string> = {
  venta: 'Venta',
  compra: 'Compra',
  manual: 'Manual',
  anulacion_venta: 'Anulación de venta',
  anulacion_compra: 'Anulación de compra',
};

export const cajaKeys = {
  todo: (empresaId: string) => ['caja', empresaId] as const,
};

const SELECT_SESION =
  '*, usuario:perfiles!caja_sesiones_usuario_id_fkey(nombre, email), cerrador:perfiles!caja_sesiones_cerrada_por_fkey(nombre, email), movimientos:caja_movimientos(*)';

/** Caja abierta del usuario actual (null si no tiene). */
export function useMiCaja() {
  const { empresa } = useEmpresa();
  const { session } = useAuth();
  const uid = session?.user.id;
  return useQuery({
    queryKey: [...cajaKeys.todo(empresa.id), 'mia', uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('caja_sesiones')
        .select(SELECT_SESION)
        .eq('empresa_id', empresa.id)
        .eq('usuario_id', uid!)
        .eq('estado', 'abierta')
        .maybeSingle();
      if (error) throw error;
      return data ? ordenarMovimientos(data) : null;
    },
  });
}

/** Movimientos más recientes primero. */
function ordenarMovimientos<T extends { movimientos: { fecha: string }[] }>(s: T): T {
  return { ...s, movimientos: [...s.movimientos].sort((a, b) => b.fecha.localeCompare(a.fecha)) };
}

export type SesionCaja = NonNullable<ReturnType<typeof useMiCaja>['data']>;

export function useCajaDetalle(id: string | null) {
  const { empresa } = useEmpresa();
  return useQuery({
    queryKey: [...cajaKeys.todo(empresa.id), 'detalle', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('caja_sesiones')
        .select(SELECT_SESION)
        .eq('id', id!)
        .single();
      if (error) throw error;
      return ordenarMovimientos(data);
    },
  });
}

export const CAJAS_POR_PAGINA = 20;

/** Historial de sesiones (el vendedor solo ve las suyas por RLS). */
export function useHistorialCajas(pagina: number, soloAbiertas = false) {
  const { empresa } = useEmpresa();
  return useQuery({
    queryKey: [...cajaKeys.todo(empresa.id), 'historial', pagina, soloAbiertas],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let q = supabase
        .from('caja_sesiones')
        .select(
          '*, usuario:perfiles!caja_sesiones_usuario_id_fkey(nombre, email), cerrador:perfiles!caja_sesiones_cerrada_por_fkey(nombre, email)',
          { count: 'exact' },
        )
        .eq('empresa_id', empresa.id);
      if (soloAbiertas) q = q.eq('estado', 'abierta');
      const desde = pagina * CAJAS_POR_PAGINA;
      const { data, error, count } = await q
        .order('apertura_at', { ascending: false })
        .range(desde, desde + CAJAS_POR_PAGINA - 1);
      if (error) throw error;
      return { filas: data, total: count ?? 0 };
    },
  });
}

export type SesionListado = NonNullable<ReturnType<typeof useHistorialCajas>['data']>['filas'][number];

function useInvalidarCaja() {
  const { empresa } = useEmpresa();
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: cajaKeys.todo(empresa.id) });
}

export function useAbrirCaja() {
  const { empresa } = useEmpresa();
  const invalidar = useInvalidarCaja();
  return useMutation({
    mutationFn: async ({ monto, observaciones }: { monto: number; observaciones: string }) => {
      const { data, error } = await supabase.rpc('abrir_caja', {
        p_empresa: empresa.id,
        p_monto_inicial: monto,
        p_observaciones: observaciones.trim() || undefined,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: invalidar,
  });
}

export function useMovimientoManual() {
  const invalidar = useInvalidarCaja();
  return useMutation({
    mutationFn: async (m: { sesionId: string; tipo: TipoMovCaja; monto: number; concepto: string; medio: MedioPago }) => {
      const { data, error } = await supabase.rpc('movimiento_caja_manual', {
        p_sesion: m.sesionId,
        p_tipo: m.tipo,
        p_monto: m.monto,
        p_concepto: m.concepto,
        p_medio: m.medio,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: invalidar,
  });
}

export function useCerrarCaja() {
  const invalidar = useInvalidarCaja();
  return useMutation({
    mutationFn: async (c: { sesionId: string; contado: number; observaciones: string }) => {
      const { data, error } = await supabase.rpc('cerrar_caja', {
        p_sesion: c.sesionId,
        p_efectivo_contado: c.contado,
        p_observaciones: c.observaciones.trim() || undefined,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: invalidar,
  });
}

// ---------------------------------------------------------------------------
// Cálculos (mismo criterio que private.efectivo_en_caja en la BD)
// ---------------------------------------------------------------------------

export interface ResumenCaja {
  porMedio: { medio: MedioPago; ingresos: number; egresos: number; neto: number }[];
  ingresosEfectivo: number;
  egresosEfectivo: number;
  efectivoEsperado: number;
  totalIngresos: number;
  totalEgresos: number;
}

export function resumirCaja(montoInicial: number, movimientos: Pick<MovimientoCaja, 'tipo' | 'medio_pago' | 'monto'>[]): ResumenCaja {
  const mapa = new Map<MedioPago, { ingresos: number; egresos: number }>();
  for (const m of movimientos) {
    const r = mapa.get(m.medio_pago) ?? { ingresos: 0, egresos: 0 };
    if (m.tipo === 'ingreso') r.ingresos += Number(m.monto);
    else r.egresos += Number(m.monto);
    mapa.set(m.medio_pago, r);
  }
  const orden = Object.keys(MEDIO_PAGO_LABEL) as MedioPago[];
  const porMedio = orden
    .filter((m) => mapa.has(m))
    .map((medio) => {
      const r = mapa.get(medio)!;
      return { medio, ...r, neto: r.ingresos - r.egresos };
    });
  const ef = mapa.get('efectivo') ?? { ingresos: 0, egresos: 0 };
  const redondear = (n: number) => Math.round(n * 100) / 100;
  return {
    porMedio,
    ingresosEfectivo: redondear(ef.ingresos),
    egresosEfectivo: redondear(ef.egresos),
    efectivoEsperado: redondear(Number(montoInicial) + ef.ingresos - ef.egresos),
    totalIngresos: redondear(porMedio.reduce((s, r) => s + r.ingresos, 0)),
    totalEgresos: redondear(porMedio.reduce((s, r) => s + r.egresos, 0)),
  };
}
