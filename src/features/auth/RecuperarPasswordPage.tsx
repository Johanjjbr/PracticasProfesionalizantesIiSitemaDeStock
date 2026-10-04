import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { mensajeError } from '@/lib/format';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { AuthCard, MensajeError } from './AuthCard';

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const parsed = z.string().trim().email().safeParse(email);
    if (!parsed.success) {
      setError('Ingresá un email válido');
      return;
    }
    setEnviando(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/nueva-password`,
    });
    setEnviando(false);
    if (err) setError(mensajeError(err));
    else setEnviado(true);
  };

  return (
    <AuthCard titulo="Recuperar contraseña" subtitulo="Te enviamos un link para crear una nueva">
      {enviado ? (
        <p className="text-sm text-center">
          Si <strong>{email}</strong> está registrado, vas a recibir un email con las instrucciones.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {error && <MensajeError texto={error} />}
          <Button type="submit" className="w-full" disabled={enviando}>
            {enviando ? 'Enviando…' : 'Enviar link'}
          </Button>
        </form>
      )}
      <div className="mt-6 text-center">
        <Link to="/login" className="text-sm text-primary hover:underline">
          Volver al inicio de sesión
        </Link>
      </div>
    </AuthCard>
  );
}
