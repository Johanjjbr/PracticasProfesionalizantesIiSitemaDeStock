import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useEmpresa } from '@/auth/AuthProvider';
import type { Rol } from '@/auth/permisos';

export const usuariosKeys = {
  miembros: (empresaId: string) => ['miembros', empresaId] as const,
};

export function useMiembros() {
  const { empresa } = useEmpresa();
  return useQuery({
    queryKey: usuariosKeys.miembros(empresa.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empresa_usuarios')
        .select('*, perfil:perfiles(id, nombre, email)')
        .eq('empresa_id', empresa.id)
        .order('created_at');
      if (error) throw error;
      return data;
    },
  });
}

export type Miembro = NonNullable<ReturnType<typeof useMiembros>['data']>[number];

function useInvalidarMiembros() {
  const { empresa } = useEmpresa();
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: usuariosKeys.miembros(empresa.id) });
}

export function useActualizarMiembro() {
  const { empresa } = useEmpresa();
  const invalidar = useInvalidarMiembros();
  return useMutation({
    mutationFn: async ({ usuarioId, cambios }: { usuarioId: string; cambios: { rol?: Rol; activo?: boolean } }) => {
      const { error, count } = await supabase
        .from('empresa_usuarios')
        .update(cambios, { count: 'exact' })
        .eq('empresa_id', empresa.id)
        .eq('usuario_id', usuarioId);
      if (error) throw error;
      if (count === 0) throw new Error('No tenés permisos para modificar este usuario.');
    },
    onSuccess: invalidar,
  });
}

export function useQuitarMiembro() {
  const { empresa } = useEmpresa();
  const invalidar = useInvalidarMiembros();
  return useMutation({
    mutationFn: async (usuarioId: string) => {
      const { error, count } = await supabase
        .from('empresa_usuarios')
        .delete({ count: 'exact' })
        .eq('empresa_id', empresa.id)
        .eq('usuario_id', usuarioId);
      if (error) throw error;
      if (count === 0) throw new Error('No se pudo quitar el usuario (no podés quitarte a vos mismo).');
    },
    onSuccess: invalidar,
  });
}

export interface AltaUsuario {
  email: string;
  nombre: string;
  rol: Rol;
  modo: 'invitar' | 'password';
  password?: string;
}

export interface ResultadoAlta {
  accion: 'invitado' | 'creado' | 'agregado';
  usuario_id: string;
}

export function useAgregarUsuario() {
  const { empresa } = useEmpresa();
  const invalidar = useInvalidarMiembros();
  return useMutation({
    mutationFn: async (a: AltaUsuario): Promise<ResultadoAlta> => {
      const { data, error } = await supabase.functions.invoke<ResultadoAlta>('invitar-usuario', {
        body: { ...a, empresa_id: empresa.id, redirect_to: `${window.location.origin}/nueva-password` },
      });
      if (error) {
        // El mensaje útil viene en el cuerpo de la respuesta de la función
        if (error instanceof FunctionsHttpError) {
          const cuerpo = await error.context.json().catch(() => null);
          throw new Error(cuerpo?.error ?? 'No se pudo agregar el usuario');
        }
        throw error;
      }
      return data!;
    },
    onSuccess: invalidar,
  });
}

/** Contraseña temporal legible: 3 sílabas + 2 dígitos + mayúscula inicial. */
export function generarPasswordTemporal(): string {
  const cons = 'bcdfghjklmnprstvz';
  const voc = 'aeiou';
  const r = (s: string) => s[crypto.getRandomValues(new Uint32Array(1))[0] % s.length];
  let p = '';
  for (let i = 0; i < 4; i++) p += r(cons) + r(voc);
  p += String(crypto.getRandomValues(new Uint32Array(1))[0] % 90 + 10);
  return p.charAt(0).toUpperCase() + p.slice(1);
}
