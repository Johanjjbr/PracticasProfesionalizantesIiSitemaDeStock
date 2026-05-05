# 🚀 Instrucciones de Navegación del Sistema

## Guía Rápida para Profesores/Evaluadores

---

## CÓMO ACCEDER AL SISTEMA

### Opción 1: Sistema en Vivo (Preview de Figma Make)
El sistema está corriendo actualmente en el preview de Figma Make.

**URL del Preview:** _[Insertar URL del preview]_

### Opción 2: Ejecutar Localmente
Si se entrega el código fuente:
```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

---

## CREDENCIALES DE PRUEBA

### Para Login:
- **Email:** Cualquier email válido (ej: admin@laescuela.com)
- **Contraseña:** Cualquier contraseña
- **Rol:** Seleccionar del dropdown

### Roles Disponibles:
1. **Administrador** → Acceso completo a todo
2. **Gerente** → Gestión de inventario, proveedores, reportes
3. **Operador** → Inventario y traspasos
4. **Recepcionista** ⭐ → Solo recepción de traspasos
5. **Visualizador** → Solo lectura

---

## FLUJO DE NAVEGACIÓN RECOMENDADO

### 1️⃣ PANTALLA DE LOGIN (`/login`)

**Qué probar:**
- [ ] Ingresar con email inválido (sin @) → Ver error
- [ ] Dejar campos vacíos → Ver error
- [ ] Seleccionar diferentes roles del dropdown
- [ ] Login exitoso → Redirige a dashboard

**Elementos a observar:**
- Logo y branding del sistema
- Validaciones visuales con iconos
- Selector de roles (5 opciones)
- Mensaje de ayuda en la parte inferior

---

### 2️⃣ DASHBOARD (`/dashboard`)

**Acceso:** Automático después del login con cualquier rol

**Qué observar:**
- [ ] 4 KPIs principales con iconos
- [ ] Lista de productos con stock crítico (badge rojo)
- [ ] Gráfico de torta: Distribución por categoría
- [ ] Gráfico de barras: Tipos de movimientos
- [ ] Tabla de movimientos recientes

**Productos con stock crítico:**
- Tornillo M8x20: 45/100 (CRÍTICO 🔴)
- Cable eléctrico 2.5mm: 15/50 (CRÍTICO 🔴)
- Válvula Check 1/2": 5/30 (CRÍTICO 🔴)

---

### 3️⃣ GESTIÓN DE INVENTARIO (`/inventory`)

**Acceso:** Click en "Inventario" en el sidebar (todos los roles)

#### A) Listado de Productos

**Qué probar:**
- [ ] Buscar por nombre: escribir "tornillo"
- [ ] Buscar por SKU: escribir "SKU-001"
- [ ] Filtrar por categoría: "Ferretería"
- [ ] Filtrar por almacén: "Almacén Central"
- [ ] Filtrar por stock: "Stock Crítico" → Ver solo productos en rojo
- [ ] Click en "Exportar" → Ver opciones CSV, PDF, Sheets

**Elementos a observar:**
- Tabla con 8 productos mock
- Badges rojos en productos bajo stock mínimo
- Botones de editar/eliminar (solo Admin/Manager)

#### B) Agregar Nuevo Producto

**Acceso:** Click en "Nuevo Producto" (solo Admin/Manager)

**Qué probar:**
- [ ] Dejar campos vacíos y click "Guardar" → Ver error
- [ ] Completar todos los campos
- [ ] Click "Guardar Producto" → Ver toast de confirmación
- [ ] Verificar que aparece en la tabla

**Datos de ejemplo:**
```
SKU: SKU-009
Nombre: Cable HDMI 2.0
Categoría: Electrónica
Almacén: Almacén Central
Stock Actual: 100
Stock Mínimo: 50
Precio Unitario: 15.50
```

#### C) Editar Producto

**Acceso:** Click en ✏️ en cualquier fila (solo Admin/Manager)

**Qué observar:**
- Modal con datos precargados
- SKU puede estar bloqueado (solo lectura)
- Fecha de última actualización
- Botón dice "Actualizar Producto"

---

### 4️⃣ TRASPASOS ENTRE ALMACENES (`/transfers`)

**Acceso:** Click en "Traspasos" en el sidebar (Admin, Manager, Operador)

#### A) Listado de Traspasos

**Qué observar:**
- [ ] Traspasos con diferentes estados:
  - 🔴 Pendiente de Recepción (2 traspasos)
  - ✅ Completado (1 traspaso)
- [ ] Ruta visualizada: Almacén Norte → Almacén Central
- [ ] Operador que creó cada traspaso
- [ ] Badge "Esperando Recepción" en traspasos pendientes

#### B) Crear Nuevo Traspaso (Stepper de 3 pasos)

**Acceso:** Click en "Nuevo Traspaso"

**PASO 1: Entrega**
- [ ] Seleccionar producto del dropdown
- [ ] Ver información del producto (categoría, stock, ubicación)
- [ ] Seleccionar almacén de origen
- [ ] Ingresar cantidad (validación: no puede exceder stock)
- [ ] Click "Siguiente"

**PASO 2: Tránsito**
- [ ] Seleccionar almacén de destino (validación: no puede ser igual al origen)
- [ ] Ver ruta visualizada con flecha
- [ ] Ver tiempo estimado de tránsito
- [ ] Click "Siguiente"

**PASO 3: Confirmación**
- [ ] Ver resumen completo del traspaso
- [ ] Verificar: producto, cantidades, ruta, operador
- [ ] Click "Crear Traspaso"
- [ ] Ver toast de confirmación
- [ ] Traspaso aparece en lista con estado "Pendiente de Recepción"

**Datos de ejemplo:**
```
Producto: Tuerca Hexagonal M8
Origen: Almacén Central
Destino: Almacén Norte
Cantidad: 50
```

---

### 5️⃣ RECEPCIÓN DE TRASPASOS (`/reception`) ⭐ NUEVA

**Acceso:** Click en "Recepción" en el sidebar (solo Admin y Recepcionista)

**IMPORTANTE:** Para ver esta pantalla correctamente:
1. Salir del sistema (logout)
2. Volver a login con rol **"Recepcionista"**
3. Ir a `/reception`

#### A) Dashboard de Recepción

**Qué observar:**
- [ ] 3 KPIs: Pendientes (2), Validados Hoy, Rechazados (0)
- [ ] Lista de traspasos pendientes con borde amarillo/naranja
- [ ] Campana con notificación en el header (🔔 con número)
- [ ] Almacén asignado mostrado en topbar

#### B) Validar Recepción

**Acceso:** Click en "✅ Validar Recepción" en un traspaso pendiente

**Qué probar:**
- [ ] Ver información del traspaso (producto, cantidad, origen, operador)
- [ ] Modificar "Cantidad Recibida" para que sea diferente a la enviada
- [ ] Ver alerta de discrepancia en amarillo ⚠️
- [ ] Agregar observaciones (campo de texto)
- [ ] Click "Confirmar Recepción"
- [ ] Ver toast de éxito
- [ ] Traspaso pasa a "Completado" y aparece en historial

**Escenario 1: Recepción exacta**
```
Cantidad enviada: 100
Cantidad recibida: 100
Observaciones: Recepción sin observaciones
```

**Escenario 2: Recepción con discrepancia**
```
Cantidad enviada: 100
Cantidad recibida: 95
Observaciones: 5 unidades llegaron dañadas, embalaje deficiente
```

#### C) Rechazar Traspaso

**Acceso:** Click en "❌ Rechazar" en un traspaso pendiente

**Qué probar:**
- [ ] Ver información del traspaso
- [ ] Intentar guardar sin escribir motivo → Error
- [ ] Escribir motivo del rechazo
- [ ] Click "Confirmar Rechazo"
- [ ] Ver toast de error/warning
- [ ] Traspaso pasa a estado "Rechazado"

**Motivos de ejemplo:**
```
- Productos no coinciden con el pedido
- Embalaje dañado y productos rotos
- Documentación faltante
- Cantidad incorrecta sin justificación
```

#### D) Historial de Recepciones

**Qué observar:**
- [ ] Traspasos validados con badge verde ✅
- [ ] Traspasos rechazados con badge rojo ❌
- [ ] Cantidad recibida vs. cantidad enviada
- [ ] Ícono de advertencia ⚠️ si hay discrepancia
- [ ] Observaciones del recepcionista
- [ ] Nombre del recepcionista que validó

---

### 6️⃣ GESTIÓN DE PROVEEDORES (`/suppliers`)

**Acceso:** Click en "Proveedores" en el sidebar (solo Admin y Manager)

#### A) Listado de Proveedores

**Qué probar:**
- [ ] Buscar por nombre: "Ferretería"
- [ ] Buscar por email: "carlos@"
- [ ] Filtrar por estado: "Activos"
- [ ] Ver badge verde "Activo" en proveedores activos
- [ ] Click en "Exportar"

**Proveedores mock:**
- Ferretería Industrial S.A. (Activo)
- Distribuidora Eléctrica (Activo)
- Plomería & Materiales (Activo)

#### B) Agregar Nuevo Proveedor

**Acceso:** Click en "Nuevo Proveedor"

**Qué probar:**
- [ ] Completar todos los campos
- [ ] Seleccionar estado: Activo/Inactivo
- [ ] Click "Guardar Proveedor"
- [ ] Ver toast de confirmación
- [ ] Proveedor aparece en tabla

**Datos de ejemplo:**
```
Nombre Empresa: Pinturas Industriales S.R.L.
Contacto: Laura Benítez
Email: laura@pinturas.com
Teléfono: +5491123456789
Dirección: Av. Libertador 4567, CABA
Estado: Activo
```

#### C) Editar Proveedor

**Acceso:** Click en ✏️ en cualquier fila

**Qué observar:**
- Modal precargado con datos actuales
- Puede cambiar estado a "Inactivo"
- Botón dice "Actualizar Proveedor"

---

### 7️⃣ REPORTES (`/reports`)

**Acceso:** Click en "Reportes" en el sidebar (Admin, Manager, Visualizador)

**Qué observar:**
- [ ] Página con gráficos y tablas de reportes
- [ ] Exportación de datos
- [ ] Filtros por fecha

---

### 8️⃣ CONFIGURACIÓN (`/settings`)

**Acceso:** Click en "Configuración" en el sidebar (solo Admin)

**Qué observar:**
- [ ] Configuraciones del sistema
- [ ] Gestión de usuarios
- [ ] Parámetros generales

---

## ELEMENTOS DEL SIDEBAR

### Módulos del Sistema

**Selector de Módulos** (parte superior del sidebar):
- [ ] Click en el selector
- [ ] Ver lista de 6 módulos del ERP
- [ ] **Stock y Control Inventario** → Badge "Activo"
- [ ] Otros 5 módulos → Badge "Próximamente"

**Módulos mostrados:**
1. 💰 Financiero-Contable (Próximamente)
2. 🛒 Ventas y Marketing (Próximamente)
3. 🏭 Producción (Próximamente)
4. 🚚 Compras y Logística (Próximamente)
5. 👥 Recursos Humanos (Próximamente)
6. 📦 **Stock y Control Inventario** (ACTIVO) ⭐

### Menú de Navegación

Bajo el título "Control de Inventario":
- 📊 Dashboard
- 📦 Inventario
- 🚚 Traspasos
- 📋 Recepción (solo Admin/Recepcionista)
- 👥 Proveedores (solo Admin/Manager)
- 📄 Reportes
- ⚙️ Configuración (solo Admin)

### Usuario

En la parte inferior:
- Nombre del usuario logueado
- Rol (capitalizado)
- Botón "Cerrar Sesión"

---

## NOTIFICACIONES Y ALERTAS

### Campana de Notificaciones (Header)

**Para Recepcionistas:**
- [ ] Campana con número rojo (cantidad de traspasos pendientes)
- [ ] Animación de pulse en el badge
- [ ] Click → Redirige a `/reception`

**Para otros roles:**
- [ ] Campana con número "3" (genérico)
- [ ] Sin funcionalidad específica

---

## VALIDACIONES Y MENSAJES

### Toast Notifications (Esquina superior derecha)

**Tipos de mensajes:**
- ✅ **Éxito** (verde): Acciones completadas
- ❌ **Error** (rojo): Validaciones fallidas
- ℹ️ **Info** (azul): Información general
- ⚠️ **Advertencia** (amarillo): Discrepancias o alertas

**Ejemplos:**
```
✅ Producto agregado correctamente
   Operador: Admin User

❌ Por favor complete todos los campos

⚠️ Stock insuficiente en almacén de origen

✅ Traspaso validado exitosamente
   95 unidades de Tornillo M8x20 recibidas
```

---

## RESPONSIVIDAD Y DISEÑO

### Desktop First
El sistema está optimizado para **escritorio (1920x1080+)**

**Elementos a observar:**
- Grid de 12 columnas
- Alta densidad de información (estilo ERP)
- Sidebar colapsable con botón
- Tablas amplias con múltiples columnas

### Paleta de Colores

**Colores semánticos:**
- 🔵 Primario: Azul marino (#1e3a8a)
- 🟢 Éxito: Verde (#16a34a)
- 🟡 Advertencia: Ámbar (#f59e0b)
- 🔴 Error/Crítico: Rojo (#dc2626)
- ⚫ Gris técnico: (#64748b)

---

## FUNCIONALIDADES AVANZADAS

### Trazabilidad
**Cada acción registra:**
- Operador que ejecutó la acción
- Fecha y hora exacta
- Observaciones (cuando aplica)

**Ver en:**
- Toast notifications
- Historial de traspasos
- Movimientos de inventario

### Filtros Multivariables
**En Inventario:**
- Búsqueda por texto (nombre o SKU)
- Categoría (dropdown)
- Almacén (dropdown)
- Estado de stock (dropdown)

**Combinables:**
- Aplicar múltiples filtros simultáneamente
- Resultados se actualizan en tiempo real

### Exportación de Datos
**Formatos disponibles:**
- 📄 CSV
- 📋 PDF
- 📊 Google Sheets

**Dónde:**
- Inventario
- Proveedores
- Dashboard (botón exportar)

---

## CHECKLIST PARA EVALUACIÓN

### ✅ Base de Datos
- [ ] Revisar archivo `DIAGRAMA_BASE_DATOS.md`
- [ ] Verificar 7 tablas marcadas como NUEVAS ⭐
- [ ] Revisar script SQL completo
- [ ] Validar relaciones y Foreign Keys

### ✅ Pantalla Login
- [ ] Visualizar pantalla de login
- [ ] Probar validaciones (email, campos vacíos)
- [ ] Verificar selector de 5 roles
- [ ] Verificar links "Crear nueva contraseña" y "¿Olvidaste tu contraseña?"

### ✅ Pantalla Crear/Restablecer Contraseña
- [ ] Modo crear: indicador de fortaleza con colores
- [ ] Modo crear: requisitos con checks verdes en tiempo real
- [ ] Modo crear: botón deshabilitado hasta cumplir requisitos
- [ ] Modo restablecer: paso 1 - envío de email
- [ ] Modo restablecer: paso 2 - código de 6 dígitos (demo: 123456)
- [ ] Modo restablecer: paso 3 - nueva contraseña
- [ ] Navegación entre pasos con botones Atrás/Siguiente
- [ ] Botón "Volver al Login" funcional

### ✅ ABM Productos
- [ ] Ver listado inicial con filtros
- [ ] Abrir modal "Nuevo Producto"
- [ ] Abrir modal "Editar Producto"
- [ ] Verificar diferencias entre ambos modales

### ✅ ABM Proveedores
- [ ] Ver listado de proveedores
- [ ] Abrir modal "Nuevo Proveedor"
- [ ] Abrir modal "Editar Proveedor"
- [ ] Verificar estados (Activo/Inactivo)

### ✅ Funcionalidades Adicionales (Bonus)
- [ ] Probar flujo completo de traspasos
- [ ] Validar recepción como recepcionista
- [ ] Ver dashboard con gráficos
- [ ] Verificar trazabilidad en todas las acciones

---

## TROUBLESHOOTING

### PANTALLA DE CREAR/RESTABLECER CONTRASEÑA

**Ubicación:** `/create-password`

**Acceso desde Login:**
- Link "Crear nueva contraseña"
- Link "¿Olvidaste tu contraseña?"

#### Modo: Crear Nueva Contraseña

**Qué probar:**
- [ ] Escribir una contraseña débil (solo letras) → Ver indicador rojo
- [ ] Escribir una contraseña media (letras + números) → Ver indicador amarillo
- [ ] Escribir una contraseña fuerte (mayúsculas + números + especiales) → Ver indicador verde
- [ ] Escribir contraseñas que no coinciden → Ver error
- [ ] Ver requisitos en tiempo real (checks verdes cuando se cumplen)
- [ ] Marcar "Mostrar contraseña" → Ver texto plano
- [ ] Click "Crear Contraseña" → Toast de éxito y redirige a login

**Contraseña de prueba válida:**
```
Contraseña: Test@123456
Confirmar: Test@123456
```

#### Modo: Restablecer Contraseña

**PASO 1: Email**
- [ ] Ingresar email válido
- [ ] Click "Enviar Código de Verificación"
- [ ] Ver toast de éxito con el email

**PASO 2: Código**
- [ ] Ingresar código incorrecto → Ver error
- [ ] Ingresar código correcto: **123456** → Avanza al paso 3
- [ ] Click "Reenviar código" → Ver confirmación
- [ ] Click "Atrás" → Vuelve al paso 1

**PASO 3: Nueva Contraseña**
- [ ] Mismo flujo que crear contraseña
- [ ] Validaciones en tiempo real
- [ ] Click "Restablecer Contraseña" → Toast de éxito y redirige

**Datos de prueba:**
```
Email: test@laescuela.com
Código: 123456
Nueva Contraseña: NuevaPass@2024
```

---

### Problema: No veo el botón "Nuevo Producto"
**Solución:** Asegúrate de estar logueado como Admin o Manager

### Problema: No veo la opción "Recepción" en el sidebar
**Solución:** Debes estar logueado como Admin o Recepcionista

### Problema: No puedo crear un traspaso
**Solución:** Verifica que tienes rol de Operador, Manager o Admin

### Problema: La validación no funciona en un formulario
**Solución:** Todos los campos marcados con * son obligatorios

---

## DATOS MOCK DEL SISTEMA

### Productos (8 totales):
1. SKU-001: Tornillo M8x20 (Stock: 45/100) 🔴
2. SKU-002: Tuerca Hexagonal M8 (Stock: 320/200) ✅
3. SKU-003: Cable eléctrico 2.5mm (Stock: 15/50) 🔴
4. SKU-004: Interruptor Simple (Stock: 89/100) 🟡
5. SKU-005: Válvula Check 1/2" (Stock: 5/30) 🔴
6. SKU-006: Tubo PVC 3/4" (Stock: 150/80) ✅
7. SKU-007: Pintura Látex Blanco (Stock: 28/40) 🟡
8. SKU-008: Rodillo 9" (Stock: 67/50) ✅

### Proveedores (3 totales):
1. Ferretería Industrial S.A.
2. Distribuidora Eléctrica
3. Plomería & Materiales

### Almacenes (3 totales):
1. Almacén Central
2. Almacén Norte
3. Almacén Sur

### Traspasos (3 totales):
1. Tornillo M8x20: 100 unidades (Pendiente Recepción)
2. Cable eléctrico 2.5mm: 50 unidades (Completado)
3. Válvula Check 1/2": 20 unidades (Pendiente Recepción)

---

## CONTACTO PARA SOPORTE

Si tienes problemas para navegar el sistema, contactar a:

**Estudiante:**  
Email: _________________________________  
Teléfono: _________________________________

---

## TIEMPO ESTIMADO DE EVALUACIÓN

- **Navegación básica:** 15-20 minutos
- **Evaluación completa:** 30-40 minutos
- **Con testing de todas las funcionalidades:** 60 minutos

---

**¡Gracias por evaluar nuestro proyecto!** 🚀
