import { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  Users,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
  Bell,
  ClipboardCheck,
  DollarSign,
  ShoppingCart,
  Factory,
  Truck,
  UserCircle,
  Box
} from 'lucide-react';
import { cn } from './ui/utils';

// Módulos del sistema ERP
const erpModules = [
  { id: 'financial', name: 'Financiero-Contable', icon: DollarSign, active: false },
  { id: 'sales', name: 'Ventas y Marketing', icon: ShoppingCart, active: false },
  { id: 'production', name: 'Producción', icon: Factory, active: false },
  { id: 'purchases', name: 'Compras y Logística', icon: Truck, active: false },
  { id: 'hr', name: 'Recursos Humanos', icon: UserCircle, active: false },
  { id: 'inventory', name: 'Stock y Control Inventario', icon: Box, active: true },
];

// Sub-menú del módulo de Stock y Control Inventario
const inventoryMenuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'manager', 'operator', 'viewer'] },
  { path: '/inventory', icon: Package, label: 'Inventario', roles: ['admin', 'manager', 'operator', 'viewer'] },
  { path: '/transfers', icon: Warehouse, label: 'Traspasos', roles: ['admin', 'manager', 'operator'] },
  { path: '/reception', icon: ClipboardCheck, label: 'Recepción', roles: ['admin', 'receptionist'] },
  { path: '/suppliers', icon: Users, label: 'Proveedores', roles: ['admin', 'manager'] },
  { path: '/reports', icon: FileText, label: 'Reportes', roles: ['admin', 'manager', 'viewer'] },
  { path: '/settings', icon: Settings, label: 'Configuración', roles: ['admin'] },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [showModuleSelector, setShowModuleSelector] = useState(false);
  const moduleSelectorRef = useRef<HTMLDivElement>(null);
  const { user, logout, transfers } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleMenuItems = inventoryMenuItems.filter(item =>
    item.roles.includes(user?.role || 'viewer')
  );

  const activeModule = erpModules.find(m => m.active);

  // Calculate pending receptions for receptionist
  const pendingReceptions = user?.role === 'receptionist'
    ? transfers.filter(t => t.destinationWarehouse === user.warehouse && t.status === 'pending_reception').length
    : 0;

  const notificationCount = user?.role === 'receptionist' ? pendingReceptions : 3;

  // Close module selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moduleSelectorRef.current && !moduleSelectorRef.current.contains(event.target as Node)) {
        setShowModuleSelector(false);
      }
    };

    if (showModuleSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showModuleSelector]);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 flex flex-col",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          {!collapsed && (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-sidebar-primary rounded flex items-center justify-center">
                  <Package className="w-5 h-5 text-sidebar-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold">La Escuela</p>
                  <p className="text-[10px] text-sidebar-foreground/60">Sistema ERP</p>
                </div>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>

        {/* Module Selector */}
        {!collapsed && (
          <div className="px-4 py-3 border-b border-sidebar-border">
            <div className="relative" ref={moduleSelectorRef}>
              <button
                onClick={() => setShowModuleSelector(!showModuleSelector)}
                className="w-full flex items-center justify-between px-3 py-2 bg-sidebar-accent rounded-md hover:bg-sidebar-accent/80 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {activeModule && (
                    <>
                      <activeModule.icon className="w-4 h-4 text-sidebar-primary flex-shrink-0" />
                      <span className="text-xs font-medium truncate">{activeModule.name}</span>
                    </>
                  )}
                </div>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-2 flex-shrink-0">Activo</Badge>
              </button>

              {/* Module Dropdown */}
              {showModuleSelector && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-sidebar border border-sidebar-border rounded-md shadow-lg z-50 max-h-[300px] overflow-y-auto">
                  {erpModules.map((module) => {
                    const ModuleIcon = module.icon;
                    return (
                      <button
                        key={module.id}
                        disabled={!module.active}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2.5 text-xs transition-colors border-b border-sidebar-border last:border-0",
                          module.active
                            ? "bg-sidebar-accent text-sidebar-foreground cursor-pointer hover:bg-sidebar-accent/80"
                            : "text-sidebar-foreground/40 cursor-not-allowed"
                        )}
                        onClick={() => {
                          if (module.active) {
                            setShowModuleSelector(false);
                          }
                        }}
                      >
                        <ModuleIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1 text-left truncate">{module.name}</span>
                        {module.active && (
                          <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-sidebar-primary">
                            Activo
                          </Badge>
                        )}
                        {!module.active && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            Próximamente
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {!collapsed && (
            <div className="px-4 mb-2">
              <p className="text-[10px] uppercase text-sidebar-foreground/40 tracking-wider">
                Control de Inventario
              </p>
            </div>
          )}
          <ul className="space-y-1 px-2">
            {visibleMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Section */}
        <div className="border-t border-sidebar-border p-4">
          {!collapsed ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 px-2 py-2 bg-sidebar-accent rounded-md">
                <div className="w-8 h-8 bg-sidebar-primary rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-sidebar-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{user?.name}</p>
                  <p className="text-xs text-sidebar-foreground/60 capitalize">{user?.role}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg text-card-foreground">
                {visibleMenuItems.find(item => item.path === location.pathname)?.label || 'Panel'}
              </h2>
              <Badge variant="outline" className="text-[10px]">
                {activeModule?.name}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Operador: {user?.name}
              {user?.role === 'receptionist' && user.warehouse && (
                <> • <span className="text-primary">Almacén: {user.warehouse}</span></>
              )}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {user?.role === 'receptionist' && (
              <Button
                variant="ghost"
                size="sm"
                className="relative"
                onClick={() => navigate('/reception')}
              >
                <Bell className="w-5 h-5" />
                {pendingReceptions > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-[10px] text-destructive-foreground flex items-center justify-center animate-pulse">
                    {pendingReceptions}
                  </span>
                )}
              </Button>
            )}
            {user?.role !== 'receptionist' && (
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-[10px] text-destructive-foreground flex items-center justify-center">
                  3
                </span>
              </Button>
            )}
            <div className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
