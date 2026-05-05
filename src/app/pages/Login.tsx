import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { AlertCircle, Package } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Por favor complete todos los campos');
      setLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setError('Email inválido');
      setLoading(false);
      return;
    }

    try {
      const success = await login(email, password, role);
      if (success) {
        toast.success('Inicio de sesión exitoso');
        navigate('/dashboard');
      } else {
        setError('Credenciales inválidas');
      }
    } catch (err) {
      setError('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent">
      <Card className="w-full max-w-md p-8 shadow-xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mb-4">
            <Package className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl text-foreground">Sistema de Gestión de Stock</h1>
          <p className="text-sm text-muted-foreground mt-1">Control Industrial y Logística</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-input-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-input-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rol de Usuario (Testing)</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="role" className="bg-input-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="manager">Gerente</SelectItem>
                <SelectItem value="operator">Operador</SelectItem>
                <SelectItem value="receptionist">Recepcionista</SelectItem>
                <SelectItem value="viewer">Visualizador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-border space-y-3">
          <p className="text-xs text-center text-muted-foreground">
            Demo: Use cualquier email y contraseña válida
          </p>
          <div className="flex justify-center gap-4 text-xs">
            <button
              type="button"
              onClick={() => navigate('/create-password?mode=create')}
              className="text-primary hover:underline"
            >
              Crear nueva contraseña
            </button>
            <span className="text-muted-foreground">•</span>
            <button
              type="button"
              onClick={() => navigate('/create-password?mode=reset')}
              className="text-primary hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
