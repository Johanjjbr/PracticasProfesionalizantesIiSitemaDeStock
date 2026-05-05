import { createContext, useContext, useState, ReactNode } from 'react';
import { User, Product, Supplier, Transfer, Movement, GoodsReceipt, InventoryAdjustment } from '../types';

interface AppContextType {
  user: User | null;
  login: (email: string, password: string, role: string) => Promise<boolean>;
  logout: () => void;
  products: Product[];
  suppliers: Supplier[];
  transfers: Transfer[];
  movements: Movement[];
  goodsReceipts: GoodsReceipt[];
  inventoryAdjustments: InventoryAdjustment[];
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
  addGoodsReceipt: (receipt: Omit<GoodsReceipt, 'id' | 'createdAt'>) => void;
  addInventoryAdjustment: (adjustment: Omit<InventoryAdjustment, 'id' | 'createdAt'>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Mock data
const mockProducts: Product[] = [
  {
    id: '1', sku: 'SKU-001', name: 'Tornillo M8x20', description: 'Tornillo de acero inoxidable', detailedDescription: 'Tornillo métrico M8x20mm de acero inoxidable 304, cabeza hexagonal, ideal para estructuras y ensambles industriales.',
    category: 'Ferretería', unitOfMeasure: 'Unidad', warehouse: 'Almacén Central', location: 'Estante A-01',
    currentStock: 45, minStock: 100, unitPrice: 0.25, lastPurchasePrice: 0.20, currency: 'ARS', isActive: true, lastUpdated: '2026-04-15'
  },
  {
    id: '2', sku: 'SKU-002', name: 'Tuerca Hexagonal M8', description: 'Tuerca hexagonal galvanizada',
    category: 'Ferretería', unitOfMeasure: 'Unidad', warehouse: 'Almacén Central', location: 'Estante A-02',
    currentStock: 320, minStock: 200, unitPrice: 0.15, lastPurchasePrice: 0.12, currency: 'ARS', isActive: true, lastUpdated: '2026-04-15'
  },
  {
    id: '3', sku: 'SKU-003', name: 'Cable eléctrico 2.5mm', description: 'Cable de cobre unipolar',
    category: 'Electricidad', unitOfMeasure: 'Metro', warehouse: 'Almacén Norte', location: 'Estante B-05',
    currentStock: 15, minStock: 50, unitPrice: 1.80, lastPurchasePrice: 1.50, currency: 'ARS', isActive: true, lastUpdated: '2026-04-14'
  },
  {
    id: '4', sku: 'SKU-004', name: 'Interruptor Simple', description: 'Interruptor eléctrico domiciliario',
    category: 'Electricidad', unitOfMeasure: 'Unidad', warehouse: 'Almacén Central', location: 'Estante B-01',
    currentStock: 89, minStock: 100, unitPrice: 3.50, lastPurchasePrice: 2.80, currency: 'ARS', isActive: true, lastUpdated: '2026-04-15'
  },
  {
    id: '5', sku: 'SKU-005', name: 'Válvula Check 1/2"', description: 'Válvula de retención de bronce',
    category: 'Plomería', unitOfMeasure: 'Unidad', warehouse: 'Almacén Sur', location: 'Estante C-03',
    currentStock: 5, minStock: 30, unitPrice: 12.00, lastPurchasePrice: 9.50, currency: 'ARS', isActive: true, lastUpdated: '2026-04-13'
  },
  {
    id: '6', sku: 'SKU-006', name: 'Tubo PVC 3/4"', description: 'Cañería PVC rígida presión',
    category: 'Plomería', unitOfMeasure: 'Metro', warehouse: 'Almacén Norte', location: 'Pasillo D-01',
    currentStock: 150, minStock: 80, unitPrice: 4.20, lastPurchasePrice: 3.60, currency: 'ARS', isActive: true, lastUpdated: '2026-04-15'
  },
  {
    id: '7', sku: 'SKU-007', name: 'Pintura Látex Blanco', description: 'Pintura látex interior/exterior',
    category: 'Pinturas', unitOfMeasure: 'Litro', warehouse: 'Almacén Central', location: 'Estante E-02',
    currentStock: 28, minStock: 40, unitPrice: 15.50, lastPurchasePrice: 12.00, currency: 'ARS', isActive: true, lastUpdated: '2026-04-14'
  },
  {
    id: '8', sku: 'SKU-008', name: 'Rodillo 9"', description: 'Rodillo de pintura con mango',
    category: 'Pinturas', unitOfMeasure: 'Unidad', warehouse: 'Almacén Central', location: 'Estante E-04',
    currentStock: 67, minStock: 50, unitPrice: 2.80, lastPurchasePrice: 2.20, currency: 'ARS', isActive: true, lastUpdated: '2026-04-15'
  },
];

const mockSuppliers: Supplier[] = [
  {
    id: '1', name: 'Ferretería Industrial S.A.', fantasyName: 'FerroIndustrial', cuit: '30-12345678-9',
    contact: 'Carlos Pérez', email: 'carlos@ferreteria.com', phone: '+5491134567890',
    address: 'Av. Industrial 123', city: 'Buenos Aires', country: 'Argentina', postalCode: 'C1414',
    website: 'www.ferroindustrial.com.ar', vatCondition: 'Responsable Inscripto', category: 'Ferretería',
    paymentTerm: '30 días', bankAlias: 'ferro.industrial.sa', observations: 'Proveedor principal de materiales de ferretería.',
    status: 'active'
  },
  {
    id: '2', name: 'Distribuidora Eléctrica', fantasyName: 'ElectroDist', cuit: '30-98765432-1',
    contact: 'Ana Martínez', email: 'ana@electrica.com', phone: '+5491134567891',
    address: 'Calle Comercio 456', city: 'Córdoba', country: 'Argentina', postalCode: 'X5000',
    vatCondition: 'Responsable Inscripto', category: 'Electricidad', paymentTerm: '15 días',
    status: 'active'
  },
  {
    id: '3', name: 'Plomería & Materiales', cuit: '20-45678901-3',
    contact: 'Roberto Silva', email: 'roberto@plomeria.com', phone: '+5491134567892',
    address: 'Zona Industrial 789', city: 'Rosario', country: 'Argentina', postalCode: 'S2000',
    vatCondition: 'Monotributista', category: 'Plomería', paymentTerm: 'Contado',
    status: 'active'
  },
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

const mockGoodsReceipts: GoodsReceipt[] = [
  { id: '1', supplierId: '1', supplierName: 'Ferretería Industrial S.A.', productId: '2', productName: 'Tuerca Hexagonal M8', sku: 'SKU-002', quantity: 500, unitPrice: 0.12, totalAmount: 60.00, warehouse: 'Almacén Central', invoiceNumber: 'FAC-2026-001', notes: 'Pedido de reposición', operator: 'Juan García', createdAt: '2026-04-10T09:00:00' },
  { id: '2', supplierId: '2', supplierName: 'Distribuidora Eléctrica', productId: '3', productName: 'Cable eléctrico 2.5mm', sku: 'SKU-003', quantity: 100, unitPrice: 1.50, totalAmount: 150.00, warehouse: 'Almacén Norte', invoiceNumber: 'FAC-2026-045', operator: 'María López', createdAt: '2026-04-12T11:30:00' },
];

const mockInventoryAdjustments: InventoryAdjustment[] = [
  { id: '1', productId: '7', productName: 'Pintura Látex Blanco', sku: 'SKU-007', warehouse: 'Almacén Central', previousStock: 30, adjustmentQuantity: -2, newStock: 28, reason: 'Producto dañado', type: 'decrease', operator: 'Admin User', createdAt: '2026-04-14T15:00:00', notes: '2 latas con envase roto' },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [transfers, setTransfers] = useState<Transfer[]>(mockTransfers);
  const [movements, setMovements] = useState<Movement[]>(mockMovements);
  const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceipt[]>(mockGoodsReceipts);
  const [inventoryAdjustments, setInventoryAdjustments] = useState<InventoryAdjustment[]>(mockInventoryAdjustments);

  const login = async (email: string, password: string, role: string): Promise<boolean> => {
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
    setProducts(prev => [...prev, newProduct]);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p =>
      p.id === id ? { ...p, ...updates, lastUpdated: new Date().toISOString().split('T')[0] } : p
    ));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const addSupplier = (supplier: Omit<Supplier, 'id'>) => {
    const newSupplier: Supplier = {
      ...supplier,
      id: Date.now().toString(),
    };
    setSuppliers(prev => [...prev, newSupplier]);
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteSupplier = (id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
  };

  const createTransfer = (transfer: Omit<Transfer, 'id' | 'createdAt' | 'status'>) => {
    const newTransfer: Transfer = {
      ...transfer,
      id: Date.now().toString(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setTransfers(prev => [...prev, newTransfer]);
  };

  const updateTransferStatus = (id: string, status: Transfer['status']) => {
    setTransfers(prev => prev.map(t =>
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

    setTransfers(prev => prev.map(t =>
      t.id === id ? {
        ...t,
        status: 'completed',
        quantityReceived,
        receptionNotes: notes,
        receptionist,
        completedAt: new Date().toISOString(),
      } : t
    ));

    if (transfer.productId) {
      setProducts(prev => prev.map(p =>
        p.id === transfer.productId && p.warehouse === transfer.destinationWarehouse
          ? { ...p, currentStock: p.currentStock + quantityReceived }
          : p
      ));
    }

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
    setTransfers(prev => prev.map(t =>
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
    setMovements(prev => [newMovement, ...prev]);
  };

  const addGoodsReceipt = (receipt: Omit<GoodsReceipt, 'id' | 'createdAt'>) => {
    const newReceipt: GoodsReceipt = {
      ...receipt,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setGoodsReceipts(prev => [newReceipt, ...prev]);

    // Update product stock
    setProducts(prev => prev.map(p =>
      p.id === receipt.productId && p.warehouse === receipt.warehouse
        ? {
            ...p,
            currentStock: p.currentStock + receipt.quantity,
            lastPurchasePrice: receipt.unitPrice,
            lastUpdated: new Date().toISOString().split('T')[0],
          }
        : p
    ));

    // Record movement
    addMovement({
      type: 'in',
      productId: receipt.productId,
      productName: receipt.productName,
      quantity: receipt.quantity,
      warehouse: receipt.warehouse,
      operator: receipt.operator,
      notes: `Ingreso de ${receipt.supplierName}${receipt.invoiceNumber ? ` - Factura: ${receipt.invoiceNumber}` : ''}`,
    });
  };

  const addInventoryAdjustment = (adjustment: Omit<InventoryAdjustment, 'id' | 'createdAt'>) => {
    const newAdjustment: InventoryAdjustment = {
      ...adjustment,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setInventoryAdjustments(prev => [newAdjustment, ...prev]);

    // Update product stock
    setProducts(prev => prev.map(p =>
      p.id === adjustment.productId && p.warehouse === adjustment.warehouse
        ? { ...p, currentStock: adjustment.newStock, lastUpdated: new Date().toISOString().split('T')[0] }
        : p
    ));

    // Record movement
    addMovement({
      type: 'adjustment',
      productId: adjustment.productId,
      productName: adjustment.productName,
      quantity: Math.abs(adjustment.adjustmentQuantity),
      warehouse: adjustment.warehouse,
      operator: adjustment.operator,
      notes: `Ajuste (${adjustment.type === 'increase' ? '+' : '-'}${Math.abs(adjustment.adjustmentQuantity)}): ${adjustment.reason}`,
    });
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
        goodsReceipts,
        inventoryAdjustments,
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
        addGoodsReceipt,
        addInventoryAdjustment,
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
