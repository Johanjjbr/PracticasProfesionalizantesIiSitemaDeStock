export const INIT_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL DEFAULT 'password',
  role TEXT NOT NULL DEFAULT 'viewer',
  warehouse TEXT,
  createdAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  detailedDescription TEXT,
  category TEXT NOT NULL,
  unitOfMeasure TEXT DEFAULT 'Unidad',
  warehouse TEXT NOT NULL,
  location TEXT,
  currentStock REAL NOT NULL DEFAULT 0,
  minStock REAL NOT NULL DEFAULT 0,
  unitPrice REAL NOT NULL DEFAULT 0,
  lastPurchasePrice REAL,
  currency TEXT DEFAULT 'ARS',
  isActive INTEGER DEFAULT 1,
  lastUpdated TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  fantasyName TEXT,
  cuit TEXT,
  contact TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT,
  country TEXT,
  postalCode TEXT,
  website TEXT,
  vatCondition TEXT,
  category TEXT,
  paymentTerm TEXT,
  bankAlias TEXT,
  observations TEXT,
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS transfers (
  id TEXT PRIMARY KEY,
  product TEXT NOT NULL,
  productId TEXT,
  quantity REAL NOT NULL,
  quantityReceived REAL,
  sourceWarehouse TEXT NOT NULL,
  destinationWarehouse TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  operator TEXT NOT NULL,
  receptionist TEXT,
  createdAt TEXT NOT NULL,
  estimatedDelivery TEXT,
  receivedAt TEXT,
  completedAt TEXT,
  receptionNotes TEXT
);

CREATE TABLE IF NOT EXISTS movements (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  productId TEXT NOT NULL,
  productName TEXT NOT NULL,
  quantity REAL NOT NULL,
  warehouse TEXT NOT NULL,
  operator TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS goods_receipts (
  id TEXT PRIMARY KEY,
  supplierId TEXT NOT NULL,
  supplierName TEXT NOT NULL,
  productId TEXT NOT NULL,
  productName TEXT NOT NULL,
  sku TEXT NOT NULL,
  quantity REAL NOT NULL,
  unitPrice REAL NOT NULL,
  totalAmount REAL NOT NULL,
  warehouse TEXT NOT NULL,
  invoiceNumber TEXT,
  notes TEXT,
  operator TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_adjustments (
  id TEXT PRIMARY KEY,
  productId TEXT NOT NULL,
  productName TEXT NOT NULL,
  sku TEXT NOT NULL,
  warehouse TEXT NOT NULL,
  previousStock REAL NOT NULL,
  adjustmentQuantity REAL NOT NULL,
  newStock REAL NOT NULL,
  reason TEXT NOT NULL,
  type TEXT NOT NULL,
  operator TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  notes TEXT
);

-- Seed data

INSERT OR IGNORE INTO users (id, name, email, password, role, warehouse) VALUES
('1', 'Admin User', 'admin@laescuela.com', 'admin123', 'admin', NULL),
('2', 'Manager User', 'manager@laescuela.com', 'manager123', 'manager', NULL),
('3', 'Operator User', 'operator@laescuela.com', 'operator123', 'operator', NULL),
('4', 'Recepcionista User', 'recepcion@laescuela.com', 'recepcion123', 'receptionist', 'Almac\u00e9n Central'),
('5', 'Viewer User', 'viewer@laescuela.com', 'viewer123', 'viewer', NULL);

INSERT OR IGNORE INTO products (id, sku, name, description, detailedDescription, category, unitOfMeasure, warehouse, location, currentStock, minStock, unitPrice, lastPurchasePrice, currency, isActive, lastUpdated) VALUES
('1', 'SKU-001', 'Tornillo M8x20', 'Tornillo de acero inoxidable', 'Tornillo m\u00e9trico M8x20mm de acero inoxidable 304, cabeza hexagonal, ideal para estructuras y ensambles industriales.', 'Ferreter\u00eda', 'Unidad', 'Almac\u00e9n Central', 'Estante A-01', 45, 100, 0.25, 0.20, 'ARS', 1, '2026-04-15'),
('2', 'SKU-002', 'Tuerca Hexagonal M8', 'Tuerca hexagonal galvanizada', NULL, 'Ferreter\u00eda', 'Unidad', 'Almac\u00e9n Central', 'Estante A-02', 320, 200, 0.15, 0.12, 'ARS', 1, '2026-04-15'),
('3', 'SKU-003', 'Cable el\u00e9ctrico 2.5mm', 'Cable de cobre unipolar', NULL, 'Electricidad', 'Metro', 'Almac\u00e9n Norte', 'Estante B-05', 15, 50, 1.80, 1.50, 'ARS', 1, '2026-04-14'),
('4', 'SKU-004', 'Interruptor Simple', 'Interruptor el\u00e9ctrico domiciliario', NULL, 'Electricidad', 'Unidad', 'Almac\u00e9n Central', 'Estante B-01', 89, 100, 3.50, 2.80, 'ARS', 1, '2026-04-15'),
('5', 'SKU-005', 'V\u00e1lvula Check 1/2"', 'V\u00e1lvula de retenci\u00f3n de bronce', NULL, 'Plomer\u00eda', 'Unidad', 'Almac\u00e9n Sur', 'Estante C-03', 5, 30, 12.00, 9.50, 'ARS', 1, '2026-04-13'),
('6', 'SKU-006', 'Tubo PVC 3/4"', 'Ca\u00f1er\u00eda PVC r\u00edgida presi\u00f3n', NULL, 'Plomer\u00eda', 'Metro', 'Almac\u00e9n Norte', 'Pasillo D-01', 150, 80, 4.20, 3.60, 'ARS', 1, '2026-04-15'),
('7', 'SKU-007', 'Pintura L\u00e1tex Blanco', 'Pintura l\u00e1tex interior/exterior', NULL, 'Pinturas', 'Litro', 'Almac\u00e9n Central', 'Estante E-02', 28, 40, 15.50, 12.00, 'ARS', 1, '2026-04-14'),
('8', 'SKU-008', 'Rodillo 9"', 'Rodillo de pintura con mango', NULL, 'Pinturas', 'Unidad', 'Almac\u00e9n Central', 'Estante E-04', 67, 50, 2.80, 2.20, 'ARS', 1, '2026-04-15');

INSERT OR IGNORE INTO suppliers (id, name, fantasyName, cuit, contact, email, phone, address, city, country, postalCode, website, vatCondition, category, paymentTerm, bankAlias, observations, status) VALUES
('1', 'Ferreter\u00eda Industrial S.A.', 'FerroIndustrial', '30-12345678-9', 'Carlos P\u00e9rez', 'carlos@ferreteria.com', '+5491134567890', 'Av. Industrial 123', 'Buenos Aires', 'Argentina', 'C1414', 'www.ferroindustrial.com.ar', 'Responsable Inscripto', 'Ferreter\u00eda', '30 d\u00edas', 'ferro.industrial.sa', 'Proveedor principal de materiales de ferreter\u00eda.', 'active'),
('2', 'Distribuidora El\u00e9ctrica', 'ElectroDist', '30-98765432-1', 'Ana Mart\u00ednez', 'ana@electrica.com', '+5491134567891', 'Calle Comercio 456', 'C\u00f3rdoba', 'Argentina', 'X5000', NULL, 'Responsable Inscripto', 'Electricidad', '15 d\u00edas', NULL, NULL, 'active'),
('3', 'Plomer\u00eda & Materiales', NULL, '20-45678901-3', 'Roberto Silva', 'roberto@plomeria.com', '+5491134567892', 'Zona Industrial 789', 'Rosario', 'Argentina', 'S2000', NULL, 'Monotributista', 'Plomer\u00eda', 'Contado', NULL, NULL, 'active');

INSERT OR IGNORE INTO transfers (id, product, productId, quantity, quantityReceived, sourceWarehouse, destinationWarehouse, status, operator, receptionist, createdAt, estimatedDelivery, receivedAt, completedAt, receptionNotes) VALUES
('1', 'Tornillo M8x20', '1', 100, NULL, 'Almac\u00e9n Norte', 'Almac\u00e9n Central', 'pending_reception', 'Juan Garc\u00eda', NULL, '2026-04-15T08:30:00', '2026-04-16T14:00:00', NULL, NULL, NULL),
('2', 'Cable el\u00e9ctrico 2.5mm', '3', 50, 50, 'Almac\u00e9n Central', 'Almac\u00e9n Norte', 'completed', 'Mar\u00eda L\u00f3pez', 'Carlos Ruiz', '2026-04-14T10:15:00', NULL, NULL, '2026-04-15T09:30:00', NULL),
('3', 'V\u00e1lvula Check 1/2"', '5', 20, NULL, 'Almac\u00e9n Norte', 'Almac\u00e9n Central', 'pending_reception', 'Pedro Ram\u00edrez', NULL, '2026-04-20T14:20:00', '2026-04-21T10:00:00', NULL, NULL, NULL);

INSERT OR IGNORE INTO movements (id, type, productId, productName, quantity, warehouse, operator, timestamp, notes) VALUES
('1', 'in', '1', 'Tornillo M8x20', 200, 'Almac\u00e9n Central', 'Juan Garc\u00eda', '2026-04-15T08:30:00', 'Recepci\u00f3n de proveedor'),
('2', 'out', '3', 'Cable el\u00e9ctrico 2.5mm', 35, 'Almac\u00e9n Norte', 'Mar\u00eda L\u00f3pez', '2026-04-14T14:20:00', 'Pedido cliente #1234'),
('3', 'transfer', '2', 'Tuerca Hexagonal M8', 100, 'Almac\u00e9n Central', 'Pedro Ram\u00edrez', '2026-04-13T11:45:00', 'Reabastecimiento');

INSERT OR IGNORE INTO goods_receipts (id, supplierId, supplierName, productId, productName, sku, quantity, unitPrice, totalAmount, warehouse, invoiceNumber, notes, operator, createdAt) VALUES
('1', '1', 'Ferreter\u00eda Industrial S.A.', '2', 'Tuerca Hexagonal M8', 'SKU-002', 500, 0.12, 60.00, 'Almac\u00e9n Central', 'FAC-2026-001', 'Pedido de reposici\u00f3n', 'Juan Garc\u00eda', '2026-04-10T09:00:00'),
('2', '2', 'Distribuidora El\u00e9ctrica', '3', 'Cable el\u00e9ctrico 2.5mm', 'SKU-003', 100, 1.50, 150.00, 'Almac\u00e9n Norte', 'FAC-2026-045', NULL, 'Mar\u00eda L\u00f3pez', '2026-04-12T11:30:00');

INSERT OR IGNORE INTO inventory_adjustments (id, productId, productName, sku, warehouse, previousStock, adjustmentQuantity, newStock, reason, type, operator, createdAt, notes) VALUES
('1', '7', 'Pintura L\u00e1tex Blanco', 'SKU-007', 'Almac\u00e9n Central', 30, -2, 28, 'Producto da\u00f1ado', 'decrease', 'Admin User', '2026-04-14T15:00:00', '2 latas con envase roto');
`;
