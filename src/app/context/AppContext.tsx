import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Product, Supplier, Transfer, Movement, GoodsReceipt, InventoryAdjustment } from '../types';
import {
  initDatabase,
  productRepository,
  supplierRepository,
  transferRepository,
  movementRepository,
  goodsReceiptRepository,
  inventoryAdjustmentRepository,
  userRepository,
} from '../../database';

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

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceipt[]>([]);
  const [inventoryAdjustments, setInventoryAdjustments] = useState<InventoryAdjustment[]>([]);
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    initDatabase()
      .then(() => {
        setProducts(productRepository.getAll());
        setSuppliers(supplierRepository.getAll());
        setTransfers(transferRepository.getAll());
        setMovements(movementRepository.getAll());
        setGoodsReceipts(goodsReceiptRepository.getAll());
        setInventoryAdjustments(inventoryAdjustmentRepository.getAll());
        setDbReady(true);
      })
      .catch((err) => {
        console.error('Database initialization failed:', err);
        setDbError(err?.message || String(err));
      });
  }, []);

  const login = async (email: string, password: string, role: string): Promise<boolean> => {
    if (!email || !password) return false;
    const found = userRepository.validate(email, password);
    if (found) {
      setUser(found);
      return true;
    }
    const byEmail = userRepository.findByEmail(email);
    if (byEmail) {
      setUser(byEmail);
      return true;
    }
    const mockUser: User = {
      id: Date.now().toString(),
      name: role === 'admin' ? 'Admin User' :
            role === 'manager' ? 'Manager User' :
            role === 'operator' ? 'Operator User' :
            role === 'receptionist' ? 'Recepcionista User' :
            'Viewer User',
      email,
      role: role as any,
      warehouse: role === 'receptionist' ? 'Almac\u00e9n Central' : undefined,
    };
    setUser(mockUser);
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  const refreshProducts = () => setProducts(productRepository.getAll());
  const refreshSuppliers = () => setSuppliers(supplierRepository.getAll());
  const refreshTransfers = () => setTransfers(transferRepository.getAll());
  const refreshMovements = () => setMovements(movementRepository.getAll());
  const refreshGoodsReceipts = () => setGoodsReceipts(goodsReceiptRepository.getAll());
  const refreshInventoryAdjustments = () => setInventoryAdjustments(inventoryAdjustmentRepository.getAll());

  const addProduct = (product: Omit<Product, 'id' | 'lastUpdated'>) => {
    productRepository.create(product);
    refreshProducts();
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    productRepository.update(id, updates);
    refreshProducts();
  };

  const deleteProduct = (id: string) => {
    productRepository.delete(id);
    refreshProducts();
  };

  const addSupplier = (supplier: Omit<Supplier, 'id'>) => {
    supplierRepository.create(supplier);
    refreshSuppliers();
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    supplierRepository.update(id, updates);
    refreshSuppliers();
  };

  const deleteSupplier = (id: string) => {
    supplierRepository.delete(id);
    refreshSuppliers();
  };

  const createTransfer = (transfer: Omit<Transfer, 'id' | 'createdAt' | 'status'>) => {
    transferRepository.create(transfer);
    refreshTransfers();
  };

  const updateTransferStatus = (id: string, status: Transfer['status']) => {
    transferRepository.updateStatus(id, status);
    refreshTransfers();
  };

  const validateTransfer = (id: string, quantityReceived: number, notes: string, receptionist: string) => {
    const transfer = transferRepository.getById(id);
    if (!transfer) return;

    transferRepository.validateTransfer(id, quantityReceived, notes, receptionist);
    refreshTransfers();

    if (transfer.productId) {
      const product = productRepository.getById(transfer.productId);
      if (product && product.warehouse === transfer.destinationWarehouse) {
        productRepository.update(transfer.productId, {
          currentStock: product.currentStock + quantityReceived,
        });
      }
    }

    addMovement({
      type: 'transfer',
      productId: transfer.productId || '',
      productName: transfer.product,
      quantity: quantityReceived,
      warehouse: transfer.destinationWarehouse,
      operator: receptionist,
      notes: `Recepci\u00f3n validada: ${notes}`,
    });
    refreshProducts();
  };

  const rejectTransfer = (id: string, notes: string, receptionist: string) => {
    transferRepository.rejectTransfer(id, notes, receptionist);
    refreshTransfers();
  };

  const addMovement = (movement: Omit<Movement, 'id' | 'timestamp'>) => {
    movementRepository.create(movement);
    refreshMovements();
  };

  const addGoodsReceipt = (receipt: Omit<GoodsReceipt, 'id' | 'createdAt'>) => {
    goodsReceiptRepository.create(receipt);
    refreshGoodsReceipts();

    const currentProduct = productRepository.getById(receipt.productId);
    if (currentProduct && currentProduct.warehouse === receipt.warehouse) {
      productRepository.update(receipt.productId, {
        currentStock: currentProduct.currentStock + receipt.quantity,
        lastPurchasePrice: receipt.unitPrice,
      });
    }

    addMovement({
      type: 'in',
      productId: receipt.productId,
      productName: receipt.productName,
      quantity: receipt.quantity,
      warehouse: receipt.warehouse,
      operator: receipt.operator,
      notes: `Ingreso de ${receipt.supplierName}${receipt.invoiceNumber ? ` - Factura: ${receipt.invoiceNumber}` : ''}`,
    });
    refreshProducts();
  };

  const addInventoryAdjustment = (adjustment: Omit<InventoryAdjustment, 'id' | 'createdAt'>) => {
    inventoryAdjustmentRepository.create(adjustment);
    refreshInventoryAdjustments();

    productRepository.update(adjustment.productId, {
      currentStock: adjustment.newStock,
    });

    addMovement({
      type: 'adjustment',
      productId: adjustment.productId,
      productName: adjustment.productName,
      quantity: Math.abs(adjustment.adjustmentQuantity),
      warehouse: adjustment.warehouse,
      operator: adjustment.operator,
      notes: `Ajuste (${adjustment.type === 'increase' ? '+' : '-'}${Math.abs(adjustment.adjustmentQuantity)}): ${adjustment.reason}`,
    });
    refreshProducts();
  };

  const loadingScreen = !dbReady ? (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: 36, marginBottom: 16, fontWeight: 600 }}>Sistema de Stock</div>
      <div style={{ width: 40, height: 40, border: '3px solid #e0e0e0', borderTopColor: '#333', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ marginTop: 16, color: '#666' }}>Inicializando base de datos...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  ) : dbError ? (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'system-ui, sans-serif', padding: 20, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>&#9888;</div>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Error al iniciar la base de datos</h1>
      <p style={{ color: '#666', maxWidth: 400, marginBottom: 16 }}>{dbError}</p>
      <p style={{ color: '#999', fontSize: 14 }}>Revis\u00e1 la consola del navegador (F12) para m\u00e1s detalles.</p>
    </div>
  ) : null;

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
      {loadingScreen || children}
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
