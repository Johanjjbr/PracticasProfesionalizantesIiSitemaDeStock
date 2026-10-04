import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { Loader2, ShieldAlert, Store } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { puedeVer } from './permisos';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';

function PantallaCarga() {
  return (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground gap-2">
      <Loader2 className="w-5 h-5 animate-spin" /> Cargando…
    </div>
  );
}

function SinEmpresa() {
  const { perfil, cerrarSesion, recargar } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md p-8 text-center space-y-4">
        <Store className="w-10 h-10 mx-auto text-muted-foreground" />
        <h1 className="text-xl">Tu usuario no tiene una empresa asignada</h1>
        <p className="text-sm text-muted-foreground">
          Ingresaste como <strong>{perfil?.email}</strong>. Pedile al administrador de tu empresa que te agregue
          desde <em>Sistema → Usuarios</em>.
        </p>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={() => void recargar()}>
            Reintentar
          </Button>
          <Button variant="ghost" onClick={() => void cerrarSesion()}>
            Cerrar sesión
          </Button>
        </div>
      </Card>
    </div>
  );
}

/** Exige sesión iniciada y una empresa activa. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { cargando, session, empresa } = useAuth();
  const location = useLocation();

  if (cargando) return <PantallaCarga />;
  if (!session) return <Navigate to="/login" replace state={{ desde: location.pathname }} />;
  if (!empresa) return <SinEmpresa />;
  return <>{children}</>;
}

/** Exige que el rol del usuario en la empresa activa pueda ver la ruta. */
export function RequireRol({ ruta, children }: { ruta: string; children: ReactNode }) {
  const { rol } = useAuth();
  if (!puedeVer(ruta, rol)) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3 text-muted-foreground">
        <ShieldAlert className="w-10 h-10" />
        <p>No tenés permisos para ver esta sección.</p>
      </div>
    );
  }
  return <>{children}</>;
}
