export type UserRole = 'admin' | 'manager' | 'operator' | 'viewer' | 'receptionist';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  warehouse?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  detailedDescription?: string;
  category: string;
  unitOfMeasure?: string;
  warehouse: string;
  location?: string;
  currentStock: number;
  minStock: number;
  unitPrice: number;
  lastPurchasePrice?: number;
  currency?: string;
  isActive?: boolean;
  lastUpdated: string;
}

export interface Supplier {
  id: string;
  name: string;
  fantasyName?: string;
  cuit?: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  vatCondition?: string;
  category?: string;
  paymentTerm?: string;
  bankAlias?: string;
  observations?: string;
  status: 'active' | 'inactive';
}

export interface Transfer {
  id: string;
  product: string;
  productId?: string;
  quantity: number;
  quantityReceived?: number;
  sourceWarehouse: string;
  destinationWarehouse: string;
  status: 'pending' | 'in_transit' | 'pending_reception' | 'completed' | 'cancelled' | 'rejected';
  operator: string;
  receptionist?: string;
  createdAt: string;
  estimatedDelivery?: string;
  receivedAt?: string;
  completedAt?: string;
  receptionNotes?: string;
}

export interface Movement {
  id: string;
  type: 'in' | 'out' | 'transfer' | 'adjustment';
  productId: string;
  productName: string;
  quantity: number;
  warehouse: string;
  operator: string;
  timestamp: string;
  notes?: string;
}

export interface GoodsReceipt {
  id: string;
  supplierId: string;
  supplierName: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  warehouse: string;
  invoiceNumber?: string;
  notes?: string;
  operator: string;
  createdAt: string;
}

export interface InventoryAdjustment {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  warehouse: string;
  previousStock: number;
  adjustmentQuantity: number;
  newStock: number;
  reason: string;
  type: 'increase' | 'decrease';
  operator: string;
  createdAt: string;
  notes?: string;
}
