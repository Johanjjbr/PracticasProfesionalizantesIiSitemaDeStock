// Edge Function: invitar-usuario
// Da de alta un usuario en una empresa. Solo la puede usar un admin de esa empresa
// (o el superadmin). Usa la service_role key, que existe solo en el servidor.
//
// Body: {
//   empresa_id: string, email: string, nombre?: string,
//   rol: 'admin' | 'encargado' | 'vendedor' | 'consulta',
//   modo: 'invitar' | 'password', password?: string, redirect_to?: string
// }
// Respuesta: { accion: 'invitado' | 'creado' | 'agregado', usuario_id }
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const ROLES = ['admin', 'encargado', 'vendedor', 'consulta'];
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const responder = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return responder({ error: 'Método no permitido' }, 405);

  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization') ?? '';

    // 1) Quién llama
    const comoUsuario = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: auth } = await comoUsuario.auth.getUser();
    if (!auth.user) return responder({ error: 'No autenticado' }, 401);

    // 2) Validar entrada
    const body = await req.json().catch(() => null);
    const empresaId = String(body?.empresa_id ?? '');
    const email = String(body?.email ?? '').trim().toLowerCase();
    const nombre = String(body?.nombre ?? '').trim();
    const rol = String(body?.rol ?? '');
    const modo = body?.modo === 'password' ? 'password' : 'invitar';
    const password = String(body?.password ?? '');
    const redirectTo = typeof body?.redirect_to === 'string' ? body.redirect_to : undefined;

    if (!/^[0-9a-f-]{36}$/i.test(empresaId)) return responder({ error: 'Empresa inválida' }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return responder({ error: 'Email inválido' }, 400);
    if (!ROLES.includes(rol)) return responder({ error: 'Rol inválido' }, 400);
    if (modo === 'password' && (password.length < 8 || !/[A-Z]/.test(password) || !/\d/.test(password))) {
      return responder({ error: 'La contraseña debe tener 8 caracteres, una mayúscula y un número' }, 400);
    }

    // 3) Permiso: admin activo de la empresa o superadmin
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const [{ data: perfilLlamador }, { data: membresia }, { data: empresa }] = await Promise.all([
      admin.from('perfiles').select('superadmin').eq('id', auth.user.id).maybeSingle(),
      admin.from('empresa_usuarios').select('rol, activo').eq('empresa_id', empresaId).eq('usuario_id', auth.user.id).maybeSingle(),
      admin.from('empresas').select('id, activa').eq('id', empresaId).maybeSingle(),
    ]);
    if (!empresa?.activa) return responder({ error: 'Empresa inexistente o inactiva' }, 404);
    const esAdmin = membresia?.activo && membresia.rol === 'admin';
    if (!perfilLlamador?.superadmin && !esAdmin) return responder({ error: 'Solo un administrador puede agregar usuarios' }, 403);

    // 4) ¿Ya existe el usuario?
    const { data: existente } = await admin.from('perfiles').select('id').eq('email', email).maybeSingle();
    let usuarioId: string;
    let accion: 'invitado' | 'creado' | 'agregado';

    if (existente) {
      usuarioId = existente.id;
      accion = 'agregado';
    } else if (modo === 'password') {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: nombre ? { nombre } : {},
      });
      if (error || !data.user) return responder({ error: error?.message ?? 'No se pudo crear el usuario' }, 400);
      usuarioId = data.user.id;
      accion = 'creado';
    } else {
      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
        data: nombre ? { nombre } : {},
        redirectTo,
      });
      if (error || !data.user) return responder({ error: error?.message ?? 'No se pudo enviar la invitación' }, 400);
      usuarioId = data.user.id;
      accion = 'invitado';
    }

    // El perfil lo crea el trigger de auth.users; por las dudas se asegura
    await admin.from('perfiles').upsert({ id: usuarioId, email, ...(nombre ? { nombre } : {}) }, { onConflict: 'id', ignoreDuplicates: true });

    const { error: errMembresia } = await admin
      .from('empresa_usuarios')
      .upsert({ empresa_id: empresaId, usuario_id: usuarioId, rol, activo: true }, { onConflict: 'empresa_id,usuario_id' });
    if (errMembresia) return responder({ error: errMembresia.message }, 400);

    return responder({ accion, usuario_id: usuarioId });
  } catch (e) {
    return responder({ error: e instanceof Error ? e.message : 'Error inesperado' }, 500);
  }
});
