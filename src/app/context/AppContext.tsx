import { createContext, useContext, useState, ReactNode } from 'react';
import { User, Product, Supplier, Transfer, Movement } from '../types';

interface AppContextType {
  user: User | null;
  login: (email: string, password: string, role: string) => Promise<boolean>;
  logout: () => void;
  products: Product[];
  suppliers: Supplier[];
  transfers: Transfer[];
  movements: Movement[];
  addProduct: (product: Omit<Product, 'id' | 'lastUpdated'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  createTransfer: (transfer: Omit<Transfer, 'id' | 'createdAt' | 'status'>) => void;
  updateTransferStatus: (id: string, status: Transfer['status']) => void;
  validateTransfer: (id: string, quantityReceived: number, notes: string, receptionist: string) => void;
  rejectTransfer: (id: string, notes: string, receptionist: string) => void;
  addMovement: (movement: Omit<Movement, 'id' | 'timestamp'>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Mock data
const mockProducts: Product[] = [
  { id: '1', sku: 'SKU-001', name: 'Tornillo M8x20', category: 'Ferretería', warehouse: 'Almacén Central', currentStock: 45, minStock: 100, unitPrice: 0.25, lastUpdated: '2026-04-15' },
  { id: '2', sku: 'SKU-002', name: 'Tuerca Hexagonal M8', category: 'Ferretería', warehouse: 'Almacén Central', currentStock: 320, minStock: 200, unitPrice: 0.15, lastUpdated: '2026-04-15' },
  { id: '3', sku: 'SKU-003', name: 'Cable eléctrico 2.5mm', category: 'Electricidad', warehouse: 'Almacén Norte', currentStock: 15, minStock: 50, unitPrice: 1.80, lastUpdated: '2026-04-14' },
  { id: '4', sku: 'SKU-004', name: 'Interruptor Simple', category: 'Electricidad', warehouse: 'Almacén Central', currentStock: 89, minStock: 100, unitPrice: 3.50, lastUpdated: '2026-04-15' },
  { id: '5', sku: 'SKU-005', name: 'Válvula Check 1/2"', category: 'Plomería', warehouse: 'Almacén Sur', currentStock: 5, minStock: 30, unitPrice: 12.00, lastUpdated: '2026-04-13' },
  { id: '6', sku: 'SKU-006', name: 'Tubo PVC 3/4"', category: 'Plomería', warehouse: 'Almacén Norte', currentStock: 150, minStock: 80, unitPrice: 4.20, lastUpdated: '2026-04-15' },
  { id: '7', sku: 'SKU-007', name: 'Pintura Látex Blanco', category: 'Pinturas', warehouse: 'Almacén Central', currentStock: 28, minStock: 40, unitPrice: 15.50, lastUpdated: '2026-04-14' },
  { id: '8', sku: 'SKU-008', name: 'Rodillo 9"', category: 'Pinturas', warehouse: 'Almacén Central', currentStock: 67, minStock: 50, unitPrice: 2.80, lastUpdated: '2026-04-15' },
];

const mockSuppliers: Supplier[] = [
  { id: '1', name: 'Ferretería Industrial S.A.', contact: 'Carlos Pérez', email: 'carlos@ferreteria.com', phone: '+1234567890', address: 'Av. Industrial 123', status: 'active' },
  { id: '2', name: 'Distribuidora Eléctrica', contact: 'Ana Martínez', email: 'ana@electrica.com', phone: '+1234567891', address: 'Calle Comercio 456', status: 'active' },
  { id: '3', name: 'Plomería & Materiales', contact: 'Roberto Silva', email: 'roberto@plomeria.com', phone: '+1234567892', address: 'Zona Industrial 789', status: 'active' },
];

const mockTransfers: Transfer[] = [
  { id: '1', product: 'Tornillo M8x20', productId: '1', quantity: 100, sourceWarehouse: 'Almacén Norte', destinationWarehouse: 'Almacén Central', status: 'pending_reception', operator: 'Juan García', createdAt: '2026-04-15T08:30:00', estimatedDelivery: '2026-04-16T14:00:00' },
  { id: '2', product: 'Cable eléctrico 2.5mm', productId: '3', quantity: 50, sourceWarehouse: 'Almacén Central', destinationWarehouse: 'Almacén Norte', status: 'completed', operator: 'María López', receptionist: 'Carlos Ruiz', createdAt: '2026-04-14T10:15:00', completedAt: '2026-04-15T09:30:00', quantityReceived: 50 },
  { id: '3', product: 'Válvula Check 1/2"', productId: '5', quantity: 20, sourceWarehouse: 'Almacén Norte', destinationWarehouse: 'Almacén Central', status: 'pending_reception', operator: 'Pedro Ramírez', createdAt: '2026-04-20T14:20:00', estimatedDelivery: '2026-04-21T10:00:00' },
];

const mockMovements: Movement[] = [
  { id: '1', type: 'in', productId: '1', productName: 'Tornillo M8x20', quantity: 200, warehouse: 'Almacén Central', operator: 'Juan García', timestamp: '2026-04-15T08:30:00', notes: 'Recepción de proveedor' },
  { id: '2', type: 'out', productId: '3', productName: 'Cable eléctrico 2.5mm', quantity: 35, warehouse: 'Almacén Norte', operator: 'María López', timestamp: '2026-04-14T14:20:00', notes: 'Pedido cliente #1234' },
  { id: '3', type: 'transfer', productId: '2', productName: 'Tuerca Hexagonal M8', quantity: 100, warehouse: 'Almacén Central', operator: 'Pedro Ramírez', timestamp: '2026-04-13T11:45:00', notes: 'Reabastecimiento' },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [transfers, setTransfers] = useState<Transfer[]>(mockTransfers);
  const [movements, setMovements] = useState<Movement[]>(mockMovements);

  const login = async (email: string, password: string, role: string): Promise<boolean> => {
    // Mock authentication
    if (email && password) {
      const mockUser: User = {
        id: '1',
        name: role === 'admin' ? 'Admin User' :
              role === 'manager' ? 'Manager User' :
              role === 'operator' ? 'Operator User' :
              role === 'receptionist' ? 'Recepcionista User' :
              'Viewer User',
        email,
        role: role as any,
        warehouse: role === 'receptionist' ? 'Almacén Central' : undefined,
      };
      setUser(mockUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const addProduct = (product: Omit<Product, 'id' | 'lastUpdated'>) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    setProducts([...products, newProduct]);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(products.map(p => 
      p.id === id ? { ...p, ...updates, lastUpdated: new Date().toISOString().split('T')[0] } : p
    ));
  };

  const deleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const addSupplier = (supplier: Omit<Supplier, 'id'>) => {
    const newSupplier: Supplier = {
      ...supplier,
      id: Date.now().toString(),
    };
    setSuppliers([...suppliers, newSupplier]);
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers(suppliers.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteSupplier = (id: string) => {
    setSuppliers(suppliers.filter(s => s.id !== id));
  };

  const createTransfer = (transfer: Omit<Transfer, 'id' | 'createdAt' | 'status'>) => {
    const newTransfer: Transfer = {
      ...transfer,
      id: Date.now().toString(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setTransfers([...transfers, newTransfer]);
  };

  const updateTransferStatus = (id: string, status: Transfer['status']) => {
    setTransfers(transfers.map(t =>
      t.id === id ? {
        ...t,
        status,
        ...(status === 'completed' ? { completedAt: new Date().toISOString() } : {}),
        ...(status === 'pending_reception' ? { receivedAt: new Date().toISOString() } : {})
      } : t
    ));
  };

  const validateTransfer = (id: string, quantityReceived: number, notes: string, receptionist: string) => {
    const transfer = transfers.find(t => t.id === id);
    if (!transfer) return;

    setTransfers(transfers.map(t =>
      t.id === id ? {
        ...t,
        status: 'completed',
        quantityReceived,
        receptionNotes: notes,
        receptionist,
        completedAt: new Date().toISOString(),
      } : t
    ));

    // Update product stock
    if (transfer.productId) {
      setProducts(products.map(p =>
        p.id === transfer.productId && p.warehouse === transfer.destinationWarehouse
          ? { ...p, currentStock: p.currentStock + quantityReceived }
          : p
      ));
    }

    // Add movement
    addMovement({
      type: 'transfer',
      productId: transfer.productId || '',
      productName: transfer.product,
      quantity: quantityReceived,
      warehouse: transfer.destinationWarehouse,
      operator: receptionist,
      notes: `Recepción validada: ${notes}`,
    });
  };

  const rejectTransfer = (id: string, notes: string, receptionist: string) => {
    setTransfers(transfers.map(t =>
      t.id === id ? {
        ...t,
        status: 'rejected',
        receptionNotes: notes,
        receptionist,
      } : t
    ));
  };

  const addMovement = (movement: Omit<Movement, 'id' | 'timestamp'>) => {
    const newMovement: Movement = {
      ...movement,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    setMovements([newMovement, ...movements]);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        login,
        logout,
        products,
        suppliers,
        transfers,
        movements,
        addProduct,
        updateProduct,
        deleteProduct,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        createTransfer,
        updateTransferStatus,
        validateTransfer,
        rejectTransfer,
        addMovement,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
