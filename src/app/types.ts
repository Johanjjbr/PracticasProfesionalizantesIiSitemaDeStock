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
  category: string;
  warehouse: string;
  currentStock: number;
  minStock: number;
  unitPrice: number;
  lastUpdated: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
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
  type: 'in' | 'out' | 'transfer';
  productId: string;
  productName: string;
  quantity: number;
  warehouse: string;
  operator: string;
  timestamp: string;
  notes?: string;
}
