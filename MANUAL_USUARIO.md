# Manual del Usuario - Sistema de Gestión de Stock "La Escuela"

Este manual proporciona las instrucciones necesarias para operar el sistema ERP de Gestión de Stock de la empresa **"La Escuela"**. El sistema está optimizado para un entorno profesional de alta densidad, priorizando la eficiencia operativa y la trazabilidad total de la mercadería.

---

## 1. Acceso al Sistema

### Login y Seguridad
1. **Credenciales:** Ingrese su correo corporativo y contraseña en la pantalla de inicio.
2. **Validación:** El sistema utiliza rutas protegidas. Si intenta acceder a una URL sin sesión activa, será redirigido al login.
3. **Pivote de Contraseña:** Al recibir una cuenta nueva, deberá crear una contraseña personal siguiendo los criterios de seguridad del sistema.

> **Nota:** Por seguridad, no comparta sus credenciales. El sistema registra cada movimiento asociado a su perfil de usuario.

---

## 2. Roles y Permisos

El sistema se rige por una jerarquía de acceso estricta:

| Rol | Alcance | Funciones Principales |
| :--- | :--- | :--- |
| **Administrador** | Total | Configuración global, gestión de usuarios y auditoría completa. |
| **Gerente** | Estratégico | Ajustes de inventario (F11), gestión de proveedores y análisis de reportes. |
| **Operador** | Logístico | Ingreso de mercadería (F4), creación de traspasos y consultas de stock. |
| **Recepcionista** | Validación | Recepción física de traspasos en almacén de destino y control local. |
| **Auditor** | Consulta | Acceso a reportes y visualización de movimientos sin capacidad de edición. |

---

## 3. Operativa de Inventario

### Búsqueda de Productos
- Acceda al módulo **Inventario**.
- Utilice la barra de búsqueda superior para filtrar por **Nombre, SKU o EAN**.
- Aplique filtros por **Almacén** o **Categoría** para localizar existencias en ubicaciones específicas.

### Registro de Ingreso (F4)
Para dar entrada a mercadería de proveedores:
1. Seleccione el **Proveedor**.
2. Indique el **Almacén de Destino**.
3. Agregue los productos y cantidades. El sistema validará que los datos sean coherentes en tiempo real.
4. Presione **"Registrar Ingreso"** para impactar el stock.

### Ajuste de Inventario (F11)
Reservado para correcciones por merma o auditoría física:
- Seleccione el producto y el almacén.
- Indique la nueva cantidad física.
- **Obligatorio:** Seleccione un motivo de ajuste (Rotura, Error de Conteo, etc.).
- El ajuste generará un registro histórico inalterable.

---

## 4. Flujo de Traspasos Logísticos

El sistema utiliza un protocolo de "Doble Validación":

1. **Emisión (Operador):** Se crea el traspaso desde un almacén origen a un destino. El stock queda en estado "En Tránsito".
2. **Recepción (Recepcionista):** El encargado del destino recibe una notificación. Debe validar la cantidad recibida físicamente.
3. **Cierre:** Una vez validado, el stock se descuenta del origen e incrementa en el destino de forma definitiva.

---

## 5. Reportes y Exportación

### Generación de Informes
En el módulo de **Reportes**, puede visualizar:
- **Dashboard Ejecutivo:** KPIs de valorización total y rotación.
- **Historial de Movimientos:** Trazabilidad de cada entrada/salida.
- **Almacenes:** Ocupación y niveles críticos de stock.

### Exportación
Todas las tablas del sistema permiten la descarga de datos:
- **CSV/Excel:** Para análisis de datos y procesamiento contable.
- **PDF:** Para reportes listos para impresión y firmas de auditoría.

---

## 6. Soporte Técnico
Para reportar errores o solicitar nuevos accesos, contacte al Administrador del Sistema mediante el correo: `soporte.erp@laescuela.com`

---
*Manual actualizado al 5 de Mayo de 2026.*
