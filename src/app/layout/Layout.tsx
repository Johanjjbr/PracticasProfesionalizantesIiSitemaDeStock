import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { AlertTriangle, ChevronLeft, ChevronRight, LayoutGrid, LogOut, Store, User } from 'lucide-react';
import { formatFechaCorta } from '@/lib/format';
import { useAuth } from '@/auth/AuthProvider';
import { ROL_LABEL, puedeVer } from '@/auth/permisos';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { cn } from '../components/ui/utils';
import { RUBRO_LABEL } from '@/lib/rubros';
import { ITEMS_MENU, MENU } from './menu';


function AvisoSuscripcion({
  estado,
  pagadoHasta,
  finGracia,
  diasParaVencer,
  esAdmin,
  esSuperadmin,
}: {
  estado?: string;
  pagadoHasta: string | null;
  finGracia: string | null;
  diasParaVencer: number | null;
  esAdmin: boolean;
  esSuperadmin: boolean;
}) {
  let texto: string | null = null;
  let fuerte = false;
  if (estado === 'suspendida' && esSuperadmin) {
    texto = 'Esta empresa está suspendida: sus usuarios no pueden entrar. Estás viéndola como administrador de la plataforma.';
    fuerte = true;
  } else if (estado === 'vencida') {
    texto = esSuperadmin
      ? `Suscripción vencida desde el ${formatFechaCorta(pagadoHasta)}: los usuarios de esta empresa están en solo lectura.`
      : `La suscripción venció el ${formatFechaCorta(pagadoHasta)}. El sistema está en modo solo lectura: podés consultar y exportar, pero no registrar ventas, compras ni cambios. Comunicate con el proveedor del sistema para regularizar.`;
    fuerte = true;
  } else if (estado === 'gracia') {
    texto = `La suscripción venció el ${formatFechaCorta(pagadoHasta)}. Tenés hasta el ${formatFechaCorta(finGracia)} para regularizar; después el sistema queda en solo lectura.`;
  } else if (estado === 'activa' && (esAdmin || esSuperadmin) && diasParaVencer != null && diasParaVencer <= 5) {
    texto =
      diasParaVencer === 0
        ? 'La suscripción vence hoy.'
        : `La suscripción vence en ${diasParaVencer} día${diasParaVencer === 1 ? '' : 's'} (${formatFechaCorta(pagadoHasta)}).`;
  }
  if (!texto) return null;
  return (
    <div
      role="status"
      className={cn(
        'mb-4 flex items-start gap-3 rounded-md border px-4 py-3 text-sm',
        fuerte
          ? 'border-destructive/40 bg-destructive/10 text-foreground'
          : 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100',
      )}
    >
      <AlertTriangle className={cn('w-4 h-4 mt-0.5 shrink-0', fuerte ? 'text-destructive' : 'text-amber-600')} />
      <p>{texto}</p>
    </div>
  );
}

function fechaHoy() {
  const t = new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export default function Layout() {
  const [colapsado, setColapsado] = useState(false);
  const { perfil, empresa, rol, rolReal, membresias, seleccionarEmpresa, cerrarSesion, suscripcion } = useAuth();
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
          {perfil?.superadmin && (
            <Link
              to="/plataforma"
              title="Plataforma"
              className="mb-2 flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-sidebar-accent"
            >
              <LayoutGrid className="w-4 h-4 shrink-0" />
              {!colapsado && 'Plataforma'}
            </Link>
          )}
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
                  <p className="text-xs text-sidebar-foreground/60">{rolReal ? ROL_LABEL[rolReal] : ''}{rolReal && rol !== rolReal ? ' · solo lectura' : ''}</p>
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
          <AvisoSuscripcion
            estado={suscripcion?.estado}
            pagadoHasta={suscripcion?.pagadoHasta ?? null}
            finGracia={suscripcion?.finGracia ?? null}
            diasParaVencer={suscripcion?.diasParaVencer ?? null}
            esAdmin={rolReal === 'admin'}
            esSuperadmin={!!perfil?.superadmin}
          />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
