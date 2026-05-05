import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { FileText, Download, Calendar } from 'lucide-react';

export default function Reports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Reportes y Análisis</h1>
        <p className="text-sm text-muted-foreground">Generación de informes y exportación de datos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <FileText className="w-8 h-8 text-primary mb-3" />
          <h3 className="text-lg mb-2">Reporte de Inventario</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Listado completo de productos con valores y cantidades
          </p>
          <Button className="w-full" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Generar PDF
          </Button>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <FileText className="w-8 h-8 text-success mb-3" />
          <h3 className="text-lg mb-2">Movimientos del Mes</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Registro de entradas, salidas y traspasos
          </p>
          <Button className="w-full" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Generar Excel
          </Button>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <FileText className="w-8 h-8 text-warning mb-3" />
          <h3 className="text-lg mb-2">Alertas de Stock</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Productos con stock bajo mínimo requerido
          </p>
          <Button className="w-full" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Generar PDF
          </Button>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <FileText className="w-8 h-8 text-destructive mb-3" />
          <h3 className="text-lg mb-2">Valorización de Stock</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Valor total del inventario por almacén
          </p>
          <Button className="w-full" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Generar PDF
          </Button>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <Calendar className="w-8 h-8 text-primary mb-3" />
          <h3 className="text-lg mb-2">Reporte Personalizado</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Configurar fechas y filtros personalizados
          </p>
          <Button className="w-full" variant="outline">
            Configurar
          </Button>
        </Card>
      </div>
    </div>
  );
}
