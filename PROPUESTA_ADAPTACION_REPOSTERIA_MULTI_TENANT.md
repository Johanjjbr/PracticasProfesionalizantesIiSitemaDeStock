# Propuesta: Adaptación a Sistema Multi-Tenant con Feature Flags para Repostería

## Objetivo

Adaptar el sistema ERP actual de "Stock y Control de Inventario" a un sistema configurable multi-tenant, manteniendo **todos** los módulos existentes funcionales, pero permitiendo activar/desactivar módulos según el tipo de negocio.

Para el caso específico de una **repostería** sin sedes ni traspasos: se ocultarán `Transfers` y `Reception`, y se añadirán: `Ventas (POS)`, `Compras` (mejorado) y `Caja`.

## 1. Justificación del Enfoque

- **No destruir código**: Los módulos `Transfers` y `Reception` son funcionales. En lugar de eliminarlos, se ocultan mediante feature flags.
- **Reutilizable**: Un mismo código base puede servir para repostería, comercio, depósito industrial, etc.
- **Escalable**: Si mañana la repostería abre una segunda sede, basta con activar `multiWarehouse` + `transfers` + `reception`.
- **Seguro**: Reduce riesgo de romper funcionalidades existentes.
- **Pragmático**: Se mantiene la infraestructura ya probada (repositorios, tipos, UI components).

## 2. Arquitectura Multi-Tenant con Feature Flags

### 2.1 Concepto

Cada tenant (negocio) tendrá un objeto de configuración que define qué módulos están habilitados y ciertas reglas de negocio.

```json
{
  "id": "reposteria-central",
  "name": "La Repostería",
  "businessType": "bakery",
  "settings": {
    "modules": {
      "dashboard": true,
      "products": true,
      "sales": true,
      "purchases": true,
      "inventoryAdjustment": true,
      "movements": true,
      "suppliers": true,
      "reports": true,
      "cashRegister": true,
      "users": true,
      "settings": true,
      "transfers": false,
      "reception": false,
      "goodsReceipt": true
    },
    "multiWarehouse": false,
    "singleWarehouseName": "La Repostería",
    "currency": "ARS",
    "ticketHeader": "La Repostería Artesanal",
    "ticketFooter": "Gracias por su compra!",
    "businessInfo": {
      "name": "La Repostería",
      "address": "",
      "phone": "",
      "cuit": ""
    }
  }
}
```

### 2.2 Flujo de Inicialización

1. Al iniciar la app, se carga el tenant activo desde `localStorage` o desde BD (tabla `tenants`).
2. `TenantContext` expone `tenant`, `isModuleEnabled('sales')`, `isFeatureEnabled('multiWarehouse')`, etc.
3. `Layout.tsx` filtra el menú lateral según módulos habilitados.
4. `routes.tsx` protege rutas con `<FeatureFlag>` (redirige a `/dashboard` si está deshabilitado).
5. Componentes individuales pueden adaptar su UI con `useTenant()`.

## 3. Cambios en Base de Datos (SQLite via sql.js)

### 3.1 Nueva tabla `tenants`

```sql
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  business_type TEXT DEFAULT 'general',
  settings TEXT NOT NULL, -- JSON string
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

**Datos iniciales (seeds):**

```sql
INSERT OR IGNORE INTO tenants (id, name, business_type, settings, is_active) VALUES
('default-industrial', 'Sistema Industrial (Demo)', 'industrial', 
 '{"modules":{"dashboard":true,"products":true,"sales":false,"purchases":true,"inventoryAdjustment":true,"movements":true,"suppliers":true,"reports":true,"cashRegister":false,"users":true,"settings":true,"transfers":true,"reception":true,"goodsReceipt":true},"multiWarehouse":true,"singleWarehouseName":"Almacén Central","currency":"ARS"}',
 1),
('reposteria-001', 'La Repostería', 'bakery',
 '{"modules":{"dashboard":true,"products":true,"sales":true,"purchases":true,"inventoryAdjustment":true,"movements":true,"suppliers":true,"reports":true,"cashRegister":true,"users":true,"settings":true,"transfers":false,"reception":false,"goodsReceipt":true},"multiWarehouse":false,"singleWarehouseName":"La Repostería","currency":"ARS","ticketHeader":"La Repostería Artesanal","ticketFooter":"Gracias por su compra!"}',
 1);
```

### 3.2 Nuevas tablas para módulos de Repostería

#### `sales` (Ventas)
```sql
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  date TEXT NOT NULL,
  subtotal REAL NOT NULL DEFAULT 0,
  discount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL CHECK(payment_method IN ('cash','card','transfer','mixed')),
  payment_cash REAL,
  payment_card REAL,
  payment_transfer REAL,
  customer_name TEXT,
  operator TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('completed','cancelled','pending')) DEFAULT 'completed',
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
```

#### `sale_items` (Detalle de venta)
```sql
CREATE TABLE IF NOT EXISTS sale_items (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit_price REAL NOT NULL,
  subtotal REAL NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

#### `purchase_orders` (Órdenes de compra)
```sql
CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  supplier_id TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  order_date TEXT NOT NULL,
  expected_date TEXT,
  subtotal REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK(status IN ('pending','partial','received','cancelled')) DEFAULT 'pending',
  operator TEXT NOT NULL,
  received_by TEXT,
  received_at TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);
```

#### `purchase_order_items` (Detalle OC)
```sql
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id TEXT PRIMARY KEY,
  purchase_order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  quantity REAL NOT NULL,
  quantity_received REAL NOT NULL DEFAULT 0,
  unit_cost REAL NOT NULL,
  subtotal REAL NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

#### `cash_registers` (Cajas diarias)
```sql
CREATE TABLE IF NOT EXISTS cash_registers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  date TEXT NOT NULL,
  opening_amount REAL NOT NULL,
  opening_operator TEXT NOT NULL,
  opening_time TEXT NOT NULL,
  closing_amount REAL,
  closing_operator TEXT,
  closing_time TEXT,
  expected_amount REAL,
  difference REAL,
  status TEXT NOT NULL CHECK(status IN ('open','closed')) DEFAULT 'open',
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
```

#### `cash_movements` (Movimientos de caja)
```sql
CREATE TABLE IF NOT EXISTS cash_movements (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  cash_register_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('sale','expense','withdrawal','deposit','adjustment')),
  amount REAL NOT NULL,
  description TEXT NOT NULL,
  reference_id TEXT,
  operator TEXT NOT NULL,
  timestamp TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (cash_register_id) REFERENCES cash_registers(id) ON DELETE CASCADE
);
```

### 3.3 Modificaciones a tablas existentes

**`products`** – Agregar campo `cost_price` (mantener campos existentes para compatibilidad)

```sql
ALTER TABLE products ADD COLUMN cost_price REAL DEFAULT 0;
```

**`users`** – Agregar soporte para `superadmin` (opcional pero útil para gestión de tenants)

```sql
-- Los roles actuales ya son válidos: admin, manager, operator, receptionist, viewer
-- Podríamos añadir 'superadmin' en tipos para administrar tenants
```

**Nota:** No eliminamos `warehouses`, `transfers`, `transfers`-related ni nada. Todo sigue intacto.

## 4. Nuevos Tipos TypeScript

Crear/modificar en `src/app/types.ts`:

```typescript
// Tenant types
export interface TenantModuleFlags {
  dashboard: boolean;
  products: boolean;
  sales: boolean;
  purchases: boolean;
  inventoryAdjustment: boolean;
  movements: boolean;
  suppliers: boolean;
  reports: boolean;
  cashRegister: boolean;
  users: boolean;
  settings: boolean;
  transfers: boolean;
  reception: boolean;
  goodsReceipt: boolean;
}

export interface TenantSettings {
  modules: TenantModuleFlags;
  multiWarehouse: boolean;
  singleWarehouseName: string;
  currency: 'ARS' | 'USD' | 'EUR';
  ticketHeader?: string;
  ticketFooter?: string;
  businessInfo?: {
    name: string;
    address: string;
    phone: string;
    cuit: string;
  };
}

export interface Tenant {
  id: string;
  name: string;
  businessType: 'general' | 'industrial' | 'bakery' | 'retail';
  settings: TenantSettings;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Sales
export interface SaleItem {
  id?: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  tenantId: string;
  date: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'mixed';
  paymentCash?: number;
  paymentCard?: number;
  paymentTransfer?: number;
  customerName?: string;
  operator: string;
  status: 'completed' | 'cancelled' | 'pending';
  notes?: string;
  createdAt: string;
}

// Purchase Orders
export interface PurchaseOrderItem {
  id?: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  quantityReceived: number;
  unitCost: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id: string;
  tenantId: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  expectedDate?: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  total: number;
  status: 'pending' | 'partial' | 'received' | 'cancelled';
  operator: string;
  receivedBy?: string;
  receivedAt?: string;
  notes?: string;
  createdAt: string;
}

// Cash Register
export interface CashMovement {
  id: string;
  tenantId: string;
  cashRegisterId: string;
  type: 'sale' | 'expense' | 'withdrawal' | 'deposit' | 'adjustment';
  amount: number;
  description: string;
  referenceId?: string;
  operator: string;
  timestamp: string;
}

export interface CashRegister {
  id: string;
  tenantId: string;
  date: string;
  openingAmount: number;
  openingOperator: string;
  openingTime: string;
  closingAmount?: number;
  closingOperator?: string;
  closingTime?: string;
  expectedAmount?: number;
  difference?: number;
  status: 'open' | 'closed';
  movements: CashMovement[];
  notes?: string;
  createdAt: string;
}

// Extender Product con costPrice
export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  detailedDescription?: string;
  category: string;
  unitOfMeasure?: string;
  warehouse: string; // mantener por compatibilidad
  location?: string;
  currentStock: number;
  minStock: number;
  unitPrice: number;
  costPrice?: number; // NUEVO
  lastPurchasePrice?: number;
  currency?: string;
  isActive?: boolean;
  lastUpdated: string;
}
```

## 5. Arquitectura Frontend

### 5.1 `TenantContext.tsx` (Nuevo)

**Ruta:** `src/app/context/TenantContext.tsx`

Responsabilidades:
- Cargar tenant activo (localStorage + BD)
- Exponer `tenant`, `setTenant`, `currentTenantId`
- Helpers: `isModuleEnabled(module)`, `isFeatureEnabled(feature: 'multiWarehouse')`
- Persistir selección en `localStorage` con key `app.tenantId`

```tsx
interface TenantContextType {
  tenant: Tenant | null;
  currentTenantId: string | null;
  loading: boolean;
  setActiveTenant: (tenantId: string) => Promise<void>;
  isModuleEnabled: (module: keyof TenantModuleFlags) => boolean;
  isFeatureEnabled: (feature: 'multiWarehouse') => boolean;
  reloadTenant: () => Promise<void>;
}
```

### 5.2 `FeatureFlag.tsx` (Nuevo)

**Ruta:** `src/app/components/FeatureFlag.tsx`

Uso dual:
- **Render prop / wrapper**: Oculta UI completo
- **Con fallback**: Redirige o muestra placeholder

```tsx
interface FeatureFlagProps {
  feature: keyof TenantModuleFlags;
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}
```

Ejemplos:
```tsx
<FeatureFlag feature="sales">
  <Button>Nueva Venta</Button>
</FeatureFlag>

<FeatureFlag feature="transfers" fallback={<Navigate to="/dashboard" replace />}>
  <Transfers />
</FeatureFlag>
```

### 5.3 Repositorios Nuevos

**Rutas:** `src/database/repositories/`

- `tenantRepository.ts` – CRUD tenants + getActive + setActive
- `saleRepository.ts` – crear venta + items + actualizar stock
- `saleItemRepository.ts` (opcional) o inline
- `purchaseOrderRepository.ts` – OC + recepción parcial/completa
- `cashRegisterRepository.ts` – apertura/cierre + movimientos + calcular esperado

**Reglas importantes en repositorios:**
- Siempre filtrar por `tenant_id` cuando aplique
- Al registrar venta completada → `sale_items` + restar stock a `products.currentStock`
- Al recibir OC parcial/completa → actualizar `quantity_received` + sumar stock + opcional actualizar `costPrice`
- Al crear `cash_movement` tipo `sale` → vincular a `sale_id`

### 5.4 Actualizar `init.sql.ts`

Agregar:
- `CREATE TABLE tenants (...)`
- Seeds de tenants
- `CREATE TABLE sales`, `sale_items`, ...
- `cash_registers`, `cash_movements`
- Índices: `sales(tenant_id, date)`, `purchase_orders(tenant_id, status)`, `cash_registers(tenant_id, date, status)`

No tocar el resto de tablas existentes.

## 6. Actualización de UI

### 6.1 `Layout.tsx`

- Importar `useTenant()` + `FeatureFlag`
- Filtrar `inventoryMenuItems` dinámicamente: incluir solo items cuyo `feature` esté habilitado
- Ocultar `Transfers` y `Reception` cuando `modules.transfers/reception = false`
- Añadir nuevos ítems: `Ventas` (ShoppingCart), `Compras` (ShoppingBag/Truck), `Caja` (Banknote)
- Mostrar info de tenant activo: `tenant.name` + `( {businessType} )`

**Estructura menú sugerida:**
```tsx
const menuByModule = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, feature: 'dashboard', roles: [...] },
  { path: '/sales', label: 'Ventas', icon: ShoppingCart, feature: 'sales', roles: ['admin','operator'] },
  { path: '/purchases', label: 'Compras', icon: ShoppingBag, feature: 'purchases', roles: ['admin','manager','operator'] },
  { path: '/inventory', label: 'Productos', icon: Package, feature: 'products', roles: [...] },
  { path: '/goods-receipt', label: 'Ingreso Mercadería', icon: PackagePlus, feature: 'goodsReceipt', roles: [...] },
  { path: '/inventory-adjustment', label: 'Ajuste Inventario', icon: SlidersHorizontal, feature: 'inventoryAdjustment', roles: ['admin','manager'] },
  { path: '/transfers', label: 'Traspasos', icon: Warehouse, feature: 'transfers', roles: [...] },
  { path: '/reception', label: 'Recepción', icon: ClipboardCheck, feature: 'reception', roles: ['admin','receptionist'] },
  { path: '/cash-register', label: 'Caja', icon: Banknote, feature: 'cashRegister', roles: ['admin','operator'] },
  { path: '/suppliers', label: 'Proveedores', icon: Users, feature: 'suppliers', roles: ['admin','manager'] },
  { path: '/reports', label: 'Reportes', icon: FileText, feature: 'reports', roles: [...] },
  { path: '/settings', label: 'Configuración', icon: Settings, feature: 'settings', roles: ['admin'] },
  { path: '/tenants', label: 'Tenants', icon: Building, feature: 'settings', roles: ['superadmin'] }, // opcional
  { path: '/manual', label: 'Manual', icon: BookOpen, feature: 'dashboard', roles: [...] },
];
```

Filtrar: `menuByModule.filter(m => isModuleEnabled(m.feature) && m.roles.includes(user.role))`

### 6.2 `routes.tsx`

Envolver rutas con `FeatureFlag` cuando corresponda:

```tsx
{
  path: '/sales',
  element: (
    <FeatureFlag feature="sales" fallback={<Navigate to="/dashboard" replace />}>
      <Sales />
    </FeatureFlag>
  )
},
{
  path: '/cash-register',
  element: (
    <FeatureFlag feature="cashRegister" fallback={<Navigate to="/dashboard" replace />}>
      <CashRegister />
    </FeatureFlag>
  )
},
// transfers y reception igual
```

### 6.3 `Inventory.tsx` (adaptativo)

Si `multiWarehouse === false`:
- Ocultar columnas "Almacén / Ubicación"
- Ocultar selectores de almacén en filtros
- Auto-asignar `warehouse = tenant.settings.singleWarehouseName` al crear/editar
- Formulario más compacto

Si `multiWarehouse === true`:
- Comportamiento actual intacto

### 6.4 `Dashboard.tsx` (adaptativo)

Mostrar KPIs condicionales:
- "Traspasos Activos" → solo si `transfers` habilitado
- "Caja del día" / "Ventas hoy" → solo si `sales` + `cashRegister` habilitados
- "Órdenes pendientes" → solo si `purchases` habilitado

## 7. Nuevas Páginas a Crear

### 7.1 `Sales.tsx` – Punto de Venta (POS)
**Ruta:** `src/app/pages/Sales.tsx`

**UI sugerida:**
- Panel izquierdo: búsqueda de productos (SKU/nombre), grid de productos con stock
- Panel derecho: carrito (items, cantidades, subtotal, descuento, total)
- Footer: selector método de pago (cash/card/transfer/mixed) + botón "Cobrar"
- Modal "Confirmar cobro": mostrar vuelto si efectivo > total
- Toast éxito + opción "Imprimir ticket" (browser print CSS)

**Lógica:**
1. Buscar productos activos con stock > 0
2. Agregar al carrito → validar stock disponible
3. Cobrar → validar totales
4. Crear `sale` + `sale_items` vía `saleRepository.create()`
5. Actualizar `products.currentStock -= quantity` por cada item
6. Si `cashRegister` abierto → crear `cash_movement` tipo `sale`
7. Reset carrito

### 7.2 `Purchases.tsx` – Órdenes de Compra + Recepción
**Ruta:** `src/app/pages/Purchases.tsx` (reemplaza/expande lógica de `GoodsReceipt.tsx`)

**Tabs:**
- "Nueva OC" – crear orden pendiente
- "Órdenes Pendientes" – listar con acciones "Recibir parcial" / "Recibir todo" / "Cancelar"
- "Historial" – completadas/canceladas

**Modal "Recepción":**
- Mostrar items con `quantity` vs `quantityReceived`
- Input `recibido ahora` por línea (validar <= pendiente)
- Al confirmar → actualizar OC (parcial/received) + crear movimientos + sumar stock
- Si habilitado, actualizar `costPrice = unitCost` del producto

### 7.3 `CashRegister.tsx` – Caja Diaria
**Ruta:** `src/app/pages/CashRegister.tsx`

**Estados:**
- **Sin caja abierta**: Form "Abrir caja" (fecha auto, monto inicial, operador)
- **Caja abierta**: Mostrar saldo esperado = apertura + ventas cash - retiros/gastos
- Panel "Movimientos" (ventas automáticas + manuales)
- Botón "Cerrar caja" → conteo físico → diferencia calculada

**Movimientos manuales:** Gasto, Retiro, Depósito, Ajuste con descripción obligatoria.

## 8. Plan de Implementación Paso a Paso

### FASE 1: Infraestructura Multi-Tenant (CRÍTICO)
**Objetivo:** Base sólida sin romper nada existente

- [ ] **1.1** Crear `src/app/types.ts` → Añadir tipos `Tenant`, `TenantSettings`, `TenantModuleFlags`
- [ ] **1.2** Crear `src/database/repositories/tenantRepository.ts`
- [ ] **1.3** Actualizar `src/database/init.sql.ts` → Añadir tabla `tenants` + seeds
- [ ] **1.4** Crear `src/app/context/TenantContext.tsx`
- [ ] **1.5** Crear `src/app/components/FeatureFlag.tsx`
- [ ] **1.6** Envolver `App.tsx` con `TenantProvider` (o integrar en `AppProvider`)
- [ ] **1.7** Probar carga de tenant + flags

**Validación:** App arranca igual que antes. Menú sin cambios si tenant industrial.

### FASE 2: Integración UI (Ocultar/Mostrar módulos)
**Objetivo:** Hacer menú y rutas dinámicos

- [ ] **2.1** Modificar `src/app/components/Layout.tsx` → Usar `useTenant()` + filtrar menú
- [ ] **2.2** Modificar `src/app/routes.tsx` → Envolver rutas con `<FeatureFlag>` para transfers/reception
- [ ] **2.3** Probar con tenant `reposteria-001`: Transfers/Reception NO aparecen
- [ ] **2.4** Probar con tenant `default-industrial`: Transfers/Reception SÍ aparecen

**Validación:** Navegación correcta según tenant. Rutas directas a `/transfers` redirigen si deshabilitado.

### FASE 3: Adaptar Inventario/Dashboard (Modo Single-Warehouse)
**Objetivo:** UI adaptativa sin romper multi-warehouse

- [ ] **3.1** Modificar `src/app/pages/Inventory.tsx` → Ocultar warehouse/location si `multiWarehouse=false`
- [ ] **3.2** Modificar `src/app/pages/InventoryAdjustment.tsx` → Simplificar si single-warehouse
- [ ] **3.3** Modificar `src/app/pages/Dashboard.tsx` → KPIs condicionales
- [ ] **3.4** Modificar `src/app/pages/GoodsReceipt.tsx` → Evaluar renombrar a uso futuro (o mantener)

**Validación:** Inventory limpio para repostería. Dashboard coherente.

### FASE 4: Nuevos Repositorios + Tablas
**Objetivo:** Persistencia para ventas/caja/compras

- [ ] **4.1** Actualizar `src/database/init.sql.ts` → Añadir sales, sale_items, purchase_orders, purchase_order_items, cash_registers, cash_movements + índices
- [ ] **4.2** Crear `saleRepository.ts`
- [ ] **4.3** Crear `purchaseOrderRepository.ts`
- [ ] **4.4** Crear `cashRegisterRepository.ts`
- [ ] **4.5** Exportar nuevos repos desde `src/database/index.ts`
- [ ] **4.6** Añadir `costPrice` a `productRepository.update/create`

**Validación:** Tablas creadas al init. Repos funcionales con tenant_id.

### FASE 5: Módulo Ventas (POS)
**Objetivo:** Core para repostería

- [ ] **5.1** Crear `src/app/pages/Sales.tsx`
- [ ] **5.2** Añadir ruta `/sales` con FeatureFlag
- [ ] **5.3** Añadir ítem "Ventas" a Layout si `sales=true`
- [ ] **5.4** Integrar con `cashRegister` (auto-movimiento si abierta)
- [ ] **5.5** Descontar stock al completar venta
- [ ] **5.6** Probar flujo completo: buscar → carrito → cobrar → ticket

**Validación:** Venta crea sale + items + actualiza stock. No permite vender sin stock.

### FASE 6: Módulo Compras (Órdenes + Recepción)
**Objetivo:** Mejorar gestión de compras

- [ ] **6.1** Crear `src/app/pages/Purchases.tsx`
- [ ] **6.2** Añadir ruta + menú si `purchases=true`
- [ ] **6.3** Flujo "Nueva OC" → guardar pendiente
- [ ] **6.4** Flujo "Recibir parcial/completo" → actualizar stock + costPrice
- [ ] **6.5** Mantener `GoodsReceipt.tsx` accesible si `goodsReceipt=true` (compatibilidad)

**Validación:** OC parcial suma recibido correctamente. Completa pasa a `received`.

### FASE 7: Módulo Caja (Cash Register)
**Objetivo:** Control de caja diario

- [ ] **7.1** Crear `src/app/pages/CashRegister.tsx`
- [ ] **7.2** Ruta + menú si `cashRegister=true`
- [ ] **7.3** Apertura de caja
- [ ] **7.4** Listado movimientos (auto + manual)
- [ ] **7.5** Cálculo `expectedAmount = apertura + ventas_efectivo - retiros/gastos`
- [ ] **7.6** Cierre con conteo físico + diferencia

**Validación:** Solo 1 caja `open` por tenant+fecha. Ventas cash se suman automáticamente.

### FASE 8: Configuración de Tenants (UI Admin)
**Objetivo:** Cambiar entre tenants sin editar código

- [ ] **8.1** Crear `src/app/pages/Tenants.tsx` (listar + ver config JSON)
- [ ] **8.2** Añadir ruta `/tenants` visible solo para `superadmin` o `admin` según criterio
- [ ] **8.3** Permitir "Cambiar tenant activo" (setActiveTenant)
- [ ] **8.4** Mostrar selector de tenant en Layout (dropdown) para facilitar pruebas

**Validación:** Cambio de tenant actualiza menú + rutas al instante.

### FASE 9: Pruebas Integradas
**Objetivo:** Verificar regresión cero

- [ ] **9.1** Probar tenant `default-industrial`: Transfers + Reception visibles, Sales/Caja ocultos
- [ ] **9.2** Probar tenant `reposteria-001`: Transfers/Reception ocultos, Sales+Compras+Caja visibles
- [ ] **9.3** CRUD Productos funciona en ambos modos
- [ ] **9.4** Ajuste inventario funciona
- [ ] **9.5** Proveedores funciona
- [ ] **9.6** Login/roles intactos
- [ ] **9.7** Dashboard carga sin errores

## 9. Recomendaciones para Claude Code

Al pedirle a Claude que implemente esto, conviene darle:

1. **Contexto completo**: Este documento + `README.md` + `ANALISIS_REQUISITOS.md` + estructura actual
2. **Principio #1**: **NO ELIMINAR CÓDIGO**. Solo agregar feature flags + nuevos módulos
3. **Principio #2**: Mantener compatibilidad hacia atrás con tenant industrial por defecto
4. **Principio #3**: Todo lo nuevo debe respetar `tenant_id`
5. **Principio #4**: Usar `FeatureFlag` en Layout + routes SIEMPRE
6. **Principio #5**: UI adaptativa con `multiWarehouse` pero lógica BD intacta

**Prompt sugerido para Claude:**

```text
Te dejo el proyecto actual + PROPUESTA_ADAPTACION_REPOSTERIA_MULTI_TENANT.md

Quiero que implementes esta propuesta paso a paso, empezando por FASE 1.

REGLAS INQUEBRANTABLES:
- NO elimines archivos existentes (Transfers.tsx, Reception.tsx, etc). Solo ocúltalos vía flags.
- NO rompas el tenant industrial existente.
- Agrega TODO lo nuevo sin modificar lógica crítica de transfers/reception.
- Usa TypeScript estricto.
- Mantén sql.js + patrón repositorio actual.
- Commit por fase con descripción clara.
```

## 10. Checklist Final de Aceptación (Repostería)

- [ ] Al iniciar con `reposteria-001`: menú NO muestra Traspasos ni Recepción
- [ ] Ruta `/transfers` redirige a `/dashboard` si deshabilitado
- [ ] Ventas (POS) funciona: agrega productos, cobra, descuenta stock
- [ ] Compras: crear OC + recibir parcial/completo actualiza stock
- [ ] Caja: apertura → movimientos → cierre con diferencia
- [ ] Productos sin campos warehouse/location visibles
- [ ] Dashboard muestra KPIs relevantes a repostería
- [ ] Cambiar a tenant industrial restaura menú completo

## Conclusión

Este enfoque **multi-tenant + feature flags** cumple exactamente lo pedido: mantener todo funcional, ocultar lo innecesario para repostería, y agregar lo faltante sin romper lo existente.

Es la solución más limpia, mantenible y profesional para este caso de uso.