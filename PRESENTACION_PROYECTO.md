# Primera Presentación - Sistema de Stock e Inventario

## Información del Proyecto
**Sistema:** ERP "La Escuela" - Módulo de Stock y Control Inventario  
**Fecha de Presentación:** 30 de Abril, 2026

---

## 1. DISEÑO DE BASE DE DATOS

### Tablas Principales

#### **TABLA: PRODUCTOS** ⭐ NUEVA
| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| **id** | VARCHAR(50) | Identificador único del producto | PRIMARY KEY |
| sku | VARCHAR(50) | Código SKU del producto | UNIQUE, NOT NULL |
| name | VARCHAR(200) | Nombre del producto | NOT NULL |
| category | VARCHAR(100) | Categoría del producto | NOT NULL |
| warehouse | VARCHAR(100) | Almacén donde se ubica | NOT NULL, FK → WAREHOUSES |
| currentStock | INT | Stock actual disponible | NOT NULL, DEFAULT 0 |
| minStock | INT | Stock mínimo requerido | NOT NULL, DEFAULT 0 |
| unitPrice | DECIMAL(10,2) | Precio unitario del producto | NOT NULL |
| lastUpdated | DATE | Fecha de última actualización | NOT NULL |

**Relaciones:**
- Tiene muchos MOVEMENTS (movimientos de inventario)
- Tiene muchos TRANSFERS (traspasos)
- Pertenece a un WAREHOUSE (almacén)
- Pertenece a una CATEGORY (categoría)

---

#### **TABLA: PROVEEDORES (SUPPLIERS)** ⭐ NUEVA
| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| **id** | VARCHAR(50) | Identificador único del proveedor | PRIMARY KEY |
| name | VARCHAR(200) | Nombre de la empresa proveedora | NOT NULL, UNIQUE |
| contact | VARCHAR(200) | Nombre del contacto principal | NOT NULL |
| email | VARCHAR(100) | Email del proveedor | NOT NULL, UNIQUE |
| phone | VARCHAR(20) | Teléfono de contacto | NOT NULL |
| address | VARCHAR(300) | Dirección física | NOT NULL |
| status | ENUM('active','inactive') | Estado del proveedor | NOT NULL, DEFAULT 'active' |

**Relaciones:**
- Tiene muchos PURCHASE_ORDERS (órdenes de compra)
- Tiene muchos PRODUCT_SUPPLIERS (productos que suministra)

---

### Tablas Secundarias (Relaciones y Soporte)

#### **TABLA: WAREHOUSES** ⭐ NUEVA
| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| **id** | VARCHAR(50) | Identificador único del almacén | PRIMARY KEY |
| name | VARCHAR(100) | Nombre del almacén | NOT NULL, UNIQUE |
| location | VARCHAR(200) | Ubicación física | NOT NULL |
| capacity | INT | Capacidad máxima | NOT NULL |
| manager | VARCHAR(100) | Responsable del almacén | NOT NULL |

**Relaciones:**
- Tiene muchos PRODUCTS (productos almacenados)
- Tiene muchos USERS con role='receptionist' asignados

---

#### **TABLA: CATEGORIES** ⭐ NUEVA
| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| **id** | VARCHAR(50) | Identificador único de categoría | PRIMARY KEY |
| name | VARCHAR(100) | Nombre de la categoría | NOT NULL, UNIQUE |
| description | TEXT | Descripción de la categoría | NULL |

**Relaciones:**
- Tiene muchos PRODUCTS (productos de esta categoría)

---

#### **TABLA: PRODUCT_SUPPLIERS** ⭐ NUEVA
Tabla de relación muchos-a-muchos entre Productos y Proveedores

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| **id** | VARCHAR(50) | Identificador único | PRIMARY KEY |
| productId | VARCHAR(50) | ID del producto | FK → PRODUCTS, NOT NULL |
| supplierId | VARCHAR(50) | ID del proveedor | FK → SUPPLIERS, NOT NULL |
| supplierPrice | DECIMAL(10,2) | Precio que ofrece este proveedor | NOT NULL |
| leadTime | INT | Días de entrega | NOT NULL |
| isPreferred | BOOLEAN | Si es proveedor preferido | DEFAULT FALSE |

**Restricciones:**
- UNIQUE(productId, supplierId) - Un proveedor no puede aparecer duplicado para el mismo producto

---

#### **TABLA: TRANSFERS** ⭐ NUEVA
| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| **id** | VARCHAR(50) | Identificador único del traspaso | PRIMARY KEY |
| product | VARCHAR(200) | Nombre del producto | NOT NULL |
| productId | VARCHAR(50) | ID del producto | FK → PRODUCTS, NULL |
| quantity | INT | Cantidad a traspasar | NOT NULL |
| quantityReceived | INT | Cantidad realmente recibida | NULL |
| sourceWarehouse | VARCHAR(100) | Almacén origen | FK → WAREHOUSES, NOT NULL |
| destinationWarehouse | VARCHAR(100) | Almacén destino | FK → WAREHOUSES, NOT NULL |
| status | ENUM | Estado del traspaso | NOT NULL |
| operator | VARCHAR(100) | Operador que creó el traspaso | NOT NULL |
| receptionist | VARCHAR(100) | Recepcionista que validó | NULL |
| createdAt | TIMESTAMP | Fecha de creación | NOT NULL |
| estimatedDelivery | TIMESTAMP | Fecha estimada de entrega | NULL |
| receivedAt | TIMESTAMP | Fecha de recepción | NULL |
| completedAt | TIMESTAMP | Fecha de completado | NULL |
| receptionNotes | TEXT | Observaciones de recepción | NULL |

**Estados posibles (ENUM):**
- `pending`: Pendiente de envío
- `pending_reception`: Pendiente de recepción/validación
- `completed`: Completado y validado
- `cancelled`: Cancelado
- `rejected`: Rechazado por recepcionista

---

#### **TABLA: MOVEMENTS** ⭐ NUEVA
Registro de todos los movimientos de inventario

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| **id** | VARCHAR(50) | Identificador único del movimiento | PRIMARY KEY |
| type | ENUM('in','out','transfer') | Tipo de movimiento | NOT NULL |
| productId | VARCHAR(50) | ID del producto | FK → PRODUCTS, NOT NULL |
| productName | VARCHAR(200) | Nombre del producto | NOT NULL |
| quantity | INT | Cantidad del movimiento | NOT NULL |
| warehouse | VARCHAR(100) | Almacén afectado | FK → WAREHOUSES, NOT NULL |
| operator | VARCHAR(100) | Operador que realizó el movimiento | NOT NULL |
| timestamp | TIMESTAMP | Fecha y hora del movimiento | NOT NULL |
| notes | TEXT | Observaciones | NULL |

**Tipos de movimiento:**
- `in`: Entrada de mercadería
- `out`: Salida de mercadería
- `transfer`: Traspaso entre almacenes

---

#### **TABLA: USERS**
| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| **id** | VARCHAR(50) | Identificador único del usuario | PRIMARY KEY |
| name | VARCHAR(200) | Nombre completo | NOT NULL |
| email | VARCHAR(100) | Email del usuario | UNIQUE, NOT NULL |
| password | VARCHAR(255) | Contraseña encriptada | NOT NULL |
| role | ENUM | Rol del usuario | NOT NULL |
| warehouse | VARCHAR(100) | Almacén asignado (solo recepcionistas) | FK → WAREHOUSES, NULL |
| createdAt | TIMESTAMP | Fecha de creación | NOT NULL |
| lastLogin | TIMESTAMP | Último acceso | NULL |

**Roles posibles (ENUM):**
- `admin`: Administrador (acceso total)
- `manager`: Gerente (gestión y reportes)
- `operator`: Operador (inventario y traspasos)
- `receptionist`: Recepcionista (validación de recepciones) ⭐ NUEVO
- `viewer`: Visualizador (solo lectura)

---

## 2. DIAGRAMA DE RELACIONES

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  SUPPLIERS  │────┐    │   PRODUCTS   │────┐    │ WAREHOUSES  │
│  ⭐ NUEVA   │    │    │   ⭐ NUEVA   │    │    │  ⭐ NUEVA   │
└─────────────┘    │    └──────────────┘    │    └─────────────┘
                   │            │            │            │
                   │            │            │            │
                   ▼            ▼            ▼            ▼
            ┌──────────────────────┐   ┌──────────────────────┐
            │ PRODUCT_SUPPLIERS    │   │     MOVEMENTS        │
            │     ⭐ NUEVA         │   │     ⭐ NUEVA         │
            └──────────────────────┘   └──────────────────────┘
                                                   │
                                                   │
┌─────────────┐         ┌──────────────┐         │
│ CATEGORIES  │────────▶│  TRANSFERS   │─────────┘
│  ⭐ NUEVA   │         │   ⭐ NUEVA   │
└─────────────┘         └──────────────┘
                                │
                                │
                                ▼
                        ┌──────────────┐
                        │    USERS     │
                        │(Recepcionista│
                        │  ⭐ NUEVO)   │
                        └──────────────┘
```

---

## 3. PANTALLAS DEL SISTEMA

### 3.1 Pantalla de LOGIN

**Descripción:** Pantalla principal de acceso al sistema

**Elementos:**
- Logo del sistema "La Escuela - Sistema ERP"
- Campo: Email (validación de formato)
- Campo: Contraseña (oculta)
- Selector: Rol de usuario (Admin, Manager, Operador, Recepcionista, Visualizador)
- Botón: "Iniciar Sesión"
- Mensajes de error visuales (email inválido, credenciales incorrectas)
- Diseño centrado con card elevado

**Validaciones implementadas:**
- ✅ Email debe contener @
- ✅ Campos obligatorios no pueden estar vacíos
- ✅ Mensajes de error claros con iconos
- ✅ Loading state durante autenticación

**Ruta:** `/login`

---

### 3.2 Pantalla de CREAR/RESTABLECER CONTRASEÑA ✅ IMPLEMENTADA

**Descripción:** Pantalla para gestionar contraseñas (crear nueva o restablecer)

**Ruta:** `/create-password?mode=create` o `/create-password?mode=reset`

**Acceso:** Desde el login mediante links "Crear nueva contraseña" o "¿Olvidaste tu contraseña?"

**Elementos (Crear Nueva Contraseña):**
- Campo: Nueva Contraseña (con opción mostrar/ocultar)
- Campo: Confirmar Contraseña
- Barra de progreso de fortaleza con colores semánticos:
  - Rojo: Muy débil / Débil
  - Amarillo: Media
  - Azul: Fuerte
  - Verde: Muy fuerte
- Requisitos con validación en tiempo real:
  - ✓ Mínimo 8 caracteres
  - ✓ Al menos 1 mayúscula
  - ✓ Al menos 1 número
  - ✓ Al menos 1 carácter especial (!@#$%^&*)
  - ✓ Las contraseñas coinciden
- Checkbox: Mostrar contraseña
- Botón: "Crear Contraseña" (deshabilitado hasta cumplir requisitos)
- Botón: "Volver al Login"

**Elementos (Restablecer Contraseña - Flujo de 3 pasos):**

**Paso 1: Email**
- Campo: Email registrado
- Botón: "Enviar código de verificación"
- Validación de formato de email

**Paso 2: Código de Verificación**
- Campo numérico: Código de 6 dígitos
- Información: Email al que se envió el código
- Botón: "Verificar Código"
- Botón: "Reenviar código"
- Botón: "Atrás" (vuelve al paso 1)
- Código de prueba: **123456**

**Paso 3: Nueva Contraseña**
- Mismos elementos que "Crear Nueva Contraseña"
- Botón: "Restablecer Contraseña"
- Botón: "Atrás" (vuelve al paso 2)

**Validaciones Implementadas:**
- ✅ Contraseñas deben coincidir
- ✅ Cumplir todos los requisitos de seguridad
- ✅ Email debe tener formato válido (@)
- ✅ Código de verificación debe tener 6 dígitos
- ✅ Validación en tiempo real con feedback visual
- ✅ Botón deshabilitado hasta cumplir requisitos
- ✅ Toast notifications de éxito/error

**Características Adicionales:**
- 🎨 Indicador visual de fortaleza con Progress bar
- ✅ Checks verdes cuando se cumple cada requisito
- 🔄 Navegación entre pasos con botones Atrás/Siguiente
- 📧 Simulación de envío de código por email
- 🔐 Opción de mostrar/ocultar contraseña
- ↩️ Botón para volver al login en cualquier momento

---

### 3.3 ABM PRODUCTOS

#### A) Pantalla Inicial (Listado)

**Descripción:** Vista principal del inventario con tabla completa

**Elementos:**
- **Header:**
  - Título: "Gestión de Inventario"
  - Botón: "Nuevo Producto" (solo Admin/Manager)
  - Menú desplegable: "Exportar" (CSV, PDF, Sheets)

- **Filtros avanzados:**
  - Buscador por nombre o SKU
  - Filtro por Categoría (dropdown)
  - Filtro por Almacén (dropdown)
  - Filtro por Estado de Stock:
    - Todos
    - Stock Crítico (< mínimo)
    - Stock Bajo (< 1.5× mínimo)
    - Stock Normal (≥ 1.5× mínimo)

- **Tabla de productos:**
  - Columnas: SKU, Nombre, Categoría, Almacén, Stock Actual, Stock Mínimo, Precio Unit., Última Act.
  - Indicador visual: Stock crítico con badge rojo
  - Acciones por fila:
    - ✏️ Editar (solo Admin/Manager)
    - 🗑️ Eliminar (solo Admin/Manager)
  - Paginación si hay más de 20 productos

**Ruta:** `/inventory`

---

#### B) Pantalla Agregar Nuevo Producto

**Descripción:** Modal/Dialog para crear un producto nuevo

**Elementos del formulario:**
- **Sección Identificación:**
  - SKU * (texto, único)
  - Nombre del Producto * (texto)

- **Sección Clasificación:**
  - Categoría * (texto libre o select)
  - Almacén * (texto libre o select)

- **Sección Stock:**
  - Stock Actual (número, min: 0)
  - Stock Mínimo (número, min: 0)
  - Precio Unitario (decimal, formato moneda)

- **Botones:**
  - "Cancelar" (cierra sin guardar)
  - "Guardar Producto" (valida y crea)

**Validaciones:**
- ✅ Campos marcados con * son obligatorios
- ✅ SKU no puede duplicarse
- ✅ Stock y precio deben ser números positivos
- ✅ Confirmación visual al guardar
- ✅ Trazabilidad: se registra operador que creó

---

#### C) Pantalla Modificar Producto

**Descripción:** Modal/Dialog precargado con datos del producto existente

**Elementos:**
- Mismo formulario que "Agregar Nuevo"
- Campos precargados con valores actuales
- Título: "Editar Producto"
- Indicador visual de última modificación
- Botón: "Actualizar Producto"

**Diferencias con Agregar:**
- ✅ Datos precargados
- ✅ SKU puede bloquearse (solo lectura)
- ✅ Muestra historial de última actualización
- ✅ Confirmación: "¿Guardar cambios?"
- ✅ Trazabilidad: se registra operador que modificó

---

### 3.4 ABM PROVEEDORES

#### A) Pantalla Inicial (Listado)

**Descripción:** Vista principal de proveedores con tabla completa

**Elementos:**
- **Header:**
  - Título: "Gestión de Proveedores"
  - Botón: "Nuevo Proveedor" (solo Admin/Manager)
  - Botón: "Exportar" (CSV, PDF)

- **Buscador:**
  - Por nombre de empresa o email

- **Filtro:**
  - Estado: Todos / Activos / Inactivos

- **Tabla de proveedores:**
  - Columnas: Nombre Empresa, Contacto, Email, Teléfono, Estado
  - Badge verde/gris según estado (Activo/Inactivo)
  - Acciones por fila:
    - ✏️ Editar (solo Admin/Manager)
    - 🗑️ Eliminar (solo Admin/Manager)
    - 🔄 Cambiar estado Activo/Inactivo

**Ruta:** `/suppliers`

---

#### B) Pantalla Agregar Nuevo Proveedor

**Descripción:** Modal/Dialog para crear un proveedor nuevo

**Elementos del formulario:**
- **Sección Empresa:**
  - Nombre de la Empresa * (texto, único)
  - Estado * (select: Activo/Inactivo)

- **Sección Contacto:**
  - Nombre del Contacto * (texto)
  - Email * (email, único)
  - Teléfono * (texto con formato)

- **Sección Ubicación:**
  - Dirección * (texto largo)

- **Botones:**
  - "Cancelar"
  - "Guardar Proveedor"

**Validaciones:**
- ✅ Nombre de empresa único
- ✅ Email con formato válido y único
- ✅ Teléfono con formato válido
- ✅ Todos los campos obligatorios
- ✅ Confirmación al guardar
- ✅ Trazabilidad del operador

---

#### C) Pantalla Modificar Proveedor

**Descripción:** Modal/Dialog precargado con datos del proveedor

**Elementos:**
- Mismo formulario que "Agregar Nuevo"
- Datos precargados
- Título: "Editar Proveedor"
- Botón: "Actualizar Proveedor"
- Opción adicional: "Cambiar a Inactivo/Activo"

**Diferencias:**
- ✅ Campos precargados
- ✅ Permite cambio rápido de estado
- ✅ Muestra última modificación
- ✅ Confirmación de cambios

---

## 4. FLUJOS PRINCIPALES IMPLEMENTADOS

### Flujo de Gestión de Inventario
1. Usuario ingresa con credenciales
2. Accede al módulo de Inventario
3. Puede filtrar productos por múltiples criterios
4. Visualiza stock crítico con alertas visuales
5. Admin/Manager puede crear/editar/eliminar productos
6. Sistema registra trazabilidad (operador, fecha)

### Flujo de Traspasos ⭐ NUEVO
1. Operador crea traspaso entre almacenes
2. Selecciona producto, origen, destino y cantidad
3. Sistema valida stock disponible
4. Traspaso pasa a estado "Pendiente de Recepción"
5. **Recepcionista** recibe alerta en almacén destino
6. Valida cantidad recibida vs. cantidad enviada
7. Puede aprobar o rechazar con observaciones
8. Sistema actualiza automáticamente inventario
9. Genera movimiento de trazabilidad

### Flujo de Proveedores
1. Admin/Manager accede a gestión de proveedores
2. Puede crear nuevo proveedor
3. Asigna información de contacto y ubicación
4. Proveedor queda en estado "Activo"
5. Puede desactivar sin eliminar
6. Sistema mantiene historial

---

## 5. ROLES Y PERMISOS IMPLEMENTADOS

| Funcionalidad | Admin | Manager | Operador | Recepcionista ⭐ | Visualizador |
|--------------|-------|---------|----------|------------------|--------------|
| Ver Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ver Inventario | ✅ | ✅ | ✅ | ✅ | ✅ |
| Crear/Editar Productos | ✅ | ✅ | ❌ | ❌ | ❌ |
| Crear Traspasos | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Validar Recepciones** ⭐ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Gestionar Proveedores | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ver Reportes | ✅ | ✅ | ❌ | ❌ | ✅ |
| Configuración Sistema | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 6. CARACTERÍSTICAS DESTACADAS ⭐

### Nuevas Implementaciones
1. **Rol de Recepcionista:** Control de calidad en recepciones
2. **Validación de Traspasos:** Flujo completo con aprobación
3. **Alertas en Tiempo Real:** Notificaciones para recepcionistas
4. **Trazabilidad Completa:** Registro de operador en cada acción
5. **Gestión de Discrepancias:** Registro de diferencias en cantidades
6. **Exportación de Datos:** CSV, PDF, Google Sheets

### Seguridad
- Autenticación obligatoria
- Permisos por rol
- Validaciones de formularios
- Confirmaciones para acciones destructivas

### Usabilidad
- Diseño Desktop First (ERP profesional)
- Filtros multivariables
- Indicadores visuales de stock crítico
- Formularios con validación en tiempo real
- Mensajes de confirmación (toast notifications)

---

## 7. TECNOLOGÍAS UTILIZADAS

- **Frontend:** React 18 + TypeScript
- **Routing:** React Router 7
- **Estilos:** Tailwind CSS v4
- **Componentes UI:** Radix UI
- **Gráficos:** Recharts
- **Notificaciones:** Sonner
- **Gestión de Estado:** Context API

---

## NOTAS FINALES

Este proyecto implementa el **Módulo de Stock y Control Inventario** del sistema ERP "La Escuela". 

Todas las tablas marcadas con ⭐ son **NUEVAS** para este módulo.

El sistema está diseñado con arquitectura modular, permitiendo la futura integración de otros módulos:
- Financiero-Contable
- Ventas y Marketing
- Producción
- Compras y Logística
- Recursos Humanos

El módulo actual está **100% funcional** y listo para demostración.
