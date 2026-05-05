# Diagrama de Base de Datos - Sistema de Stock e Inventario

## VERSIÓN TEXTUAL PARA COPIAR/PEGAR

```
═══════════════════════════════════════════════════════════════════════
                    SISTEMA ERP "LA ESCUELA"
            MÓDULO: STOCK Y CONTROL DE INVENTARIO
═══════════════════════════════════════════════════════════════════════


┌─────────────────────┐
│   USERS             │
│ ⭐ MODIFICADA       │
├─────────────────────┤
│ PK  id              │
│     name            │
│     email (UNIQUE)  │
│     password        │
│     role (ENUM)     │◄──── roles: admin, manager, operator,
│     warehouse       │           receptionist ⭐, viewer
│     createdAt       │
│     lastLogin       │
└─────────────────────┘
          │
          │ asignado a
          ▼
┌─────────────────────┐
│   WAREHOUSES        │
│ ⭐ NUEVA            │
├─────────────────────┤
│ PK  id              │
│     name (UNIQUE)   │
│     location        │
│     capacity        │
│     manager         │
└─────────────────────┘
          │
          │ contiene
          ▼
┌─────────────────────┐           ┌─────────────────────┐
│   PRODUCTS          │───────────│   CATEGORIES        │
│ ⭐ NUEVA            │ pertenece │ ⭐ NUEVA            │
├─────────────────────┤           ├─────────────────────┤
│ PK  id              │           │ PK  id              │
│     sku (UNIQUE)    │           │     name (UNIQUE)   │
│     name            │           │     description     │
│ FK  category        │───────────│                     │
│ FK  warehouse       │           └─────────────────────┘
│     currentStock    │
│     minStock        │
│     unitPrice       │
│     lastUpdated     │
└─────────────────────┘
          │
          │
          ├──────── usado en ────────┐
          │                          │
          │                          ▼
          │                ┌─────────────────────┐
          │                │   TRANSFERS         │
          │                │ ⭐ NUEVA            │
          │                ├─────────────────────┤
          │                │ PK  id              │
          │                │     product         │
          │                │ FK  productId       │
          │                │     quantity        │
          │                │     quantityReceived│
          │                │ FK  sourceWarehouse │
          │                │ FK  destinationWare │
          │                │     status (ENUM)   │◄─── pending,
          │                │     operator        │     pending_reception ⭐,
          │                │     receptionist ⭐ │     completed, cancelled,
          │                │     createdAt       │     rejected ⭐
          │                │     estimatedDeliv. │
          │                │     receivedAt      │
          │                │     completedAt     │
          │                │     receptionNotes  │
          │                └─────────────────────┘
          │                          │
          │                          │ genera
          │                          ▼
          │                ┌─────────────────────┐
          │                │   MOVEMENTS         │
          │                │ ⭐ NUEVA            │
          │                ├─────────────────────┤
          │                │ PK  id              │
          │                │     type (ENUM)     │◄─── in, out, transfer
          │                │ FK  productId       │
          │                │     productName     │
          │                │     quantity        │
          │                │ FK  warehouse       │
          │                │     operator        │
          │                │     timestamp       │
          │                │     notes           │
          │                └─────────────────────┘
          │
          │ suministrado por
          │
          └────────────────────┐
                               │
                               ▼
                     ┌─────────────────────┐
                     │ PRODUCT_SUPPLIERS   │
                     │ ⭐ NUEVA            │
                     ├─────────────────────┤
                     │ PK  id              │
                     │ FK  productId       │───┐
                     │ FK  supplierId      │◄──┤
                     │     supplierPrice   │   │
                     │     leadTime        │   │
                     │     isPreferred     │   │
                     └─────────────────────┘   │
                               │               │
                               │               │
                               │               │
                               └───────────────┘
                                               │
                                               │
                                               ▼
                                     ┌─────────────────────┐
                                     │   SUPPLIERS         │
                                     │ ⭐ NUEVA            │
                                     ├─────────────────────┤
                                     │ PK  id              │
                                     │     name (UNIQUE)   │
                                     │     contact         │
                                     │     email (UNIQUE)  │
                                     │     phone           │
                                     │     address         │
                                     │     status (ENUM)   │◄─ active, inactive
                                     └─────────────────────┘


LEYENDA:
═══════
⭐ NUEVA      = Tabla completamente nueva para este módulo
⭐ MODIFICADA = Tabla existente con campos nuevos agregados
PK            = Primary Key (Clave Primaria)
FK            = Foreign Key (Clave Foránea)
(UNIQUE)      = Valor único en toda la tabla
(ENUM)        = Valores predefinidos limitados
```

---

## VERSIÓN SQL - SCRIPT DE CREACIÓN

```sql
-- ============================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS
-- Sistema: ERP La Escuela - Módulo Inventario
-- ============================================

-- Tabla: Categorías de productos
CREATE TABLE categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Almacenes
CREATE TABLE warehouses (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    location VARCHAR(200) NOT NULL,
    capacity INT NOT NULL,
    manager VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Proveedores
CREATE TABLE suppliers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL UNIQUE,
    contact VARCHAR(200) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    address VARCHAR(300) NOT NULL,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla: Productos
CREATE TABLE products (
    id VARCHAR(50) PRIMARY KEY,
    sku VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    category_id VARCHAR(50) NOT NULL,
    warehouse_id VARCHAR(50) NOT NULL,
    current_stock INT NOT NULL DEFAULT 0,
    min_stock INT NOT NULL DEFAULT 0,
    unit_price DECIMAL(10,2) NOT NULL,
    last_updated DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE RESTRICT,
    
    CHECK (current_stock >= 0),
    CHECK (min_stock >= 0),
    CHECK (unit_price >= 0)
);

-- Tabla: Relación Producto-Proveedor
CREATE TABLE product_suppliers (
    id VARCHAR(50) PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL,
    supplier_id VARCHAR(50) NOT NULL,
    supplier_price DECIMAL(10,2) NOT NULL,
    lead_time INT NOT NULL, -- días de entrega
    is_preferred BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    
    UNIQUE (product_id, supplier_id),
    CHECK (supplier_price >= 0),
    CHECK (lead_time >= 0)
);

-- Tabla: Usuarios (modificada para incluir recepcionista)
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager', 'operator', 'receptionist', 'viewer') NOT NULL,
    warehouse_id VARCHAR(50), -- solo para recepcionistas
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL
);

-- Tabla: Traspasos entre almacenes
CREATE TABLE transfers (
    id VARCHAR(50) PRIMARY KEY,
    product_name VARCHAR(200) NOT NULL,
    product_id VARCHAR(50),
    quantity INT NOT NULL,
    quantity_received INT,
    source_warehouse_id VARCHAR(50) NOT NULL,
    destination_warehouse_id VARCHAR(50) NOT NULL,
    status ENUM('pending', 'pending_reception', 'completed', 'cancelled', 'rejected') NOT NULL,
    operator VARCHAR(100) NOT NULL,
    receptionist VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estimated_delivery TIMESTAMP,
    received_at TIMESTAMP,
    completed_at TIMESTAMP,
    reception_notes TEXT,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    FOREIGN KEY (source_warehouse_id) REFERENCES warehouses(id) ON DELETE RESTRICT,
    FOREIGN KEY (destination_warehouse_id) REFERENCES warehouses(id) ON DELETE RESTRICT,
    
    CHECK (quantity > 0),
    CHECK (quantity_received >= 0),
    CHECK (source_warehouse_id != destination_warehouse_id)
);

-- Tabla: Movimientos de inventario
CREATE TABLE movements (
    id VARCHAR(50) PRIMARY KEY,
    type ENUM('in', 'out', 'transfer') NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    quantity INT NOT NULL,
    warehouse_id VARCHAR(50) NOT NULL,
    operator VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE RESTRICT,
    
    CHECK (quantity > 0)
);

-- ============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_warehouse ON products(warehouse_id);
CREATE INDEX idx_products_stock ON products(current_stock);
CREATE INDEX idx_products_sku ON products(sku);

CREATE INDEX idx_transfers_status ON transfers(status);
CREATE INDEX idx_transfers_destination ON transfers(destination_warehouse_id);
CREATE INDEX idx_transfers_created ON transfers(created_at);

CREATE INDEX idx_movements_type ON movements(type);
CREATE INDEX idx_movements_warehouse ON movements(warehouse_id);
CREATE INDEX idx_movements_timestamp ON movements(timestamp);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_suppliers_status ON suppliers(status);

-- ============================================
-- TRIGGERS Y PROCEDIMIENTOS
-- ============================================

-- Trigger: Actualizar stock automáticamente al completar traspaso
DELIMITER //
CREATE TRIGGER after_transfer_complete
AFTER UPDATE ON transfers
FOR EACH ROW
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Restar del almacén origen
        UPDATE products 
        SET current_stock = current_stock - NEW.quantity
        WHERE id = NEW.product_id 
          AND warehouse_id = NEW.source_warehouse_id;
        
        -- Sumar al almacén destino
        UPDATE products 
        SET current_stock = current_stock + COALESCE(NEW.quantity_received, NEW.quantity)
        WHERE id = NEW.product_id 
          AND warehouse_id = NEW.destination_warehouse_id;
    END IF;
END//
DELIMITER ;

-- Trigger: Actualizar fecha de modificación en productos
DELIMITER //
CREATE TRIGGER before_product_update
BEFORE UPDATE ON products
FOR EACH ROW
BEGIN
    SET NEW.last_updated = CURDATE();
END//
DELIMITER ;
```

---

## DATOS DE EJEMPLO (INSERTS)

```sql
-- Categorías
INSERT INTO categories (id, name, description) VALUES
('cat1', 'Ferretería', 'Tornillos, tuercas, clavos y herrajes'),
('cat2', 'Electricidad', 'Cables, interruptores, enchufes'),
('cat3', 'Plomería', 'Tuberías, válvulas, conexiones'),
('cat4', 'Pinturas', 'Pinturas, rodillos, brochas');

-- Almacenes
INSERT INTO warehouses (id, name, location, capacity, manager) VALUES
('wh1', 'Almacén Central', 'Zona Industrial Oeste', 5000, 'Ricardo Gómez'),
('wh2', 'Almacén Norte', 'Zona Norte - Distrito 3', 3000, 'Laura Fernández'),
('wh3', 'Almacén Sur', 'Zona Sur - Ruta 9', 4000, 'Miguel Torres');

-- Proveedores
INSERT INTO suppliers (id, name, contact, email, phone, address, status) VALUES
('sup1', 'Ferretería Industrial S.A.', 'Carlos Pérez', 'carlos@ferreteria.com', '+1234567890', 'Av. Industrial 123', 'active'),
('sup2', 'Distribuidora Eléctrica', 'Ana Martínez', 'ana@electrica.com', '+1234567891', 'Calle Comercio 456', 'active'),
('sup3', 'Plomería & Materiales', 'Roberto Silva', 'roberto@plomeria.com', '+1234567892', 'Zona Industrial 789', 'active');

-- Productos
INSERT INTO products (id, sku, name, category_id, warehouse_id, current_stock, min_stock, unit_price, last_updated) VALUES
('prod1', 'SKU-001', 'Tornillo M8x20', 'cat1', 'wh1', 45, 100, 0.25, '2026-04-15'),
('prod2', 'SKU-002', 'Tuerca Hexagonal M8', 'cat1', 'wh1', 320, 200, 0.15, '2026-04-15'),
('prod3', 'SKU-003', 'Cable eléctrico 2.5mm', 'cat2', 'wh2', 15, 50, 1.80, '2026-04-14'),
('prod4', 'SKU-004', 'Interruptor Simple', 'cat2', 'wh1', 89, 100, 3.50, '2026-04-15'),
('prod5', 'SKU-005', 'Válvula Check 1/2"', 'cat3', 'wh3', 5, 30, 12.00, '2026-04-13');

-- Usuarios
INSERT INTO users (id, name, email, password, role, warehouse_id) VALUES
('user1', 'Admin User', 'admin@laescuela.com', 'hashed_password', 'admin', NULL),
('user2', 'María Recepcionista', 'maria@laescuela.com', 'hashed_password', 'receptionist', 'wh1'),
('user3', 'Juan Operador', 'juan@laescuela.com', 'hashed_password', 'operator', NULL);
```

---

## CONSULTAS ÚTILES

```sql
-- Productos con stock crítico
SELECT p.*, c.name as category_name, w.name as warehouse_name
FROM products p
JOIN categories c ON p.category_id = c.id
JOIN warehouses w ON p.warehouse_id = w.id
WHERE p.current_stock < p.min_stock
ORDER BY (p.min_stock - p.current_stock) DESC;

-- Traspasos pendientes para un almacén específico
SELECT t.*, p.name as product_name
FROM transfers t
LEFT JOIN products p ON t.product_id = p.id
WHERE t.destination_warehouse_id = 'wh1'
  AND t.status = 'pending_reception'
ORDER BY t.created_at DESC;

-- Movimientos del día por tipo
SELECT type, COUNT(*) as cantidad, SUM(quantity) as unidades_totales
FROM movements
WHERE DATE(timestamp) = CURDATE()
GROUP BY type;

-- Valor total del inventario por almacén
SELECT w.name as almacen, 
       SUM(p.current_stock * p.unit_price) as valor_total,
       COUNT(p.id) as cantidad_productos
FROM products p
JOIN warehouses w ON p.warehouse_id = w.id
GROUP BY w.id, w.name
ORDER BY valor_total DESC;

-- Proveedores activos con cantidad de productos que suministran
SELECT s.*, COUNT(ps.product_id) as productos_suministrados
FROM suppliers s
LEFT JOIN product_suppliers ps ON s.id = ps.supplier_id
WHERE s.status = 'active'
GROUP BY s.id
ORDER BY productos_suministrados DESC;
```

---

## NOTAS IMPORTANTES

### Relaciones Clave:
1. **PRODUCTS ↔ WAREHOUSES**: Un producto está en un almacén (1:N)
2. **PRODUCTS ↔ SUPPLIERS**: Relación muchos a muchos vía PRODUCT_SUPPLIERS
3. **TRANSFERS**: Conecta dos WAREHOUSES y un PRODUCT
4. **MOVEMENTS**: Registro de auditoría, no modifica stock directamente
5. **USERS ↔ WAREHOUSES**: Solo recepcionistas tienen almacén asignado

### Integridad Referencial:
- `ON DELETE RESTRICT`: Evita eliminar registros si hay dependencias
- `ON DELETE CASCADE`: Elimina registros relacionados automáticamente
- `ON DELETE SET NULL`: Mantiene registro pero limpia la referencia

### Validaciones:
- CHECK constraints para valores positivos
- UNIQUE constraints para evitar duplicados
- ENUM para valores predefinidos
- Foreign Keys para integridad

---

⭐ **Todas las tablas marcadas son NUEVAS para este módulo**
