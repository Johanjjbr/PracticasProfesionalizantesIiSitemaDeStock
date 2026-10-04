import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import { mensajeError } from '@/lib/format';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { AuthCard, MensajeError } from './AuthCard';

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Debe incluir una mayúscula')
      .regex(/[0-9]/, 'Debe incluir un número'),
    confirmar: z.string(),
  })
  .refine((d) => d.password === d.confirmar, { message: 'Las contraseñas no coinciden', path: ['confirmar'] });

/** Destino del link de recuperación (y también sirve para cambiar la contraseña estando logueado). */
export default function NuevaPasswordPage() {
  const { session, cargando } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const parsed = schema.safeParse({ password, confirmar });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setEnviando(true);
    const { error: err } = await supabase.auth.updateUser({ password: parsed.data.password });
    setEnviando(false);
    if (err) {
      setError(mensajeError(err));
      return;
    }
    toast.success('Contraseña actualizada');
    navigate('/dashboard', { replace: true });
  };

  if (!cargando && !session) {
    return (
      <AuthCard titulo="Link inválido o vencido">
        <p className="text-sm text-center mb-4">Pedí un nuevo link de recuperación.</p>
        <div className="text-center">
          <Link to="/recuperar-password" className="text-sm text-primary hover:underline">
            Recuperar contraseña
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard titulo="Nueva contraseña" subtitulo="Mínimo 8 caracteres, una mayúscula y un número">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="password">Nueva contraseña</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmar">Repetir contraseña</Label>
          <Input
            id="confirmar"
            type="password"
            autoComplete="new-password"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
          />
        </div>
        {error && <MensajeError texto={error} />}
        <Button type="submit" className="w-full" disabled={enviando || cargando}>
          {enviando ? 'Guardando…' : 'Guardar contraseña'}
        </Button>
      </form>
    </AuthCard>
  );
}
