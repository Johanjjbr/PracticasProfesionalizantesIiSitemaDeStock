import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { ChevronLeft, ChevronRight, LogOut, Store, User } from 'lucide-react';
import { useAuth } from '@/auth/AuthProvider';
import { ROL_LABEL, puedeVer } from '@/auth/permisos';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { cn } from '../components/ui/utils';
import { RUBRO_LABEL } from '@/lib/rubros';
import { ITEMS_MENU, MENU } from './menu';


function fechaHoy() {
  const t = new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export default function Layout() {
  const [colapsado, setColapsado] = useState(false);
  const { perfil, empresa, rol, membresias, seleccionarEmpresa, cerrarSesion } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const salir = async () => {
    await cerrarSesion();
    navigate('/login');
  };

  const actual = ITEMS_MENU.find((i) => location.pathname.startsWith(i.ruta));

  return (
    <div className="flex h-screen bg-background">
      <aside
        className={cn(
          'bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 flex flex-col',
          colapsado ? 'w-16' : 'w-64',
        )}
      >
        {/* Encabezado: empresa activa */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          {!colapsado && (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 bg-sidebar-primary rounded flex items-center justify-center shrink-0">
                <Store className="w-5 h-5 text-sidebar-primary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{empresa?.nombre}</p>
                <p className="text-[10px] text-sidebar-foreground/60">
                  {empresa ? RUBRO_LABEL[empresa.rubro] : ''}
                </p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setColapsado(!colapsado)}
            className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            aria-label={colapsado ? 'Expandir menú' : 'Colapsar menú'}
          >
            {colapsado ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>

        {/* Selector de empresa (solo si el usuario tiene más de una) */}
        {!colapsado && membresias.length > 1 && empresa && (
          <div className="px-4 py-3 border-b border-sidebar-border">
            <Select value={empresa.id} onValueChange={seleccionarEmpresa}>
              <SelectTrigger className="h-8 text-xs bg-sidebar-accent border-sidebar-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {membresias.map((m) => (
                  <SelectItem key={m.empresa.id} value={m.empresa.id} className="text-xs">
                    {m.empresa.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Navegación */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {MENU.map((seccion) => {
            const items = seccion.items.filter((i) => puedeVer(i.ruta, rol));
            if (items.length === 0) return null;
            return (
              <div key={seccion.titulo ?? 'inicio'} className="mb-3">
                {seccion.titulo && !colapsado && (
                  <p className="px-6 mb-1 text-[10px] uppercase text-sidebar-foreground/40 tracking-wider">
                    {seccion.titulo}
                  </p>
                )}
                <ul className="space-y-0.5 px-2">
                  {items.map((item) => {
                    const Icono = item.icono;
                    const activo = location.pathname.startsWith(item.ruta);
                    return (
                      <li key={item.ruta}>
                        <Link
                          to={item.ruta}
                          title={colapsado ? item.label : undefined}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm',
                            activo
                              ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                          )}
                        >
                          <Icono className="w-5 h-5 shrink-0" />
                          {!colapsado && <span>{item.label}</span>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Usuario */}
        <div className="border-t border-sidebar-border p-4">
          {!colapsado ? (
            <div className="space-y-2">
              <Link
                to="/mi-cuenta"
                title="Mi cuenta"
                className="flex items-center gap-3 px-2 py-2 bg-sidebar-accent rounded-md hover:ring-1 hover:ring-sidebar-ring"
              >
                <div className="w-8 h-8 bg-sidebar-primary rounded-full flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-sidebar-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{perfil?.nombre ?? perfil?.email}</p>
                  <p className="text-xs text-sidebar-foreground/60">{rol ? ROL_LABEL[rol] : ''}</p>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={salir}
                className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar sesión
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={salir}
              aria-label="Cerrar sesión"
              className="w-full text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <h2 className="text-lg text-card-foreground">
              {actual?.label ?? (location.pathname.startsWith('/mi-cuenta') ? 'Mi cuenta' : 'Panel')}
            </h2>
            {perfil?.superadmin && (
              <Badge variant="outline" className="text-[10px]">
                Superadmin
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">{fechaHoy()}</div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
