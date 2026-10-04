import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Database, Tables } from '@/lib/database.types';
import type { Rol } from '@/auth/permisos';

type Rubro = Database['public']['Enums']['rubro_empresa'];
export type Plan = Tables<'planes'>;
export type PagoSuscripcion = Tables<'pagos_suscripcion'>;
export type EmpresaPlataforma = Database['public']['Functions']['plataforma_empresas']['Returns'][number];

const k = {
  empresas: ['plataforma', 'empresas'] as const,
  planes: ['plataforma', 'planes'] as const,
  pagos: (empresaId: string) => ['plataforma', 'pagos', empresaId] as const,
};

function useInvalidar() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: ['plataforma'] });
}

export function useEmpresasPlataforma() {
  return useQuery({
    queryKey: k.empresas,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('plataforma_empresas');
      if (error) throw error;
      return data;
    },
  });
}

export function usePlanes() {
  return useQuery({
    queryKey: k.planes,
    queryFn: async () => {
      const { data, error } = await supabase.from('planes').select('*').order('precio_mensual');
      if (error) throw error;
      return data;
    },
  });
}

export interface PlanForm {
  nombre: string;
  descripcion: string | null;
  precio_mensual: number;
  max_usuarios: number | null;
  max_productos: number | null;
  activo: boolean;
}

export function useGuardarPlan() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: async ({ id, datos }: { id?: string; datos: PlanForm }) => {
      const { error } = id
        ? await supabase.from('planes').update({ ...datos, updated_at: new Date().toISOString() }).eq('id', id)
        : await supabase.from('planes').insert(datos);
      if (error) throw error;
    },
    onSuccess: invalidar,
  });
}

export interface NuevaEmpresa {
  nombre: string;
  rubro: Rubro;
  plan_id: string | null;
  pagado_hasta: string | null;
  dias_gracia: number;
  admin: { email: string; nombre: string; password: string };
}

export interface ResultadoNuevaEmpresa {
  empresaId: string;
  accion: 'creado' | 'agregado' | 'invitado' | null;
  errorAdmin?: string;
}

async function errorDeFuncion(error: unknown, porDefecto: string): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    const cuerpo = await error.context.json().catch(() => null);
    return cuerpo?.error ?? porDefecto;
  }
  return error instanceof Error ? error.message : porDefecto;
}

/** Crea la empresa y su usuario administrador (con contraseña temporal). */
export function useCrearEmpresa() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: async (n: NuevaEmpresa): Promise<ResultadoNuevaEmpresa> => {
      const { data: empresaId, error } = await supabase.rpc('plataforma_crear_empresa', {
        p_nombre: n.nombre,
        p_rubro: n.rubro,
        p_plan: n.plan_id ?? undefined,
        p_pagado_hasta: n.pagado_hasta ?? undefined,
        p_dias_gracia: n.dias_gracia,
      });
      if (error) throw error;
      const rol: Rol = 'admin';
      const { data, error: errFn } = await supabase.functions.invoke<{ accion: ResultadoNuevaEmpresa['accion'] }>(
        'invitar-usuario',
        {
          body: {
            empresa_id: empresaId,
            email: n.admin.email,
            nombre: n.admin.nombre,
            rol,
            modo: 'password',
            password: n.admin.password,
            redirect_to: `${window.location.origin}/nueva-password`,
          },
        },
      );
      // La empresa ya quedó creada: si falla el alta del admin se informa sin perderla
      if (errFn) return { empresaId, accion: null, errorAdmin: await errorDeFuncion(errFn, 'No se pudo crear el administrador') };
      return { empresaId, accion: data?.accion ?? null };
    },
    onSuccess: invalidar,
  });
}

export function useActualizarEmpresa() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: async (p: {
      id: string;
      nombre: string;
      rubro: Rubro;
      plan_id: string | null;
      pagado_hasta: string | null;
      dias_gracia: number;
    }) => {
      const { error } = await supabase.rpc('plataforma_actualizar_empresa', {
        p_empresa: p.id,
        p_nombre: p.nombre,
        p_rubro: p.rubro,
        // null explícito = sin plan / sin vencimiento
        p_plan: p.plan_id as string,
        p_pagado_hasta: p.pagado_hasta as string,
        p_dias_gracia: p.dias_gracia,
      });
      if (error) throw error;
    },
    onSuccess: invalidar,
  });
}

export function useSuspenderEmpresa() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: async (p: { id: string; suspender: boolean; motivo?: string }) => {
      const { error } = await supabase.rpc('plataforma_suspender_empresa', {
        p_empresa: p.id,
        p_suspender: p.suspender,
        p_motivo: p.motivo,
      });
      if (error) throw error;
    },
    onSuccess: invalidar,
  });
}

export function useActivarEmpresa() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: async (p: { id: string; activa: boolean }) => {
      const { error } = await supabase.rpc('plataforma_activar_empresa', { p_empresa: p.id, p_activa: p.activa });
      if (error) throw error;
    },
    onSuccess: invalidar,
  });
}

export function usePagos(empresaId: string | null) {
  return useQuery({
    queryKey: k.pagos(empresaId ?? ''),
    enabled: !!empresaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pagos_suscripcion')
        .select('*, plan:planes(nombre)')
        .eq('empresa_id', empresaId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useRegistrarPago() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: async (p: { empresaId: string; meses: number; monto: number; medio: string; fecha: string; nota: string }) => {
      const { data, error } = await supabase.rpc('registrar_pago_suscripcion', {
        p_empresa: p.empresaId,
        p_meses: p.meses,
        p_monto: p.monto,
        p_medio: p.medio,
        p_fecha: p.fecha,
        p_nota: p.nota || undefined,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: invalidar,
  });
}

export function useAnularPago() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: async (p: { id: string; motivo: string }) => {
      const { error } = await supabase.rpc('anular_pago_suscripcion', { p_pago: p.id, p_motivo: p.motivo });
      if (error) throw error;
    },
    onSuccess: invalidar,
  });
}

export const MEDIOS_COBRO = ['transferencia', 'efectivo', 'mercado pago', 'tarjeta', 'otro'];
