# Guía de Pantallas - Sistema de Stock e Inventario

## INSTRUCCIONES PARA VISUALIZAR LAS PANTALLAS

Para visualizar todas las pantallas implementadas, sigue estos pasos:

1. **Iniciar el sistema:**
   - El sistema ya está corriendo en el preview
   - Accede a la URL del preview de Figma Make

2. **Credenciales de prueba:**
   - Email: cualquier email válido (ej: admin@laescuela.com)
   - Contraseña: cualquier contraseña
   - Rol: Selecciona el rol que quieras probar

---

## 1. PANTALLA DE LOGIN

### Ubicación: `/login`

### Cómo acceder:
- Es la pantalla inicial del sistema
- Se muestra automáticamente si no hay sesión activa

### Elementos visibles:
```
┌─────────────────────────────────────────┐
│                                         │
│         [📦 Logo La Escuela]            │
│     Sistema de Gestión de Stock         │
│     Control Industrial y Logística      │
│                                         │
│  ┌────────────────────────────────┐    │
│  │ Email                          │    │
│  │ [usuario@empresa.com........] │    │
│  └────────────────────────────────┘    │
│                                         │
│  ┌────────────────────────────────┐    │
│  │ Contraseña                     │    │
│  │ [••••••••••••••••••••••••••••] │    │
│  └────────────────────────────────┘    │
│                                         │
│  ┌────────────────────────────────┐    │
│  │ Rol de Usuario (Testing)       │    │
│  │ [Administrador ▼]              │    │
│  │  • Administrador               │    │
│  │  • Gerente                     │    │
│  │  • Operador                    │    │
│  │  • Recepcionista ⭐            │    │
│  │  • Visualizador                │    │
│  └────────────────────────────────┘    │
│                                         │
│  ┌────────────────────────────────┐    │
│  │    [Iniciar Sesión]            │    │
│  └────────────────────────────────┘    │
│                                         │
│  Demo: Use cualquier email y           │
│  contraseña válida                      │
└─────────────────────────────────────────┘
```

### Estados de la pantalla:
1. **Estado inicial:** Campos vacíos
2. **Estado con error:** Muestra alerta roja con ícono ⚠️
   - "Por favor complete todos los campos"
   - "Email inválido"
   - "Credenciales inválidas"
3. **Estado cargando:** Botón dice "Iniciando sesión..."

### Para capturar:
- Tomar screenshot del estado inicial (limpio)
- Tomar screenshot mostrando un error de validación
- Tomar screenshot con el selector de roles abierto

---

## 2. PANTALLA: CREAR/RESTABLECER CONTRASEÑA

### ✅ IMPLEMENTADA - Ubicación: `/create-password`

### Cómo acceder:
- Desde el login, click en "Crear nueva contraseña" o "¿Olvidaste tu contraseña?"
- URL directa: `/create-password?mode=create` o `/create-password?mode=reset`

### Diseño implementado:

#### A) CREAR NUEVA CONTRASEÑA
```
┌─────────────────────────────────────────┐
│         Crear Nueva Contraseña          │
│                                         │
│  ┌────────────────────────────────┐    │
│  │ Nueva Contraseña               │    │
│  │ [••••••••••••••••••••••••••••] │    │
│  └────────────────────────────────┘    │
│                                         │
│  Fortaleza: [████████░░] Fuerte         │
│                                         │
│  ┌────────────────────────────────┐    │
│  │ Confirmar Contraseña           │    │
│  │ [••••••••••••••••••••••••••••] │    │
│  └────────────────────────────────┘    │
│                                         │
│  Requisitos:                            │
│  ✅ Mínimo 8 caracteres                │
│  ✅ Al menos 1 mayúscula               │
│  ✅ Al menos 1 número                  │
│  ❌ Al menos 1 carácter especial       │
│                                         │
│  [Cancelar]     [Crear Contraseña]     │
└─────────────────────────────────────────┘
```

#### B) RESTABLECER CONTRASEÑA
```
┌─────────────────────────────────────────┐
│       Restablecer Contraseña            │
│                                         │
│ Paso 1: Verificación de Email          │
│  ┌────────────────────────────────┐    │
│  │ Email Registrado               │    │
│  │ [email@empresa.com...........]  │    │
│  └────────────────────────────────┘    │
│  [Enviar Código de Verificación]       │
│                                         │
│ ─────────────────────────────────────  │
│                                         │
│ Paso 2: Código de Verificación         │
│  Ingrese el código de 6 dígitos        │
│  enviado a su email:                   │
│                                         │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ │
│  │ 1 │ │ 2 │ │ 3 │ │ 4 │ │ 5 │ │ 6 │ │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ │
│                                         │
│ ─────────────────────────────────────  │
│                                         │
│ Paso 3: Nueva Contraseña               │
│  ┌────────────────────────────────┐    │
│  │ Nueva Contraseña               │    │
│  │ [••••••••••••••••••••••••••••] │    │
│  └────────────────────────────────┘    │
│                                         │
│  ┌────────────────────────────────┐    │
│  │ Confirmar Contraseña           │    │
│  │ [••••••••••••••••••••••••••••] │    │
│  └────────────────────────────────┘    │
│                                         │
│  [Cancelar]  [Restablecer Contraseña]  │
└─────────────────────────────────────────┘
```

### Características implementadas:
- ✅ Indicador de fortaleza de contraseña con barra de progreso
- ✅ Validación en tiempo real de requisitos (8 caracteres, mayúscula, número, especial)
- ✅ Verificación de coincidencia de contraseñas
- ✅ Modo "Crear" y modo "Restablecer" con parámetro en URL
- ✅ Flujo de 3 pasos para restablecer (Email → Código → Contraseña)
- ✅ Código de verificación de 6 dígitos (demo: 123456)
- ✅ Opción de mostrar/ocultar contraseña
- ✅ Botón "Volver al Login"

### Estados para capturar:
1. **Crear contraseña:** Pantalla inicial vacía
2. **Crear contraseña:** Con contraseña débil (indicador rojo)
3. **Crear contraseña:** Con contraseña fuerte (indicador verde)
4. **Restablecer:** Paso 1 - Ingresar email
5. **Restablecer:** Paso 2 - Código de verificación
6. **Restablecer:** Paso 3 - Nueva contraseña

---

## 3. ABM PRODUCTOS

### A) PANTALLA INICIAL (Listado)
**Ubicación:** `/inventory`

### Cómo acceder:
1. Iniciar sesión con cualquier rol
2. Click en "Inventario" en el sidebar

### Estructura de la pantalla:
```
┌──────────────────────────────────────────────────────────────┐
│ Sidebar │  Gestión de Inventario                            │
│         │  Control y administración de productos            │
│ 📊      │                                                    │
│ 📦 ◀───────  [Exportar ▼]  [+ Nuevo Producto]              │
│ 🚚      │                                                    │
│ 📋 ◀───────  🔍 [Buscar por nombre o SKU...............]    │
│ 👥      │                                                    │
│ 📄      │  Categoría: [Todas ▼]  Almacén: [Todos ▼]        │
│ ⚙️      │  Estado: [Todos ▼]                                │
│         │                                                    │
│         │  ┌──────────────────────────────────────────────┐ │
│         │  │ SKU    │Nombre      │Cat.│Almacén│Stock│Min││ │
│         │  ├──────────────────────────────────────────────┤ │
│         │  │SKU-001 │Tornillo M8 │Ferr│Central│ 45 │100││ │
│         │  │        │            │    │       │🔴 Crítico││ │
│         │  │        │            │    │       │  [✏️][🗑️] ││ │
│         │  ├──────────────────────────────────────────────┤ │
│         │  │SKU-002 │Tuerca M8   │Ferr│Central│320 │200││ │
│         │  │        │            │    │       │✅ Normal ││ │
│         │  │        │            │    │       │  [✏️][🗑️] ││ │
│         │  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Elementos destacados para capturar:
- **Vista completa** de la tabla con productos
- **Filtros aplicados** (ejemplo: mostrar solo stock crítico)
- **Menú de exportación** desplegado
- **Badge rojo** en productos con stock crítico

---

### B) PANTALLA AGREGAR NUEVO PRODUCTO
**Acción:** Click en "Nuevo Producto"

### Modal que aparece:
```
┌────────────────────────────────────────────┐
│  Nuevo Producto                      [✕]   │
├────────────────────────────────────────────┤
│                                            │
│  SKU *              Nombre del Producto *  │
│  [SKU-009....]      [Cable HDMI.......]    │
│                                            │
│  Categoría *        Almacén *              │
│  [Electrónica..]    [Almacén Central..]    │
│                                            │
│  Stock Actual   Stock Mínimo   Precio Unit.│
│  [100.......]   [50.........]   [$15.50]   │
│                                            │
│                                            │
│              [Cancelar] [Guardar Producto] │
└────────────────────────────────────────────┘
```

### Estados para capturar:
1. **Modal vacío** (inicial)
2. **Modal con datos** completados
3. **Validación:** Mostrar error si falta campo obligatorio

---

### C) PANTALLA MODIFICAR PRODUCTO
**Acción:** Click en ✏️ editar de una fila

### Modal que aparece (precargado):
```
┌────────────────────────────────────────────┐
│  Editar Producto                     [✕]   │
├────────────────────────────────────────────┤
│                                            │
│  SKU *              Nombre del Producto *  │
│  [SKU-001]          [Tornillo M8x20]       │
│  (Solo lectura)                            │
│                                            │
│  Categoría *        Almacén *              │
│  [Ferretería]       [Almacén Central]      │
│                                            │
│  Stock Actual   Stock Mínimo   Precio Unit.│
│  [45.........]   [100.......]   [$0.25]    │
│                                            │
│  📅 Última actualización: 15/04/2026       │
│                                            │
│            [Cancelar] [Actualizar Producto]│
└────────────────────────────────────────────┘
```

### Diferencias con "Agregar":
- Título es "Editar Producto"
- Campos vienen precargados
- Botón dice "Actualizar Producto"
- Muestra fecha de última actualización

---

## 4. ABM PROVEEDORES

### A) PANTALLA INICIAL (Listado)
**Ubicación:** `/suppliers`

### Cómo acceder:
1. Iniciar sesión como Admin o Manager
2. Click en "Proveedores" en el sidebar

### Estructura de la pantalla:
```
┌──────────────────────────────────────────────────────────────┐
│ Sidebar │  Gestión de Proveedores                           │
│         │  Administración de empresas proveedoras           │
│ 📊      │                                                    │
│ 📦      │  [Exportar ▼]  [+ Nuevo Proveedor]                │
│ 🚚      │                                                    │
│ 👥 ◀───────  🔍 [Buscar por nombre o email.............]    │
│ 📄      │                                                    │
│         │  Estado: [Todos ▼] Activos (3) Inactivos (0)      │
│         │                                                    │
│         │  ┌──────────────────────────────────────────────┐ │
│         │  │Empresa     │Contacto  │Email    │Tel.│Estado││ │
│         │  ├──────────────────────────────────────────────┤ │
│         │  │Ferretería  │Carlos P. │carlos@  │+123│      ││ │
│         │  │Industrial  │          │ferre... │4567│Activo││ │
│         │  │S.A.        │          │         │    │✅    ││ │
│         │  │            │          │         │    │[✏️][🗑️]││ │
│         │  ├──────────────────────────────────────────────┤ │
│         │  │Distribuid. │Ana Mtz.  │ana@... │+123│      ││ │
│         │  │Eléctrica   │          │electr..│4568│Activo││ │
│         │  │            │          │         │    │✅    ││ │
│         │  │            │          │         │    │[✏️][🗑️]││ │
│         │  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Elementos destacados:
- Badge verde "Activo" / gris "Inactivo"
- Buscador por nombre o email
- Contador de activos/inactivos
- Botones de acción por fila

---

### B) PANTALLA AGREGAR NUEVO PROVEEDOR
**Acción:** Click en "Nuevo Proveedor"

### Modal que aparece:
```
┌────────────────────────────────────────────┐
│  Nuevo Proveedor                     [✕]   │
├────────────────────────────────────────────┤
│                                            │
│  Nombre de la Empresa *                    │
│  [Distribuidora Industrial S.A.......]     │
│                                            │
│  Nombre del Contacto *     Estado *        │
│  [Roberto Silva.....]      [Activo ▼]      │
│                                            │
│  Email *                   Teléfono *      │
│  [roberto@dist...]         [+1234567890]   │
│                                            │
│  Dirección *                               │
│  [Zona Industrial 789, Ciudad.......]      │
│  [....................................]     │
│                                            │
│                                            │
│           [Cancelar] [Guardar Proveedor]   │
└────────────────────────────────────────────┘
```

### Validaciones visibles:
- Email debe tener formato válido
- Teléfono con formato correcto
- Todos los campos son obligatorios (*)

---

### C) PANTALLA MODIFICAR PROVEEDOR
**Acción:** Click en ✏️ editar de una fila

### Modal que aparece (precargado):
```
┌────────────────────────────────────────────┐
│  Editar Proveedor                    [✕]   │
├────────────────────────────────────────────┤
│                                            │
│  Nombre de la Empresa *                    │
│  [Ferretería Industrial S.A.]              │
│                                            │
│  Nombre del Contacto *     Estado *        │
│  [Carlos Pérez]            [Activo ▼]      │
│                                            │
│  Email *                   Teléfono *      │
│  [carlos@ferreteria.com]   [+1234567890]   │
│                                            │
│  Dirección *                               │
│  [Av. Industrial 123]                      │
│                                            │
│                                            │
│        [Cancelar] [Actualizar Proveedor]   │
└────────────────────────────────────────────┘
```

### Diferencias con "Agregar":
- Título es "Editar Proveedor"
- Campos precargados con datos actuales
- Botón dice "Actualizar Proveedor"
- Puede cambiar estado a Inactivo

---

## 5. PANTALLAS ADICIONALES (BONUS) ⭐

### RECEPCIÓN DE TRASPASOS (Nueva funcionalidad)
**Ubicación:** `/reception`
**Rol:** Solo Recepcionista y Admin

```
┌──────────────────────────────────────────────────────────────┐
│         Recepción de Traspasos                               │
│         Validación de productos para Almacén Central         │
│                                                              │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐              │
│  │Pendientes │  │Validados  │  │Rechazados │              │
│  │    2      │  │Hoy: 5     │  │    0      │              │
│  │    ⏰     │  │    ✅     │  │    ❌     │              │
│  └───────────┘  └───────────┘  └───────────┘              │
│                                                              │
│  Traspasos Pendientes de Validación              [2] 🔴     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 📦 Tornillo M8x20               🟡 Pendiente Recep.  │  │
│  │                                                       │  │
│  │ Cantidad: 100 unidades                               │  │
│  │ Almacén Norte → Almacén Central                      │  │
│  │ Operador: Juan García                                │  │
│  │ Fecha envío: 15/04/2026                              │  │
│  │                                                       │  │
│  │           [✅ Validar Recepción] [❌ Rechazar]       │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## INSTRUCCIONES PARA CAPTURAR PANTALLAS

### Método 1: Screenshots del sistema funcionando
1. Navegar a cada pantalla en el preview de Figma Make
2. Usar herramienta de captura de pantalla (Win+Shift+S en Windows, Cmd+Shift+4 en Mac)
3. Capturar pantalla completa incluyendo sidebar

### Método 2: Crear mockups profesionales
1. Usar Figma para recrear las pantallas
2. Usar los wireframes ASCII de arriba como guía
3. Aplicar los colores del sistema:
   - Primario: Azul marino (#1e3a8a)
   - Éxito: Verde (#16a34a)
   - Advertencia: Ámbar (#f59e0b)
   - Error/Crítico: Rojo (#dc2626)
   - Gris técnico: (#64748b)

### Método 3: Documentar con texto + imágenes
1. Combinar screenshots reales con anotaciones
2. Usar PowerPoint o Google Slides
3. Agregar flechas y textos explicativos

---

## CHECKLIST PARA LA PRESENTACIÓN

### Pantallas Login:
- [ ] Pantalla inicial limpia
- [ ] Pantalla con selector de roles abierto
- [ ] Pantalla mostrando error de validación
- [ ] Mockup de "Crear nueva contraseña"
- [ ] Mockup de "Restablecer contraseña"

### Pantallas ABM Productos:
- [ ] Listado completo con filtros
- [ ] Modal "Nuevo Producto" vacío
- [ ] Modal "Nuevo Producto" con datos
- [ ] Modal "Editar Producto" con datos precargados
- [ ] Vista de producto con stock crítico (badge rojo)

### Pantallas ABM Proveedores:
- [ ] Listado completo de proveedores
- [ ] Modal "Nuevo Proveedor" vacío
- [ ] Modal "Nuevo Proveedor" con datos
- [ ] Modal "Editar Proveedor" con datos precargados
- [ ] Vista con proveedor inactivo

### Bonus (si incluyes):
- [ ] Dashboard con gráficos
- [ ] Pantalla de Recepción (nueva funcionalidad)
- [ ] Pantalla de Traspasos
- [ ] Vista del sidebar con módulos

---

## RECURSOS ADICIONALES

El archivo `PRESENTACION_PROYECTO.md` contiene:
- Diseño completo de base de datos
- Todas las tablas con sus campos
- Diagrama de relaciones
- Especificaciones técnicas completas
- Roles y permisos

Usa ese archivo como documento principal de entrega técnica.
