# Sistema de Stock Multi-empresa — Brief de desarrollo para Claude

> **Cómo usar este documento:** pegalo (o referencialo) al inicio de cada conversación con Claude. Contiene el contexto del proyecto, las decisiones ya tomadas, el modelo de datos, las reglas de negocio y el plan por fases. Al final hay **prompts listos para copiar** para avanzar fase por fase.
> Si una decisión cambia, actualizá este archivo primero y después pedile a Claude que trabaje.

---

## 1. Objetivo

Construir un **sistema de stock y ventas SaaS multi-empresa (multi-tenant)**: una sola aplicación y una sola base de datos donde cada empresa ve únicamente sus propios datos.

- **Primer cliente (foco actual):** una **repostería**.
- **Próximos clientes:** un **kiosco** y una **tienda de repuestos**.
- **Alcance explícitamente fuera:** sedes/sucursales múltiples y **traspasos entre depósitos**. Cada empresa tiene **un único punto de stock**.
- El sistema debe ser **genérico** en su núcleo (productos, compras, ventas, stock, caja) y permitir **particularidades por rubro** mediante configuración, no mediante forks del código.

---

## 2. Análisis del proyecto actual (punto de partida)

Repositorio: `PracticasProfesionalizantesIiSitemaDeStock` (generado originalmente con Figma Make, entrega académica "ERP La Escuela").

### Stack actual
| Capa | Tecnología |
|---|---|
| Build | Vite 6 + `@vitejs/plugin-react`, pnpm |
| UI | React 18 + TypeScript, Tailwind CSS 4, componentes shadcn/ui (Radix) en `src/app/components/ui` |
| Ruteo | `react-router` 7 (`createBrowserRouter`) |
| Gráficos | Recharts · Iconos: lucide-react · Toasts: sonner · Forms: react-hook-form |
| Datos | **SQLite en el navegador** (`sql.js` + WASM) persistido en **IndexedDB** (`src/database/db.ts`) |
| Estado | Un único `AppContext.tsx` que carga todas las tablas en memoria |

También están instalados `@mui/material`, `@emotion/*`, `react-slick`, `react-dnd`, `canvas-confetti`, etc. (plantilla de Figma Make) → **verificar uso y eliminar los que no se usen**.

### Lo que sirve y se reutiliza
- Layout con sidebar colapsable (`Layout.tsx`) y librería de componentes shadcn/ui.
- Pantallas como referencia visual/funcional: `Dashboard`, `Inventory` (ABM productos), `Suppliers` (ABM proveedores), `GoodsReceipt` (ingreso de mercadería → base de **Compras**), `InventoryAdjustment` (**Ajuste de inventario**), `StockView`, `AlertsQueries`, `Reports`, `Settings`, `Login`, `CreatePassword`.
- Patrón de repositorios (`src/database/repositories/*`) como idea de capa de acceso a datos.

### Lo que hay que cambiar / descartar
| Problema actual | Decisión |
|---|---|
| Base de datos local en el navegador (no compartida, se pierde al limpiar caché) | Migrar a **Supabase (Postgres)** |
| Login falso: contraseñas en texto plano, rol elegido en un dropdown | **Supabase Auth** + roles guardados en BD |
| No existe el concepto de empresa | Agregar `empresa_id` en todas las tablas de negocio + **RLS** |
| Stock guardado como número en `products.currentStock`, modificado desde el front | Stock calculado/actualizado **solo en la BD** vía funciones transaccionales y movimientos |
| `warehouse` como texto libre, `transfers`, `Reception.tsx`, rol `receptionist` | **Eliminar** (no hay sedes ni traspasos) |
| Movimientos y compras guardan nombres duplicados (`productName`, `supplierName`) sin FK | Relaciones con FK reales |
| Compras de un solo producto por registro | Cabecera + ítems (`compras` / `compra_items`) |
| No existen Ventas, Caja, Usuarios, Clientes | Crear |
| Datos semilla de ferretería | Reemplazar por datos de una repostería |
| Módulos ERP de mentira en el sidebar | Reemplazar por el menú definido en §4 |

### Supabase
- Proyecto: **`bgrbbpviaoozrpbpoywu`** ("StockStars"), región `us-east-1`, Postgres 17, estado activo.
- **Estado actual: vacío** (sin tablas en `public`, sin migraciones). Se arranca de cero.

---

## 3. Decisiones de arquitectura

1. **Frontend:** se mantiene Vite + React + TS + Tailwind + shadcn/ui. Se agregan:
   - `@supabase/supabase-js` (cliente).
   - `@tanstack/react-query` para fetch/cache/invalidación (reemplaza el `AppContext` gigante).
   - `zod` + `react-hook-form` para validación de formularios.
2. **Backend:** Supabase (Postgres + Auth + RLS). Sin servidor propio en las primeras fases.
3. **Multi-tenant:** columna `empresa_id uuid not null` en cada tabla de negocio + **Row Level Security** en todas las tablas. Un usuario puede pertenecer a una o más empresas (`empresa_usuarios`); la empresa activa se elige al iniciar sesión.
4. **Operaciones críticas en la BD:** ventas, compras, ajustes, anulaciones y apertura/cierre de caja se hacen con **funciones Postgres (RPC)** que corren en una transacción: validan, insertan cabecera + ítems, generan movimientos de stock y de caja. El front **nunca** modifica stock directamente.
5. **Stock como libro mayor:** cada cambio genera una fila en `movimientos_stock`. `productos.stock_actual` es un valor cacheado que solo actualiza un trigger/función. Así hay trazabilidad completa y se puede recalcular.
6. **No se borra nada operativo:** ventas/compras se **anulan** (generan movimientos inversos); productos/proveedores se **desactivan** (`activo = false`).
7. **Particularidades por rubro** vía:
   - `empresas.rubro` (`reposteria | kiosco | repuestos | general`).
   - `empresas.config jsonb` con flags (ej. `usa_vencimientos`, `usa_codigo_barras`, `permite_stock_negativo`, `usa_recetas`).
   - `productos.atributos jsonb` para campos propios del rubro (ej. repuestos: `marca`, `codigo_fabricante`, `compatibilidad`).
   - El front muestra/oculta campos según la config. **Nada de `if (empresa === 'reposteria')` hardcodeado por nombre.**
8. **Migraciones:** todo cambio de esquema como migración SQL versionada (vía MCP de Supabase `apply_migration` o Supabase CLI en `supabase/migrations/`). Nunca cambios manuales sin registrar.
9. **Convenciones:** BD en **español, snake_case**; tipos TS generados desde Supabase (`generate_typescript_types`). UI en español (es-AR), moneda ARS, zona horaria `America/Argentina/Buenos_Aires`.

---

## 4. Módulos y menú (rol Administrador)

```
Dashboard
Gestión
  ├─ Productos
  ├─ Ventas
  └─ Compras
Stock
  ├─ Ajuste de inventario
  └─ Movimientos
Entidades
  └─ Proveedores          (+ Clientes, opcional fase 2)
Finanzas
  ├─ Caja
  └─ Reportes
Sistema
  ├─ Usuarios
  └─ Configuración
```

### Detalle funcional

**Dashboard**
- KPIs del día: ventas ($ y cantidad), ticket promedio, estado de caja (abierta/cerrada, saldo), productos bajo stock mínimo, productos próximos a vencer (si `usa_vencimientos`).
- Gráficos: ventas últimos 7/30 días, top 10 productos vendidos, ventas por medio de pago.
- Accesos rápidos: Nueva venta, Nueva compra, Abrir/Cerrar caja.

**Productos**
- ABM con: código interno, código de barras (opcional), nombre, descripción, categoría, unidad de medida (unidad, kg, g, l, ml, docena, porción), precio de costo, precio de venta, % margen (calculado), stock actual (solo lectura), stock mínimo, activo, imagen (opcional, Supabase Storage), atributos del rubro.
- Filtros por categoría, estado, bajo stock. Búsqueda por nombre/código. Exportar CSV.
- ABM de categorías (simple, desde un modal o desde Configuración).
- Repostería: marcar si el producto es **insumo** (harina, azúcar), **producto de reventa** o **elaborado** (torta). Se usa para filtrar en compras/ventas.

**Ventas**
- Pantalla tipo POS: buscar producto (nombre o lector de código de barras), agregar al carrito, cantidad (permite decimales si la unidad lo permite), descuento por ítem o total, medio de pago (efectivo, débito, crédito, transferencia, mixto), cliente opcional.
- Requiere **caja abierta** del usuario.
- Al confirmar → RPC `registrar_venta` (descuenta stock, crea movimientos, registra ingreso en caja).
- Listado/historial con filtros por fecha, usuario, medio de pago. Ver detalle. **Anular** (con motivo, solo admin/encargado) → RPC `anular_venta`.
- Comprobante imprimible simple (ticket no fiscal). Facturación electrónica AFIP/ARCA queda **fuera de alcance**.

**Compras**
- Alta: proveedor, fecha, n° de comprobante, ítems (producto, cantidad, costo unitario), total, observaciones, ¿se paga desde caja? (sí/no).
- Al confirmar → RPC `registrar_compra` (suma stock, actualiza `precio_costo` del producto, opcional egreso de caja).
- Si `usa_vencimientos`: cada ítem puede llevar fecha de vencimiento / lote.
- Listado, detalle, anulación.

**Ajuste de inventario**
- Ajuste individual o **conteo físico** (cargar cantidad contada → el sistema calcula la diferencia).
- Motivo obligatorio: rotura, vencimiento, merma, consumo interno, producción, error de carga, conteo físico, otro.
- RPC `registrar_ajuste`. Solo admin/encargado.

**Movimientos**
- Vista de solo lectura del libro `movimientos_stock`: fecha, producto, tipo (venta, compra, ajuste, anulación, producción), cantidad (+/-), stock resultante, usuario, referencia (link a la venta/compra/ajuste).
- Filtros por producto, tipo, rango de fechas, usuario. Exportar CSV.

**Proveedores**
- ABM: razón social, nombre de fantasía, CUIT, condición IVA, contacto, teléfono, email, dirección, condición de pago, alias/CBU, observaciones, activo.
- Ficha con historial de compras al proveedor.

**Caja**
- Apertura con monto inicial; un usuario no puede tener dos cajas abiertas.
- Movimientos automáticos (ventas, compras pagadas en efectivo) y manuales (ingreso/egreso con concepto: retiro, pago de servicio, etc.).
- Cierre: el sistema muestra el **esperado por medio de pago**, el usuario carga lo **contado** en efectivo y se registra la **diferencia**.
- Historial de sesiones de caja con detalle.

**Reportes**
- Ventas por período / por producto / por categoría / por medio de pago / por usuario.
- Compras por período y por proveedor.
- Valorización de stock (stock × costo y × precio de venta).
- Productos bajo stock mínimo y sugerencia de compra.
- Productos próximos a vencer (si aplica).
- Rentabilidad estimada (venta − costo).
- Exportar CSV/PDF. Las consultas pesadas se resuelven con **vistas o funciones SQL**, no en el front.

**Usuarios**
- Invitar usuario por email (Supabase Auth), asignar rol, activar/desactivar. Solo admin.
- Cambio de contraseña y recuperación (reutilizar `CreatePassword.tsx`).

**Configuración**
- Datos de la empresa (nombre, CUIT, dirección, logo, rubro).
- Flags del rubro (§3.7), medios de pago habilitados, unidades de medida, categorías, motivos de ajuste, formato de ticket.

---

## 5. Roles y permisos

| Rol | Descripción | Permisos |
|---|---|---|
| `superadmin` | Dueño de la plataforma (vos) | Crea empresas; ve todo. Fuera del menú normal. |
| `admin` | Dueño de la empresa | Todo dentro de su empresa |
| `encargado` | Supervisor | Todo menos Usuarios y Configuración |
| `vendedor` | Cajero/vendedor | Dashboard (limitado), Ventas, su Caja, consulta de Productos |
| `consulta` | Solo lectura | Dashboard, Productos, Movimientos, Reportes |

Los permisos se validan **en dos lugares**: en el front (ocultar menú/botones) y en la **BD (RLS + chequeo de rol dentro de cada RPC)**. El front nunca es la única barrera.

---

## 6. Modelo de datos propuesto (Supabase / Postgres)

> Todas las tablas de negocio llevan: `id uuid pk default gen_random_uuid()`, `empresa_id uuid not null references empresas`, `created_at timestamptz default now()`, `created_by uuid references auth.users`. Se omiten abajo para abreviar. Montos en `numeric(14,2)`, cantidades en `numeric(14,3)`.

**Plataforma / acceso**
- `empresas` — `id`, `nombre`, `cuit`, `rubro`, `config jsonb`, `logo_url`, `activa`, `created_at`.
- `perfiles` — `id (= auth.users.id)`, `nombre`, `email`, `superadmin bool`.
- `empresa_usuarios` — `empresa_id`, `usuario_id`, `rol`, `activo`. PK (`empresa_id`, `usuario_id`).

**Catálogo**
- `categorias` — `nombre`, `activa`.
- `unidades_medida` — `codigo`, `nombre`, `permite_decimales` (global o por empresa).
- `productos` — `codigo`, `codigo_barras`, `nombre`, `descripcion`, `categoria_id`, `unidad_id`, `tipo` (`insumo|reventa|elaborado`), `precio_costo`, `precio_venta`, `stock_actual` (cacheado), `stock_minimo`, `controla_stock bool`, `atributos jsonb`, `imagen_url`, `activo`. Únicos: (`empresa_id`, `codigo`), (`empresa_id`, `codigo_barras`).

**Entidades**
- `proveedores` — campos de §4.
- `clientes` — (fase 2) `nombre`, `documento`, `telefono`, `email`, `observaciones`.

**Operaciones**
- `ventas` — `numero` (correlativo por empresa), `fecha`, `cliente_id`, `usuario_id`, `caja_sesion_id`, `subtotal`, `descuento`, `total`, `estado` (`confirmada|anulada`), `motivo_anulacion`, `anulada_por`, `anulada_at`.
- `venta_items` — `venta_id`, `producto_id`, `cantidad`, `precio_unitario`, `costo_unitario` (snapshot para rentabilidad), `descuento`, `subtotal`.
- `venta_pagos` — `venta_id`, `medio_pago`, `monto`.
- `compras` — `numero`, `fecha`, `proveedor_id`, `nro_comprobante`, `total`, `pagada_desde_caja bool`, `estado`, `observaciones`.
- `compra_items` — `compra_id`, `producto_id`, `cantidad`, `costo_unitario`, `subtotal`, `lote`, `vencimiento`.
- `ajustes` — `fecha`, `motivo`, `observaciones`, `usuario_id`.
- `ajuste_items` — `ajuste_id`, `producto_id`, `stock_anterior`, `cantidad_contada` (nullable), `diferencia`.

**Stock**
- `movimientos_stock` — `producto_id`, `fecha`, `tipo` (`venta|compra|ajuste|anulacion_venta|anulacion_compra|produccion|inicial`), `cantidad` (con signo), `stock_resultante`, `referencia_tipo`, `referencia_id`, `usuario_id`, `observaciones`. **Solo insert, nunca update/delete.**
- `lotes` — (fase 2, si `usa_vencimientos`) `producto_id`, `lote`, `vencimiento`, `cantidad_disponible`.

**Caja**
- `caja_sesiones` — `usuario_id`, `apertura_at`, `monto_inicial`, `cierre_at`, `efectivo_esperado`, `efectivo_contado`, `diferencia`, `estado` (`abierta|cerrada`), `observaciones`. Índice único parcial: una sesión abierta por usuario.
- `caja_movimientos` — `caja_sesion_id`, `tipo` (`ingreso|egreso`), `origen` (`venta|compra|manual|apertura|anulacion`), `medio_pago`, `monto`, `concepto`, `referencia_id`.

**Auditoría**
- `auditoria` — `tabla`, `registro_id`, `accion`, `datos_antes jsonb`, `datos_despues jsonb`, `usuario_id`, `fecha` (por trigger en tablas sensibles: productos, precios, usuarios).

**Repostería — fase 3 (opcional)**
- `recetas` / `receta_items` — un producto `elaborado` consume N insumos. RPC `registrar_produccion(producto, cantidad)` descuenta insumos y suma el elaborado.

### Funciones (RPC) principales
| Función | Qué hace |
|---|---|
| `registrar_venta(payload jsonb)` | Valida caja abierta, stock (según config), crea venta + ítems + pagos, movimientos de stock y de caja. Devuelve la venta. |
| `anular_venta(venta_id, motivo)` | Valida rol, revierte stock y caja con movimientos inversos. |
| `registrar_compra(payload jsonb)` | Crea compra + ítems, suma stock, actualiza `precio_costo`, egreso de caja opcional. |
| `anular_compra(compra_id, motivo)` | Revierte. Falla si dejaría stock negativo (salvo config). |
| `registrar_ajuste(payload jsonb)` | Crea ajuste + ítems + movimientos. |
| `abrir_caja(monto_inicial)` / `cerrar_caja(sesion_id, efectivo_contado, obs)` / `movimiento_caja_manual(...)` | Gestión de caja. |
| `crear_empresa(...)` | Solo superadmin: crea empresa + admin inicial + datos base (unidades, categorías, medios de pago). |

### Helpers de RLS
- `es_miembro(empresa uuid) returns bool` y `tiene_rol(empresa uuid, roles text[]) returns bool`, ambas `security definer`, `stable`, con `set search_path = ''`.
- Política tipo en cada tabla: `using (es_miembro(empresa_id))` para select; insert/update restringido por rol. Las tablas de operaciones (`ventas`, `movimientos_stock`, etc.) **no** permiten insert directo: solo vía RPC.

---

## 7. Reglas de negocio

1. Todo dato pertenece a una empresa; ningún usuario puede leer o escribir datos de otra (garantizado por RLS, probado con tests).
2. El stock solo cambia mediante movimientos generados por RPC. `stock_actual` = suma de movimientos del producto.
3. Por defecto **no se permite stock negativo**; configurable por empresa (`permite_stock_negativo`) — útil en kiosco.
4. Productos con `controla_stock = false` (ej. servicios, encargos a pedido) no generan movimientos.
5. Una venta requiere una sesión de caja abierta del usuario que vende.
6. La venta guarda **snapshot** de precio y costo al momento de vender (cambios de precio posteriores no la alteran).
7. Una compra actualiza el `precio_costo` del producto (último costo; costo promedio ponderado como opción futura en config).
8. Las anulaciones requieren motivo y rol `admin` o `encargado`; se registran quién y cuándo.
9. Numeración correlativa por empresa para ventas y compras (secuencia por empresa, sin huecos por concurrencia → usar tabla de contadores con `for update`).
10. Fechas guardadas en `timestamptz` (UTC); mostradas en hora de Buenos Aires.
11. Montos en `numeric`, nunca `float`.

---

## 8. Estructura de frontend propuesta

```
src/
  lib/
    supabase.ts            # createClient con VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
    database.types.ts      # generado desde Supabase
    format.ts              # moneda ARS, fechas es-AR
  auth/
    AuthProvider.tsx       # sesión, usuario, empresa activa, rol
    RequireRole.tsx
  features/
    dashboard/
    productos/   (api.ts, hooks.ts, ProductosPage.tsx, ProductoForm.tsx, schema.ts)
    ventas/      (POS, historial, detalle)
    compras/
    stock/       (ajustes, movimientos)
    proveedores/
    caja/
    reportes/
    usuarios/
    configuracion/
  components/
    layout/      (Sidebar con el menú §4, Topbar con selector de empresa)
    ui/          (shadcn existente)
  routes.tsx
supabase/
  migrations/    # SQL versionado
  seed.sql       # datos de ejemplo repostería
```

Pautas: componentes chicos, un archivo por componente; lógica de datos en `api.ts`/`hooks.ts` de cada feature con React Query; nunca usar la `service_role` key en el front; variables en `.env.local` (no commitear).

---

## 9. Plan por fases

| Fase | Entregable | Criterio de "listo" |
|---|---|---|
| **0. Limpieza** | Eliminar sql.js, IndexedDB, traspasos, recepción, rol recepcionista, módulos ERP falsos y dependencias sin uso. Instalar supabase-js, react-query, zod. Nuevo menú vacío. | `pnpm dev` y `pnpm build` funcionan; el menú es el de §4. |
| **1. Base de datos núcleo** | Migraciones: empresas, perfiles, empresa_usuarios, helpers RLS, categorías, unidades, productos, proveedores. Seed de repostería. | `get_advisors` sin alertas de seguridad; RLS activo en todas las tablas. |
| **2. Auth y multi-empresa** | Login real, recuperación de contraseña, empresa activa, guard de rutas por rol. | Dos usuarios de empresas distintas no ven datos cruzados. |
| **3. Productos y Proveedores** | ABM completos contra Supabase. | CRUD + filtros + export CSV. |
| **4. Stock** | `movimientos_stock`, RPC de ajuste, pantallas Ajuste y Movimientos, stock inicial. | Stock cuadra con la suma de movimientos. |
| **5. Compras** | Tablas + RPC + pantallas. | Una compra suma stock y actualiza costo. |
| **6. Caja** | Sesiones, movimientos manuales, apertura/cierre. | Cierre muestra esperado vs contado. |
| **7. Ventas (POS)** | Tablas + RPC + POS + historial + anulación + ticket. | Venta descuenta stock e impacta en caja; anulación revierte ambos. |
| **8. Dashboard y Reportes** | Vistas SQL + gráficos. | KPIs coinciden con los datos. |
| **9. Usuarios y Configuración** | Invitación, roles, flags de rubro. | Admin gestiona su equipo sin intervención técnica. |
| **10. Repostería+** | Vencimientos/lotes, recetas y producción. | Producir una torta descuenta insumos. |
| **11. Otros rubros** | Config kiosco (código de barras, venta rápida, stock negativo) y repuestos (marca, código fabricante, compatibilidad). | Alta de empresa nueva solo con configuración. |

Trabajar **una fase por conversación** (o por rama de git) y cerrar cada una con commit.

---

## 10. Reglas para Claude al trabajar en este proyecto

- Antes de cambiar el esquema, **inspeccionar las tablas existentes** (`list_tables`) y las migraciones aplicadas.
- Todo cambio de BD = **migración nueva** con nombre descriptivo (`0003_productos.sql`). No editar migraciones ya aplicadas.
- **RLS habilitado en cada tabla nueva**, con políticas explícitas. Correr `get_advisors` (security y performance) después de cada migración.
- Funciones `security definer` siempre con `set search_path = ''` y nombres calificados (`public.tabla`).
- Nada de lógica de stock/caja en el front: solo llamar RPCs.
- Regenerar `database.types.ts` después de cada migración.
- Mantener UI en español, componentes shadcn existentes, Tailwind; no agregar otra librería de UI.
- Proponer el plan antes de escribir mucho código; implementar en pasos chicos y verificables.
- No inventar requisitos: si algo no está en este documento, **preguntar**.
- Al terminar una fase: resumir qué se hizo, qué quedó pendiente y actualizar la sección 12 de este documento.

---

## 11. Preguntas abiertas (definir con el cliente)

1. ¿La repostería vende solo en mostrador, o también toma **encargos/pedidos** con seña y fecha de entrega? (Podría ser un módulo "Pedidos".)
2. ¿Necesitan controlar **producción con recetas** (descontar insumos al hacer una torta) o alcanza con cargar el stock del producto terminado por ajuste?
3. ¿Manejan **vencimientos** en insumos o productos terminados?
4. ¿Cuántas **cajas/puestos** venden al mismo tiempo?
5. ¿Necesitan **facturación electrónica** (ARCA/AFIP) o alcanza con ticket no fiscal?
6. ¿Venden por peso (kg/g) o por porción además de por unidad?
7. ¿Se registran **clientes** (cuenta corriente, fiados) o solo consumidor final?
8. ¿Lista de precios única o varias (minorista/mayorista)?
9. ¿Se usará en celular/tablet además de PC? (Impacta en el diseño del POS.)
10. ¿Dónde se va a desplegar el front? (Vercel sugerido.)

---

## 12. Bitácora de avance

| Fecha | Fase | Estado | Notas |
|---|---|---|---|
| 2026-10-03 | Análisis | ✅ | Proyecto Supabase `bgrbbpviaoozrpbpoywu` vacío. Repo con SQLite local a migrar. |
| 2026-10-03 | 1. Base de datos núcleo | ✅ | Migraciones `0001`–`0003` en `supabase/migrations/`: empresas, perfiles (trigger desde `auth.users`), empresa_usuarios, helpers RLS en schema `private` (`es_superadmin`, `es_miembro`, `tiene_rol`), unidades_medida (global), categorias, productos, proveedores, movimientos_stock (inmutable; trigger que actualiza `stock_actual` con bloqueo de fila y valida stock negativo según config). RPC: `crear_empresa`, `asignar_usuario_empresa`, `registrar_stock_inicial`. `stock_actual` no se puede escribir desde la API (column grants). Pruebas de aislamiento entre empresas OK. |
| 2026-10-03 | Seed | ✅ | `supabase/seed.sql`: empresa ficticia "Dulce Horno" (repostería), 8 categorías, 21 productos, 4 proveedores, stock inicial. Usuarios demo `admin@dulcehorno.test` y `vendedor@dulcehorno.test` (contraseña `Demo1234`, **cambiar o borrar antes de producción**). |
| 2026-10-03 | 0. Limpieza + 2. Auth (base) | ✅ | Eliminado SQLite/sql.js, traspasos, recepción, contexto monolítico y dependencias sin uso (MUI, emotion, etc.). Agregado supabase-js, React Query, zod, TypeScript (`pnpm typecheck`). Login real, recuperar/nueva contraseña, empresa activa con selector, menú por rol (`src/auth/permisos.ts`), Dashboard con datos reales. Resto del menú: "En construcción". `pnpm typecheck` y `pnpm build` OK. |

| 2026-10-03 | 3. Productos y Proveedores | ✅ | ABM de productos (filtros por texto/categoría/tipo/estado/bajo mínimo, paginación, alta con stock inicial vía RPC, margen ↔ precio de venta, atributos por rubro, activar/desactivar, export CSV), gestión de categorías (alta, renombrar, activar/desactivar) y ABM de proveedores (validación de CUIT con dígito verificador, email, teléfono, CBU/alias; export CSV). Migración `0004`: no se puede desactivar el control de stock con stock ≠ 0 ni pasar a una unidad sin decimales con stock fraccionado. Probado con datos reales (SQL como admin/vendedor) y la UI con Playwright contra respuestas simuladas. |
| 2026-10-03 | 4. Stock | ✅ | Migración `0005`: tabla `contadores` + `private.siguiente_numero()` (numeración correlativa por empresa sin huecos, reutilizable para ventas/compras), `ajustes` + `ajuste_items` (inmutables), enum `motivo_ajuste`, RPC `registrar_ajuste` (modo diferencia o conteo físico; la diferencia del conteo se calcula en la BD con el stock bloqueado; valida rol, decimales, stock negativo, repetidos, motivo "otro" con observaciones). Pantallas: Ajuste de inventario (entrada/salida o conteo físico, carga por categoría completa, confirmación con resumen, historial con detalle) y Movimientos (filtros por producto/tipo/fechas en la URL, paginación en servidor, export CSV hasta 5000, kardex por producto desde Productos → "Ver movimientos"). |
| 2026-10-03 | 5. Compras | ✅ | Migraciones `0006`–`0008`: `compras` + `compra_items` (lote y vencimiento por ítem, costo anterior guardado), RPC `registrar_compra` (suma stock, actualiza el último costo si se elige, numeración correlativa, impide cargar dos veces el mismo comprobante del mismo proveedor, valida decimales/fecha futura/proveedor activo) y `anular_compra` (motivo obligatorio; revierte exactamente los movimientos que generó; los costos no se revierten). Las compras solo las ven admin/encargado/consulta. Pantallas: listado con filtros por proveedor/estado/fechas, export CSV, detalle con variación de costos y anulación; nueva compra con costo precargado, aviso de variaciones ≥30 %, lote/vencimiento si la empresa usa vencimientos. Proveedores → "Ver compras". |
| 2026-10-03 | 6. Caja | ✅ | Migración `0009`: `caja_sesiones` (una abierta por usuario, numeración correlativa) y `caja_movimientos` (inmutables), enums `medio_pago`, `tipo_mov_caja`, `origen_mov_caja`. RPC `abrir_caja`, `movimiento_caja_manual` (no permite retirar más efectivo del que hay) y `cerrar_caja` (calcula efectivo esperado = inicial + ingresos − egresos en efectivo; si hay diferencia exige observaciones). El vendedor solo ve sus cajas; admin/encargado ven y pueden cerrar todas. Compras: opción "Pagada en efectivo desde mi caja" (trigger que registra el egreso; al anular la compra devuelve el efectivo a la caja abierta de quien anula). Pantallas: Mi caja (apertura, KPIs, totales por medio, movimientos, ingreso/egreso, cierre con arqueo sobrante/faltante) e Historial con detalle. Arreglo: los montos escritos como "10.000" ahora se interpretan como diez mil (formato es-AR). |
| 2026-10-03 | 7. Ventas (POS) | ✅ | Migración `0010`: `ventas`, `venta_items` (con snapshot de precio y costo) y `venta_pagos` (inmutables). RPC `registrar_venta`: exige caja abierta, descuenta stock (respeta `permite_stock_negativo`), solo admin/encargado pueden cambiar precios, descuento global, pagos combinados (solo el efectivo da vuelto; tarjeta/transferencia no pueden superar el total), registra cada medio como ingreso en la caja. `anular_venta` (admin/encargado, motivo obligatorio): devuelve stock y registra el egreso por el mismo medio en la caja abierta de quien anula. El vendedor solo ve sus ventas. Pantallas: Punto de venta (buscador compatible con lector de códigos, Enter agrega; grilla por categoría; carrito con +/−, precio editable según rol, aviso de stock; descuento en % o $; F2 cobra; cobro con sugerencias de billetes, pago combinado, vuelto; ticket imprimible 80 mm) e Historial (filtro por fechas/estado, detalle, reimpresión, anulación). |
| 2026-10-03 | 8. Dashboard y Reportes | ✅ | Migración `0011`: funciones `reporte_ventas_resumen`, `_por_dia` (completa días sin ventas), `_por_medio`, `_por_producto` (con costo histórico y ganancia), `_por_usuario`, `reporte_compras_por_proveedor` y `reporte_reposicion` (sugerido = max(mínimo, vendido en N días) − stock). Son `security invoker`: respetan RLS (el vendedor ve solo sus ventas). Dashboard: KPIs del día (ventas, ticket promedio, ganancia bruta para admin/encargado, efectivo en mi caja), gráfico de 14 días con tooltip y vista de tabla, cobrado por medio, más vendidos 30 días, bajo mínimo. Reportes: períodos rápidos (hoy, ayer, 7/30 días, este mes, mes anterior) o personalizados; pestañas Ventas (KPIs, por día, medio, categoría, vendedor), Productos (ranking ordenable con ganancia y margen), Compras (por proveedor), Stock (valorizado por categoría y reposición sugerida). Todo exporta a CSV. Gráficos de una sola serie con color validado para modo claro/oscuro. |
| 2026-10-03 | 9. Usuarios y Configuración | ✅ | Migración `0012`: trigger que impide dejar una empresa sin administrador activo (cambio de rol, desactivación o baja) y validación de `empresas.config` en la BD (opciones booleanas, medios de pago válidos con efectivo obligatorio, CUIT `XX-XXXXXXXX-X`). Edge Function `invitar-usuario` (única pieza con la service_role key, del lado del servidor): verifica que quien llama sea admin activo de la empresa o superadmin; crea el usuario con contraseña temporal, lo invita por email o, si ya tiene cuenta, lo suma a la empresa. Pantallas: Usuarios (cambiar rol, activar/desactivar, quitar de la empresa, alta con contraseña generada y botón copiar), Configuración (datos de la empresa con CUIT validado; opciones: vender sin stock, código de barras, vencimientos, medios de pago) y Mi cuenta para todos los roles (nombre y cambio de contraseña; acceso desde el usuario en el menú lateral). |

**Decisiones tomadas en la implementación**
- Unidades de medida globales (no por empresa).
- `crear_empresa` la puede ejecutar el superadmin o una conexión sin JWT (SQL editor / service_role). Para hacer superadmin a alguien: `update perfiles set superadmin = true where email = '...'`.
- Productos y proveedores no se borran: se desactivan (`activo = false`). No hay policy de DELETE.
- Las FKs entre tablas de negocio son compuestas `(empresa_id, id)` para impedir referencias cruzadas entre empresas.

- Margen = (venta − costo) / costo (markup sobre costo).
- Vendedor y consulta ven productos sin columnas de costo/margen, pero **la API todavía les devuelve `precio_costo`** (RLS es por fila, no por columna). Si hace falta ocultarlo de verdad: exponer una vista sin costos para esos roles (pendiente, evaluar en Fase 9).
- Atributos por rubro definidos en `src/lib/rubros.ts` (repostería: alérgenos, conservación; repuestos: marca, código de fabricante, compatibilidad; kiosco: marca).
- CSV con separador `;` y BOM para que Excel en español lo abra bien.

- Un conteo físico registra también los productos que coinciden (diferencia 0, sin movimiento): sirve como constancia de verificación.
- Fechas de filtros interpretadas en hora de Buenos Aires (UTC−3).

- Costo de producto = último costo de compra (no promedio ponderado). `compras.pagada_desde_caja` ya existe; el egreso de caja se conecta en la Fase 6.
- El lote/vencimiento queda registrado en `compra_items`; el control de stock por lote (FIFO, alertas de vencimiento) es Fase 10.

- El arqueo es solo de efectivo; los demás medios (débito, crédito, transferencia, billetera) se informan como totales.
- Números: "10.000" = 10000, "10,5" = 10.5, "10.5" = 10.5 (`parseNumero` en `src/lib/validaciones.ts`).

- En el POS solo aparecen productos activos, que no son insumos y tienen precio de venta > 0.
- El ticket es un comprobante no fiscal (se abre en una ventana y usa la impresora configurada; requiere permitir ventanas emergentes).

- Ganancia bruta = total vendido − costo de lo vendido (costo guardado en cada ítem al momento de la venta). El importe por producto no descuenta el descuento global de la venta.

- El alta de usuarios se hace con la Edge Function `invitar-usuario` (requiere JWT). Por defecto se crea con **contraseña temporal** porque el SMTP incluido en Supabase tiene un límite muy bajo de emails por hora; para usar invitaciones por email en producción conviene configurar un SMTP propio (Authentication → Emails → SMTP).
- Quitar a alguien de la empresa no borra su cuenta (puede pertenecer a otras empresas); solo borra la membresía. Nadie puede quitarse a sí mismo.
- El rubro de la empresa no se cambia desde Configuración (lo define el superadmin al crearla). La opción "Recetas y producción" queda deshabilitada hasta la Fase 10.
- `precio_costo` visible por API para vendedor/consulta: se mantiene como limitación conocida (no es dato crítico en este negocio); si se requiere, resolver con una vista sin costos.

**Pendiente / próximo:** Fase 10 (Repostería+: vencimientos por lote y recetas/producción). Recomendado: activar *Leaked password protection* en Supabase → Authentication (aviso del advisor de seguridad). Configurar en Supabase → Authentication → URL Configuration la *Site URL* y agregar `http://localhost:5173/nueva-password` a *Redirect URLs* para que funcionen la recuperación de contraseña y las invitaciones.

---

## 13. Prompts listos para copiar

**Arranque de cada sesión**
```
Lee PLAN_DESARROLLO_CLAUDE.md en la raíz del repo. Es el contexto y las decisiones del
proyecto. Vamos a trabajar la Fase N: <nombre>. Antes de escribir código, decime qué
archivos/tablas vas a tocar y en qué pasos lo vas a hacer.
```

**Fase 0 — Limpieza**
```
Fase 0. Eliminá del proyecto: sql.js, src/database (SQLite/IndexedDB), scripts/copy-wasm,
public/sql-wasm-browser.wasm, las páginas Transfers y Reception, el rol receptionist y el
selector de módulos ERP del Layout. Revisá qué dependencias de package.json no se usan
(MUI, emotion, react-slick, react-dnd, confetti, etc.) y quitalas. Instalá
@supabase/supabase-js, @tanstack/react-query y zod. Reemplazá el menú por el de la
sección 4 con páginas placeholder. Verificá que pnpm build pase.
```

**Fase 1 — Base de datos núcleo**
```
Fase 1. Usando el MCP de Supabase sobre el proyecto bgrbbpviaoozrpbpoywu, creá las
migraciones para: empresas, perfiles (con trigger al crear usuario en auth.users),
empresa_usuarios, funciones es_miembro/tiene_rol, categorias, unidades_medida, productos
y proveedores, todas con RLS según la sección 6. Después corré get_advisors y corregí lo
que marque. Por último generá los tipos TypeScript y un seed con una repostería de
ejemplo (≈20 productos entre insumos, reventa y elaborados, 4 proveedores).
```

**Fase 2 — Auth**
```
Fase 2. Implementá Supabase Auth en el front: login email/contraseña, recuperar y
cambiar contraseña (reutilizá el diseño de Login.tsx y CreatePassword.tsx), AuthProvider
con usuario, empresa activa y rol, selector de empresa si el usuario tiene varias, y
protección de rutas/menú por rol según la sección 5.
```

**Fases siguientes**
```
Fase N (<módulo>). Implementá el módulo según las secciones 4, 6 y 7: primero la
migración y las RPC con sus validaciones, luego probá las RPC con SQL (casos OK y casos
que deben fallar), después las pantallas. Al final actualizá la bitácora (sección 12).
```

**Revisión de seguridad (cada tanto)**
```
Hacé una revisión de seguridad multi-tenant: listá todas las tablas y sus políticas
RLS, verificá que ninguna permita leer/escribir datos de otra empresa, que las tablas de
operaciones no acepten insert directo y que las funciones security definer tengan
search_path fijo. Corré get_advisors y reportá.
```
