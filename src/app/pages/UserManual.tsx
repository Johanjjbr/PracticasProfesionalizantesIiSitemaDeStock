import { useState } from 'react';
import { 
  BookOpen, 
  LogIn, 
  Search, 
  PackagePlus, 
  ArrowLeftRight, 
  FileText, 
  ShieldCheck, 
  SlidersHorizontal,
  ChevronRight,
  Info,
  Download,
  CheckCircle2,
  AlertCircle,
  Printer
} from 'lucide-react';
import { cn } from '../components/ui/utils';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';

const sections = [
  { id: 'intro', title: 'Introducción', icon: Info },
  { id: 'login', title: 'Acceso al Sistema', icon: LogIn },
  { id: 'roles', title: 'Roles y Permisos', icon: ShieldCheck },
  { id: 'search', title: 'Búsqueda de Productos', icon: Search },
  { id: 'entry', title: 'Ingreso de Mercadería (F4)', icon: PackagePlus },
  { id: 'transfers', title: 'Traspasos y Recepción', icon: ArrowLeftRight },
  { id: 'adjustment', title: 'Ajuste de Inventario (F11)', icon: SlidersHorizontal },
  { id: 'reports', title: 'Reportes y Exportación', icon: FileText },
];

export default function UserManual() {
  const [activeSection, setActiveSection] = useState('intro');

  const renderContent = () => {
    switch (activeSection) {
      case 'intro':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h3 className="text-2xl font-bold text-primary mb-4">Bienvenido al Sistema de Gestión de Stock "La Escuela"</h3>
              <p className="text-muted-foreground leading-relaxed">
                Este manual está diseñado para guiarlo a través de todas las funcionalidades del sistema ERP de Gestión de Stock. 
                El sistema ha sido desarrollado bajo un concepto de "Desktop First" y "Alta Densidad", optimizado para operaciones 
                logísticas rápidas y eficientes en entornos profesionales.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    Objetivo Principal
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  Garantizar la trazabilidad total de los productos desde su ingreso hasta su destino final, minimizando errores de stock.
                </CardContent>
              </Card>
              <Card className="bg-success/5 border-success/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    Consistencia Visual
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  Uso de una paleta de colores sobria (Azul Marino y Gris Técnico) para reducir la fatiga visual durante jornadas extensas.
                </CardContent>
              </Card>
            </div>
          </div>
        );
      case 'login':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-2xl font-bold text-primary">Acceso al Sistema</h3>
            <div className="space-y-4">
              <p className="text-muted-foreground">Para ingresar al sistema, siga estos pasos:</p>
              <ol className="list-decimal list-inside space-y-4 text-sm text-muted-foreground">
                <li className="pl-2">
                  <span className="font-medium text-foreground">Credenciales:</span> Ingrese su correo electrónico corporativo y contraseña asignada en la pantalla de inicio.
                </li>
                <li className="pl-2">
                  <span className="font-medium text-foreground">Primera vez:</span> Si es su primer ingreso, el sistema le solicitará cambiar su contraseña temporal por una personal.
                </li>
                <li className="pl-2">
                  <span className="font-medium text-foreground">Sesión Protegida:</span> El sistema cuenta con rutas protegidas; si intenta acceder a una sección sin estar autenticado, será redirigido al Login.
                </li>
              </ol>
              <div className="p-4 bg-muted rounded-lg border border-border">
                <p className="text-xs font-medium uppercase tracking-wider mb-2">Nota de Seguridad</p>
                <p className="text-xs text-muted-foreground">
                  Figma Make no está destinado a recopilar información de identificación personal (PII) ni datos confidenciales. 
                  Asegúrese de utilizar contraseñas de prueba para este entorno de demostración.
                </p>
              </div>
            </div>
          </div>
        );
      case 'roles':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-2xl font-bold text-primary">Roles y Permisos</h3>
            <div className="overflow-hidden border border-border rounded-lg">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground font-medium border-b border-border">
                  <tr>
                    <th className="px-4 py-3">Rol</th>
                    <th className="px-4 py-3">Descripción</th>
                    <th className="px-4 py-3">Permisos Clave</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-4 py-3 font-medium">Administrador</td>
                    <td className="px-4 py-3 text-muted-foreground">Control total del sistema.</td>
                    <td className="px-4 py-3 text-muted-foreground">Configuración, Gestión de Usuarios, Reportes Críticos.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Gerente</td>
                    <td className="px-4 py-3 text-muted-foreground">Supervisión operativa y auditoría.</td>
                    <td className="px-4 py-3 text-muted-foreground">Ajustes de Inventario, Reportes, Gestión de Proveedores.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Operador</td>
                    <td className="px-4 py-3 text-muted-foreground">Gestión de flujo de mercadería.</td>
                    <td className="px-4 py-3 text-muted-foreground">Ingreso (F4), Traspasos, Consulta de Stock.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Recepcionista</td>
                    <td className="px-4 py-3 text-muted-foreground">Validación de llegada en almacén.</td>
                    <td className="px-4 py-3 text-muted-foreground">Validar Traspasos, Consulta de Stock local.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'search':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-2xl font-bold text-primary">Búsqueda de Productos</h3>
            <div className="space-y-4">
              <p className="text-muted-foreground">La sección de Inventario permite localizar rápidamente cualquier SKU o artículo.</p>
              <div className="bg-card border border-border p-4 rounded-lg flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold">1</div>
                  <p className="text-sm">Vaya al módulo <span className="font-semibold italic">Inventario</span> en la barra lateral.</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold">2</div>
                  <p className="text-sm">Utilice la barra de búsqueda para filtrar por <span className="font-semibold">Nombre, SKU o EAN</span>.</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold">3</div>
                  <p className="text-sm">Filtre por <span className="font-semibold">Categoría o Almacén</span> para una búsqueda más granular.</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'entry':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-2xl font-bold text-primary">Ingreso de Mercadería (F4)</h3>
            <div className="space-y-4">
              <p className="text-muted-foreground">Este flujo registra la entrada de stock proveniente de proveedores externos.</p>
              <div className="space-y-3">
                <div className="p-4 border border-border rounded-lg bg-accent/30">
                  <h4 className="font-semibold text-sm mb-2">Instrucciones:</h4>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Seleccione el <span className="text-foreground font-medium">Proveedor</span> de la lista desplegable.</li>
                    <li>Indique el <span className="text-foreground font-medium">Almacén de destino</span>.</li>
                    <li>Escanee o agregue los productos indicando la cantidad recibida.</li>
                    <li>Revise los totales y presione <span className="text-foreground font-medium">"Registrar Ingreso"</span>.</li>
                  </ul>
                </div>
                <div className="flex items-start gap-3 p-4 bg-warning/10 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                  <p className="text-xs text-warning-foreground">
                    El sistema valida automáticamente que las cantidades sean positivas y que todos los campos requeridos estén completos antes de permitir el registro.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'transfers':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-2xl font-bold text-primary">Traspasos y Recepción</h3>
            <p className="text-muted-foreground text-sm">El sistema maneja un flujo logístico de dos pasos para movimientos internos:</p>
            <div className="relative pl-8 border-l-2 border-border space-y-8">
              <div className="relative">
                <div className="absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-primary border-4 border-background" />
                <h4 className="font-bold text-sm">Paso 1: Solicitud de Traspaso (Operador/Admin)</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Se selecciona origen, destino y productos. El stock se marca como "En Tránsito".
                </p>
              </div>
              <div className="relative">
                <div className="absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-secondary border-4 border-background" />
                <h4 className="font-bold text-sm">Paso 2: Recepción (Recepcionista)</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  El recepcionista del almacén destino recibe una notificación, inspecciona la mercadería y valida la recepción para que el stock impacte físicamente en su sistema local.
                </p>
              </div>
            </div>
          </div>
        );
      case 'adjustment':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-2xl font-bold text-primary">Ajuste de Inventario (F11)</h3>
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Utilizado para corregir discrepancias físicas detectadas en auditorías o por merma.
              </p>
              <div className="bg-destructive/5 border border-destructive/20 p-4 rounded-lg">
                <h4 className="text-destructive font-bold text-sm mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Control de Auditoría
                </h4>
                <p className="text-xs text-destructive-foreground">
                  Cada ajuste requiere un <span className="font-bold">Motivo</span> detallado y el nombre del responsable. 
                  Este módulo está restringido a roles de Gerente y Administrador.
                </p>
              </div>
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-2xl font-bold text-primary">Reportes y Exportación</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Generación de Informes
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-2">
                  <p>Acceda a <span className="font-medium text-foreground">Reportes</span> para ver KPIs en tiempo real:</p>
                  <ul className="list-disc list-inside">
                    <li>Valorización de Inventario</li>
                    <li>Movimientos por Almacén</li>
                    <li>Ranking de Proveedores</li>
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Download className="w-4 h-4 text-success" />
                    Exportación de Datos
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-2">
                  <p>Todas las tablas principales (Inventario, Historial, Reportes) incluyen botones de exportación:</p>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-success/5 text-success border-success/20">CSV</Badge>
                    <Badge variant="outline" className="bg-destructive/5 text-destructive border-destructive/20">PDF</Badge>
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">Excel</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-primary">
            <BookOpen className="w-6 h-6" />
            Manual del Usuario
          </h1>
          <p className="text-sm text-muted-foreground">Documentación técnica y operativa para el personal de "La Escuela"</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="hidden md:flex">
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
          <Button size="sm" className="hidden md:flex bg-primary hover:bg-primary/90">
            <Download className="w-4 h-4 mr-2" />
            PDF Completo
          </Button>
        </div>
      </div>

      <Separator />

      <div className="flex-1 flex gap-8 overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="w-64 shrink-0 flex flex-col gap-1 overflow-y-auto pr-2 border-r border-border">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-md transition-all text-sm group text-left",
                  isActive 
                    ? "bg-primary text-primary-foreground font-medium shadow-sm" 
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-muted-foreground group-hover:text-primary")} />
                  <span>{section.title}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4" />}
              </button>
            );
          })}
        </aside>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pr-4">
          <div className="max-w-3xl pb-10">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
