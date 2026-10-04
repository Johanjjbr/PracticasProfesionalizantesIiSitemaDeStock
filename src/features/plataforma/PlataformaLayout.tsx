import { NavLink, Outlet, useNavigate } from 'react-router';
import { Building2, LayoutGrid, LogOut, Tags } from 'lucide-react';
import { useAuth } from '@/auth/AuthProvider';
import { Button } from '@/app/components/ui/button';
import { cn } from '@/app/components/ui/utils';

const LINKS = [
  { to: '/plataforma', label: 'Empresas', icono: Building2, end: true },
  { to: '/plataforma/planes', label: 'Planes', icono: Tags, end: false },
];

/** Panel del administrador de la plataforma (no depende de una empresa activa). */
export default function PlataformaLayout() {
  const { perfil, empresa, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  const salir = async () => {
    await cerrarSesion();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-sidebar text-sidebar-foreground border-b border-sidebar-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-6">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-sidebar-primary rounded flex items-center justify-center">
              <LayoutGrid className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Plataforma</p>
              <p className="text-[10px] text-sidebar-foreground/60">Administración de empresas</p>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                    isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'hover:bg-sidebar-accent',
                  )
                }
              >
                <l.icono className="w-4 h-4" />
                <span className="hidden sm:inline">{l.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {empresa && (
              <Button
                variant="ghost"
                size="sm"
                className="hidden md:inline-flex text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={() => navigate('/dashboard')}
              >
                Ir a {empresa.nombre}
              </Button>
            )}
            <span className="hidden lg:inline text-xs text-sidebar-foreground/70">{perfil?.email}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={salir}
              aria-label="Cerrar sesión"
              className="text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
