import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import type { Tables } from '@/lib/database.types';
import type { Rol } from './permisos';
import { suscripcionDe, type Suscripcion } from '@/lib/suscripcion';

export type Empresa = Tables<'empresas'>;
export type Perfil = Tables<'perfiles'>;

export interface Membresia {
  empresa: Empresa;
  rol: Rol;
}

interface AuthContextValue {
  /** true mientras se resuelve la sesión inicial o se cargan las membresías */
  cargando: boolean;
  session: Session | null;
  perfil: Perfil | null;
  membresias: Membresia[];
  empresa: Empresa | null;
  /** Rol efectivo: si la suscripción venció, todos pasan a 'consulta' (solo lectura). */
  rol: Rol | null;
  /** Rol asignado en la empresa, sin el ajuste por suscripción. */
  rolReal: Rol | null;
  suscripcion: Suscripcion | null;
  soloLectura: boolean;
  seleccionarEmpresa: (empresaId: string) => void;
  iniciarSesion: (email: string, password: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  recargar: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_EMPRESA = 'stock.empresaActiva';

function leerEmpresaGuardada(): string | null {
  try {
    return localStorage.getItem(STORAGE_EMPRESA);
  } catch {
    return null;
  }
}

function guardarEmpresa(id: string | null) {
  try {
    if (id) localStorage.setItem(STORAGE_EMPRESA, id);
    else localStorage.removeItem(STORAGE_EMPRESA);
  } catch {
    /* almacenamiento no disponible */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLista, setSessionLista] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(false);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [membresias, setMembresias] = useState<Membresia[]>([]);
  const [empresaId, setEmpresaId] = useState<string | null>(leerEmpresaGuardada());

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionLista(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, nueva) => {
      setSession(nueva);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id ?? null;

  const cargarDatos = useCallback(async () => {
    if (!userId) {
      setPerfil(null);
      setMembresias([]);
      return;
    }
    setCargandoDatos(true);
    try {
      const [{ data: perfilData }, { data: eus }] = await Promise.all([
        supabase.from('perfiles').select('*').eq('id', userId).maybeSingle(),
        supabase
          .from('empresa_usuarios')
          .select('rol, empresa:empresas(*)')
          .eq('usuario_id', userId)
          .eq('activo', true),
      ]);
      setPerfil(perfilData ?? null);

      let lista: Membresia[] = (eus ?? [])
        .filter((m) => m.empresa && m.empresa.activa)
        .map((m) => ({ empresa: m.empresa as Empresa, rol: m.rol }));

      // El superadmin puede entrar a cualquier empresa como administrador.
      if (perfilData?.superadmin) {
        const { data: todas } = await supabase.from('empresas').select('*').order('nombre');
        const propias = new Set(lista.map((m) => m.empresa.id));
        lista = [
          ...lista,
          ...(todas ?? []).filter((e) => e.activa && !propias.has(e.id)).map((e) => ({ empresa: e, rol: 'admin' as Rol })),
        ];
      }
      lista.sort((a, b) => a.empresa.nombre.localeCompare(b.empresa.nombre));
      setMembresias(lista);
    } finally {
      setCargandoDatos(false);
    }
  }, [userId]);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  // Si la empresa guardada ya no es accesible, tomar la primera disponible.
  const activa = useMemo(() => {
    return membresias.find((m) => m.empresa.id === empresaId) ?? membresias[0] ?? null;
  }, [membresias, empresaId]);

  const seleccionarEmpresa = useCallback((id: string) => {
    setEmpresaId(id);
    guardarEmpresa(id);
    queryClient.clear(); // nada de datos de otra empresa en caché
  }, []);

  const iniciarSesion = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const cerrarSesion = useCallback(async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    setMembresias([]);
    setPerfil(null);
  }, []);

  const suscripcion = useMemo(() => (activa ? suscripcionDe(activa.empresa) : null), [activa]);
  const esSuperadmin = !!perfil?.superadmin;
  const soloLectura = !esSuperadmin && suscripcion?.estado === 'vencida';

  const value: AuthContextValue = {
    cargando: !sessionLista || cargandoDatos,
    session,
    perfil,
    membresias,
    empresa: activa?.empresa ?? null,
    rol: activa ? (soloLectura ? 'consulta' : activa.rol) : null,
    rolReal: activa?.rol ?? null,
    suscripcion,
    soloLectura,
    seleccionarEmpresa,
    iniciarSesion,
    cerrarSesion,
    recargar: cargarDatos,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

/** Empresa activa garantizada (usar solo dentro de rutas protegidas). */
export function useEmpresa() {
  const { empresa, rol } = useAuth();
  if (!empresa || !rol) throw new Error('No hay empresa activa');
  return { empresa, rol };
}
