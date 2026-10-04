import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { Ban, Loader2, ShieldAlert, Store } from 'lucide-react';
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

/** Bloqueo total: la empresa fue suspendida desde la plataforma. */
function EmpresaSuspendida() {
  const { empresa, membresias, seleccionarEmpresa, cerrarSesion } = useAuth();
  const otras = membresias.filter((m) => m.empresa.id !== empresa?.id && !m.empresa.suspendida);
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md p-8 text-center space-y-4">
        <Ban className="w-10 h-10 mx-auto text-destructive" />
        <h1 className="text-xl">{empresa?.nombre} está suspendida</h1>
        <p className="text-sm text-muted-foreground">
          El acceso al sistema está bloqueado temporalmente. Comunicate con el proveedor del sistema para reactivarlo.
        </p>
        {empresa?.motivo_suspension && (
          <p className="text-sm rounded-md bg-muted p-3">
            <strong>Motivo:</strong> {empresa.motivo_suspension}
          </p>
        )}
        <div className="flex flex-wrap gap-2 justify-center">
          {otras.length > 0 && (
            <Button variant="outline" onClick={() => seleccionarEmpresa(otras[0].empresa.id)}>
              Ir a {otras[0].empresa.nombre}
            </Button>
          )}
          <Button variant="ghost" onClick={() => void cerrarSesion()}>
            Cerrar sesión
          </Button>
        </div>
      </Card>
    </div>
  );
}

/** Exige sesión iniciada (sin exigir empresa). */
export function RequireSesion({ children }: { children: ReactNode }) {
  const { cargando, session } = useAuth();
  const location = useLocation();
  if (cargando) return <PantallaCarga />;
  if (!session) return <Navigate to="/login" replace state={{ desde: location.pathname }} />;
  return <>{children}</>;
}

/** Exige sesión iniciada y una empresa activa (no suspendida, salvo para el superadmin). */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { cargando, session, empresa, perfil, suscripcion } = useAuth();
  const location = useLocation();

  if (cargando) return <PantallaCarga />;
  if (!session) return <Navigate to="/login" replace state={{ desde: location.pathname }} />;
  if (!empresa) return perfil?.superadmin ? <Navigate to="/plataforma" replace /> : <SinEmpresa />;
  if (suscripcion?.estado === 'suspendida' && !perfil?.superadmin) return <EmpresaSuspendida />;
  return <>{children}</>;
}

/** Solo el administrador de la plataforma. */
export function RequireSuperadmin({ children }: { children: ReactNode }) {
  const { perfil } = useAuth();
  if (!perfil?.superadmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

/** Página de inicio según el tipo de usuario. */
export function Inicio() {
  const { perfil } = useAuth();
  return <Navigate to={perfil?.superadmin ? '/plataforma' : '/dashboard'} replace />;
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
