import { createBrowserRouter, Navigate } from 'react-router';
import { Inicio, RequireAuth, RequireRol, RequireSesion, RequireSuperadmin } from '@/auth/guards';
import Layout from './layout/Layout';
import { ITEMS_MENU } from './layout/menu';
import EnConstruccion from './pages/EnConstruccion';
import LoginPage from '@/features/auth/LoginPage';
import RecuperarPasswordPage from '@/features/auth/RecuperarPasswordPage';
import NuevaPasswordPage from '@/features/auth/NuevaPasswordPage';
import DashboardPage from '@/features/dashboard/DashboardPage';
import ProductosPage from '@/features/productos/ProductosPage';
import ProveedoresPage from '@/features/proveedores/ProveedoresPage';
import AjustesPage from '@/features/stock/AjustesPage';
import MovimientosPage from '@/features/stock/MovimientosPage';
import ComprasPage from '@/features/compras/ComprasPage';
import NuevaCompraPage from '@/features/compras/NuevaCompraPage';
import CajaPage from '@/features/caja/CajaPage';
import VentasPage from '@/features/ventas/VentasPage';
import ReportesPage from '@/features/reportes/ReportesPage';
import UsuariosPage from '@/features/usuarios/UsuariosPage';
import ConfiguracionPage from '@/features/configuracion/ConfiguracionPage';
import MiCuentaPage from '@/features/configuracion/MiCuentaPage';
import PlataformaLayout from '@/features/plataforma/PlataformaLayout';
import EmpresasPlataformaPage from '@/features/plataforma/EmpresasPlataformaPage';
import PlanesPage from '@/features/plataforma/PlanesPage';

/** Pantallas ya implementadas. El resto del menú muestra "En construcción". */
const PANTALLAS: Record<string, React.ReactElement> = {
  '/dashboard': <DashboardPage />,
  '/productos': <ProductosPage />,
  '/proveedores': <ProveedoresPage />,
  '/stock/ajustes': <AjustesPage />,
  '/stock/movimientos': <MovimientosPage />,
  '/compras': <ComprasPage />,
  '/caja': <CajaPage />,
  '/ventas': <VentasPage />,
  '/reportes': <ReportesPage />,
  '/usuarios': <UsuariosPage />,
  '/configuracion': <ConfiguracionPage />,
};

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/recuperar-password', element: <RecuperarPasswordPage /> },
  { path: '/nueva-password', element: <NuevaPasswordPage /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <Layout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Inicio /> },
      ...ITEMS_MENU.map((item) => ({
        path: item.ruta.slice(1),
        element: (
          <RequireRol ruta={item.ruta}>
            {PANTALLAS[item.ruta] ?? <EnConstruccion titulo={item.label} fase={item.fase} />}
          </RequireRol>
        ),
      })),
      { path: 'mi-cuenta', element: <MiCuentaPage /> },
      {
        path: 'compras/nueva',
        element: (
          <RequireRol ruta="/compras">
            <NuevaCompraPage />
          </RequireRol>
        ),
      },
    ],
  },
  {
    path: '/plataforma',
    element: (
      <RequireSesion>
        <RequireSuperadmin>
          <PlataformaLayout />
        </RequireSuperadmin>
      </RequireSesion>
    ),
    children: [
      { index: true, element: <EmpresasPlataformaPage /> },
      { path: 'planes', element: <PlanesPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
