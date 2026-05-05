# 📦 Sistema ERP "La Escuela" - Módulo de Stock e Inventario

<div align="center">

![Status](https://img.shields.io/badge/Status-Funcional-success)
![Version](https://img.shields.io/badge/Version-1.0-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)
![Tailwind](https://img.shields.io/badge/Tailwind-4.0-38bdf8)

**Sistema profesional de gestión de inventario con control de traspasos y validación de recepciones**

[Documentación](#documentación) • [Instalación](#instalación) • [Demo](#demo) • [Características](#características)

</div>

---

## 🎯 Sobre el Proyecto

Sistema ERP modular diseñado para "La Escuela", enfocado en el **Módulo de Stock y Control de Inventario**. Incluye gestión completa de productos, proveedores, traspasos entre almacenes con validación por recepcionistas, y trazabilidad de todas las operaciones.

### Primera Presentación - Entrega Académica

Este proyecto es parte de la primera presentación académica que incluye:
- ✅ Diseño de Base de Datos (7 tablas nuevas)
- ✅ Pantalla de Login con selector de roles
- ✅ ABM Productos (listado, agregar, modificar)
- ✅ ABM Proveedores (listado, agregar, modificar)
- ✅ Mockups de crear/restablecer contraseña
- ✅ Sistema completamente funcional

---

## 📚 Documentación

### 🚀 Inicio Rápido

**Para profesores/evaluadores:**
- 📖 Lee primero: [`INSTRUCCIONES_NAVEGACION.md`](./INSTRUCCIONES_NAVEGACION.md)
- 🗺️ Índice completo: [`INDICE_DOCUMENTACION.md`](./INDICE_DOCUMENTACION.md)

**Para revisión de entregables:**
- 📄 Carátula: [`CARATULA_PROYECTO.md`](./CARATULA_PROYECTO.md)
- 📋 Documento técnico: [`PRESENTACION_PROYECTO.md`](./PRESENTACION_PROYECTO.md)
- 🗃️ Base de datos: [`DIAGRAMA_BASE_DATOS.md`](./DIAGRAMA_BASE_DATOS.md)
- 🖼️ Pantallas: [`GUIA_PANTALLAS.md`](./GUIA_PANTALLAS.md)

### Documentos Incluidos

| Archivo | Descripción | Para Quién |
|---------|-------------|------------|
| [`INDICE_DOCUMENTACION.md`](./INDICE_DOCUMENTACION.md) | Índice maestro de toda la documentación | Todos |
| [`CARATULA_PROYECTO.md`](./CARATULA_PROYECTO.md) | Carátula oficial con nombres de integrantes | Entrega |
| [`PRESENTACION_PROYECTO.md`](./PRESENTACION_PROYECTO.md) | Especificaciones técnicas completas | Profesor |
| [`DIAGRAMA_BASE_DATOS.md`](./DIAGRAMA_BASE_DATOS.md) | Diseño de BD con scripts SQL | Desarrolladores |
| [`GUIA_PANTALLAS.md`](./GUIA_PANTALLAS.md) | Wireframes y capturas de pantallas | Diseño |
| [`INSTRUCCIONES_NAVEGACION.md`](./INSTRUCCIONES_NAVEGACION.md) | Guía paso a paso del sistema | Evaluadores |

---

## ⚡ Instalación

### Prerrequisitos
- Node.js 18+ o pnpm

### Ejecutar Localmente

```bash
# Clonar el repositorio (si aplica)
git clone [url-del-repo]
cd [nombre-del-proyecto]

# Instalar dependencias
pnpm install

# Iniciar servidor de desarrollo
pnpm dev
```

El sistema estará disponible en `http://localhost:5173`

---

## 🎮 Demo

### Acceso Rápido

**URL del Sistema:** [Insertar URL del preview de Figma Make]

**Credenciales de Prueba:**
- **Email:** cualquier email válido (ej: admin@laescuela.com)
- **Contraseña:** cualquier contraseña
- **Rol:** Seleccionar del dropdown

### Roles Disponibles

| Rol | Acceso |
|-----|--------|
| 👑 **Administrador** | Acceso completo a todo el sistema |
| 📊 **Gerente** | Inventario, Proveedores, Reportes |
| ⚙️ **Operador** | Inventario, Traspasos |
| ✅ **Recepcionista** ⭐ | Validación de recepciones |
| 👁️ **Visualizador** | Solo lectura |

---

## ✨ Características

### 🏭 Sistema Modular
- **6 módulos del ERP** planificados
- **Stock y Control Inventario** actualmente implementado
- Selector visual de módulos en el sidebar

### 📦 Gestión de Inventario
- ✅ CRUD completo de productos
- ✅ Filtros multivariables (categoría, almacén, stock)
- ✅ Alertas visuales de stock crítico
- ✅ Exportación (CSV, PDF, Sheets)
- ✅ Trazabilidad de operador en cada acción

### 👥 Gestión de Proveedores
- ✅ CRUD completo de proveedores
- ✅ Estados activo/inactivo
- ✅ Búsqueda y filtrado
- ✅ Validación de datos de contacto

### 🚚 Traspasos entre Almacenes ⭐ NUEVO
- ✅ Creación con stepper de 3 pasos
- ✅ Validación de stock disponible
- ✅ Estados: Pendiente → En Tránsito → Pendiente Recepción → Completado
- ✅ Validación por recepcionista
- ✅ Registro de discrepancias
- ✅ Aprobación/Rechazo con observaciones

### 🔐 Control de Acceso
- ✅ Autenticación con 5 roles
- ✅ Permisos diferenciados por rol
- ✅ Rol de recepcionista ⭐ NUEVO
- ✅ Asignación de almacén a recepcionistas

### 📊 Dashboard y Reportes
- ✅ KPIs en tiempo real
- ✅ Gráficos interactivos (Recharts)
- ✅ Alertas críticas con notificaciones
- ✅ Historial de movimientos

---

## 🗄️ Base de Datos

### Tablas Implementadas (TODAS NUEVAS ⭐)

1. **PRODUCTS** - Gestión de productos
2. **SUPPLIERS** - Gestión de proveedores
3. **WAREHOUSES** - Almacenes
4. **CATEGORIES** - Categorías de productos
5. **PRODUCT_SUPPLIERS** - Relación producto-proveedor
6. **TRANSFERS** - Traspasos entre almacenes
7. **MOVEMENTS** - Movimientos de inventario

**Ver diseño completo:** [`DIAGRAMA_BASE_DATOS.md`](./DIAGRAMA_BASE_DATOS.md)

---

## 🖼️ Pantallas Implementadas

### Autenticación
- ✅ Login con selector de 5 roles
- ✅ Crear nueva contraseña con validaciones en tiempo real
- ✅ Restablecer contraseña con flujo de 3 pasos (Email → Código → Contraseña)

### ABM Productos
- ✅ Listado con filtros avanzados
- ✅ Agregar nuevo producto
- ✅ Modificar producto existente
- ✅ Validaciones y trazabilidad

### ABM Proveedores
- ✅ Listado de proveedores
- ✅ Agregar nuevo proveedor
- ✅ Modificar proveedor
- ✅ Estados activo/inactivo

### Pantallas Adicionales (Bonus)
- ✅ Dashboard con KPIs y gráficos
- ✅ Traspasos entre almacenes
- ✅ **Recepción de traspasos** ⭐ NUEVA
- ✅ Reportes
- ✅ Configuración

**Ver wireframes y capturas:** [`GUIA_PANTALLAS.md`](./GUIA_PANTALLAS.md)

---

## 🛠️ Tecnologías

### Frontend
- **React 18** - Framework de UI
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Estilos utility-first
- **React Router 7** - Navegación
- **Radix UI** - Componentes accesibles

### Gráficos y Visualización
- **Recharts** - Gráficos interactivos
- **Lucide React** - Iconografía

### Gestión de Estado
- **Context API** - Estado global
- **React Hooks** - Estado local

### Notificaciones
- **Sonner** - Toast notifications

---

## 📂 Estructura del Proyecto

```
src/
├── app/
│   ├── pages/                  # Páginas principales
│   │   ├── Login.tsx          # Autenticación
│   │   ├── Dashboard.tsx      # Dashboard con KPIs
│   │   ├── Inventory.tsx      # ABM Productos
│   │   ├── Transfers.tsx      # Traspasos
│   │   ├── Reception.tsx      # Recepción ⭐ NUEVA
│   │   ├── Suppliers.tsx      # ABM Proveedores
│   │   ├── Reports.tsx        # Reportes
│   │   └── Settings.tsx       # Configuración
│   │
│   ├── components/            # Componentes reutilizables
│   │   ├── Layout.tsx         # Layout principal con sidebar
│   │   ├── ProtectedRoute.tsx # Rutas protegidas
│   │   └── ui/                # Componentes UI (Radix)
│   │
│   ├── context/               # Estado global
│   │   └── AppContext.tsx     # Lógica del sistema
│   │
│   ├── types.ts               # Definiciones TypeScript
│   └── routes.tsx             # Configuración de rutas
│
└── styles/                    # Estilos globales
    ├── theme.css              # Variables de tema
    └── fonts.css              # Tipografías
```

---

## 🎨 Paleta de Colores

### Colores Semánticos
- 🔵 **Primario:** Azul marino `#1e3a8a`
- 🟢 **Éxito:** Verde `#16a34a`
- 🟡 **Advertencia:** Ámbar `#f59e0b`
- 🔴 **Error/Crítico:** Rojo `#dc2626`
- ⚫ **Gris técnico:** `#64748b`

---

## 📊 Estadísticas del Proyecto

| Métrica | Valor |
|---------|-------|
| Tablas de BD | 7 |
| Pantallas | 8+ |
| Roles de usuario | 5 |
| Estados de traspaso | 6 |
| Líneas de código | ~3,500 |
| Componentes React | 20+ |

---

## 🚀 Próximos Pasos

### Para la Entrega
- [ ] Completar nombres en CARATULA_PROYECTO.md
- [ ] Tomar capturas de pantalla
- [ ] Crear mockups de crear/restablecer contraseña
- [ ] Revisar toda la documentación
- [ ] Preparar presentación

### Para Futuras Versiones
- [ ] Implementar pantalla de gestión de contraseñas
- [ ] Conectar con base de datos real
- [ ] Sistema de autenticación con JWT
- [ ] Reportes avanzados con filtros de fecha
- [ ] Notificaciones por email
- [ ] Integración con otros módulos del ERP

---

## 👥 Equipo del Proyecto

**Integrantes:**
- [Nombre 1] - [Rol/Responsabilidad]
- [Nombre 2] - [Rol/Responsabilidad]
- [Nombre 3] - [Rol/Responsabilidad]

**Profesor:** Ernesto Y

**Institución:** [Nombre de la Institución]

**Fecha de Entrega:** [Fecha]

---

## 📝 Licencia

Proyecto académico desarrollado para [Nombre de la Materia].

---

## 📞 Contacto

Para consultas sobre el proyecto:

**Email:** _________________________________  
**Teléfono:** _________________________________

---

## 🙏 Agradecimientos

- React Team por el framework
- Radix UI por los componentes accesibles
- Tailwind CSS por el sistema de diseño
- Figma Make por la plataforma de desarrollo

---

<div align="center">

**Sistema ERP "La Escuela"**  
Módulo de Stock y Control de Inventario

*Versión 1.0 - Primera Presentación*

[![Documentación](https://img.shields.io/badge/Documentación-Completa-success)](./INDICE_DOCUMENTACION.md)
[![Base de Datos](https://img.shields.io/badge/Base%20de%20Datos-7%20Tablas-blue)](./DIAGRAMA_BASE_DATOS.md)
[![Pantallas](https://img.shields.io/badge/Pantallas-8+-orange)](./GUIA_PANTALLAS.md)

[⬆ Volver arriba](#-sistema-erp-la-escuela---módulo-de-stock-e-inventario)

</div>
