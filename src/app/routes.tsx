import { createBrowserRouter, Navigate } from 'react-router';
import Login from './pages/Login';
import CreatePassword from './pages/CreatePassword';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Transfers from './pages/Transfers';
import Reception from './pages/Reception';
import Suppliers from './pages/Suppliers';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import GoodsReceipt from './pages/GoodsReceipt';
import InventoryAdjustment from './pages/InventoryAdjustment';
import UserManual from './pages/UserManual';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/create-password',
    element: <CreatePassword />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'inventory', element: <Inventory /> },
      { path: 'transfers', element: <Transfers /> },
      { path: 'reception', element: <Reception /> },
      { path: 'suppliers', element: <Suppliers /> },
      { path: 'goods-receipt', element: <GoodsReceipt /> },
      { path: 'inventory-adjustment', element: <InventoryAdjustment /> },
      { path: 'reports', element: <Reports /> },
      { path: 'settings', element: <Settings /> },
      { path: 'manual', element: <UserManual /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);
