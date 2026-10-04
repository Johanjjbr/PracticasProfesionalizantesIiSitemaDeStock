import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/auth/AuthProvider';
import { mensajeError } from '@/lib/format';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { AuthCard, MensajeError } from './AuthCard';

const schema = z.object({
  email: z.string().trim().email('Ingresá un email válido'),
  password: z.string().min(1, 'Ingresá tu contraseña'),
});

export default function LoginPage() {
  const { session, cargando, iniciarSesion } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const destino = (location.state as { desde?: string } | null)?.desde ?? '/';
  if (!cargando && session) return <Navigate to={destino} replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setEnviando(true);
    try {
      await iniciarSesion(parsed.data.email, parsed.data.password);
      toast.success('¡Bienvenido!');
      navigate(destino, { replace: true });
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <AuthCard titulo="Sistema de Stock" subtitulo="Ingresá con tu cuenta">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="usuario@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <MensajeError texto={error} />}
        <Button type="submit" className="w-full" disabled={enviando}>
          {enviando ? 'Ingresando…' : 'Ingresar'}
        </Button>
      </form>
      <div className="mt-6 pt-6 border-t border-border text-center">
        <Link to="/recuperar-password" className="text-sm text-primary hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
    </AuthCard>
  );
}
