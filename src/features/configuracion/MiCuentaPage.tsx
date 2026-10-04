import { useEffect, useState, type FormEvent } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/auth/AuthProvider';
import { ROL_LABEL } from '@/auth/permisos';
import { supabase } from '@/lib/supabase';
import { mensajeError } from '@/lib/format';
import { PageHeader } from '@/app/components/comun/PageHeader';
import { Campo } from '@/app/components/comun/Campo';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Debe incluir una mayúscula')
      .regex(/[0-9]/, 'Debe incluir un número'),
    confirmar: z.string(),
  })
  .refine((d) => d.password === d.confirmar, { message: 'Las contraseñas no coinciden', path: ['confirmar'] });

/** Datos propios del usuario logueado. Disponible para todos los roles. */
export default function MiCuentaPage() {
  const { perfil, membresias, recargar } = useAuth();
  const [nombre, setNombre] = useState('');
  const [errNombre, setErrNombre] = useState<string>();
  const [guardandoNombre, setGuardandoNombre] = useState(false);

  const [pw, setPw] = useState({ password: '', confirmar: '' });
  const [errPw, setErrPw] = useState<{ password?: string; confirmar?: string }>({});
  const [guardandoPw, setGuardandoPw] = useState(false);

  useEffect(() => setNombre(perfil?.nombre ?? ''), [perfil]);

  const guardarNombre = async (e: FormEvent) => {
    e.preventDefault();
    if (!perfil) return;
    const limpio = nombre.trim();
    if (limpio.length < 2) return setErrNombre('Ingresá tu nombre');
    setErrNombre(undefined);
    setGuardandoNombre(true);
    const { error } = await supabase.from('perfiles').update({ nombre: limpio }).eq('id', perfil.id);
    setGuardandoNombre(false);
    if (error) return toast.error(mensajeError(error));
    toast.success('Nombre actualizado');
    await recargar();
  };

  const cambiarPassword = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = passwordSchema.safeParse(pw);
    if (!parsed.success) {
      const f = parsed.error.flatten().fieldErrors;
      return setErrPw({ password: f.password?.[0], confirmar: f.confirmar?.[0] });
    }
    setErrPw({});
    setGuardandoPw(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    setGuardandoPw(false);
    if (error) return toast.error(mensajeError(error));
    setPw({ password: '', confirmar: '' });
    toast.success('Contraseña cambiada');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader titulo="Mi cuenta" descripcion="Tus datos y tu contraseña" />

      <Card className="p-6">
        <form onSubmit={guardarNombre} className="space-y-4" noValidate>
          <h3 className="font-medium">Datos personales</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="mc-nombre" label="Nombre" requerido error={errNombre}>
              <Input id="mc-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={80} />
            </Campo>
            <Campo id="mc-email" label="Email" ayuda="Para cambiarlo, pedíselo a un administrador">
              <Input id="mc-email" value={perfil?.email ?? ''} readOnly disabled />
            </Campo>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={guardandoNombre || nombre.trim() === (perfil?.nombre ?? '')}>
              {guardandoNombre ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <form onSubmit={cambiarPassword} className="space-y-4" noValidate>
          <h3 className="font-medium">Cambiar contraseña</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="mc-pw" label="Nueva contraseña" error={errPw.password} ayuda="8 caracteres, una mayúscula y un número">
              <Input
                id="mc-pw"
                type="password"
                autoComplete="new-password"
                value={pw.password}
                onChange={(e) => setPw((p) => ({ ...p, password: e.target.value }))}
              />
            </Campo>
            <Campo id="mc-pw2" label="Repetir contraseña" error={errPw.confirmar}>
              <Input
                id="mc-pw2"
                type="password"
                autoComplete="new-password"
                value={pw.confirmar}
                onChange={(e) => setPw((p) => ({ ...p, confirmar: e.target.value }))}
              />
            </Campo>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={guardandoPw || !pw.password}>
              {guardandoPw ? 'Cambiando…' : 'Cambiar contraseña'}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6 gap-2">
        <h3 className="font-medium">Mis empresas</h3>
        <ul className="divide-y">
          {membresias.map((m) => (
            <li key={m.empresa.id} className="flex items-center justify-between py-2 text-sm">
              <span>{m.empresa.nombre}</span>
              <Badge variant="secondary">{ROL_LABEL[m.rol]}</Badge>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
