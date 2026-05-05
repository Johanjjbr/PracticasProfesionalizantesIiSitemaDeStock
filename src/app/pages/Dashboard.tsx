import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Package, DollarSign, AlertTriangle, TrendingUp, Warehouse, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router';

export default function Dashboard() {
  const { products, transfers, movements } = useApp();
  const navigate = useNavigate();

  // Calculate KPIs
  const totalStock = products.reduce((sum, p) => sum + p.currentStock, 0);
  const totalValue = products.reduce((sum, p) => sum + (p.currentStock * p.unitPrice), 0);
  const criticalProducts = products.filter(p => p.currentStock < p.minStock);
  const activeTransfers = transfers.filter(t => t.status === 'in_transit').length;

  // Stock by category
  const categoryData = products.reduce((acc, p) => {
    const existing = acc.find(item => item.name === p.category);
    if (existing) {
      existing.value += p.currentStock;
    } else {
      acc.push({ name: p.category, value: p.currentStock });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  // Recent movements data
  const movementsByType = [
    { name: 'Entradas', value: movements.filter(m => m.type === 'in').length, color: '#16a34a' },
    { name: 'Salidas', value: movements.filter(m => m.type === 'out').length, color: '#dc2626' },
    { name: 'Traspasos', value: movements.filter(m => m.type === 'transfer').length, color: '#f59e0b' },
  ];

  const COLORS = ['#1e3a8a', '#16a34a', '#f59e0b', '#dc2626', '#64748b'];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Stock Total</p>
              <p className="text-3xl mt-2">{totalStock.toLocaleString()}</p>
              <p className="text-xs text-success mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +12% vs mes anterior
              </p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Valor de Inventario</p>
              <p className="text-3xl mt-2">${totalValue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-xs text-success mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +8.5% vs mes anterior
              </p>
            </div>
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-success" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Alertas Críticas</p>
              <p className="text-3xl mt-2">{criticalProducts.length}</p>
              <p className="text-xs text-destructive mt-1">Productos bajo mínimo</p>
            </div>
            <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Traspasos Activos</p>
              <p className="text-3xl mt-2">{activeTransfers}</p>
              <p className="text-xs text-warning mt-1">En tránsito</p>
            </div>
            <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
              <Warehouse className="w-6 h-6 text-warning" />
            </div>
          </div>
        </Card>
      </div>

      {/* Critical Alerts Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg">Alertas Críticas de Stock</h3>
            <p className="text-sm text-muted-foreground">Productos por debajo del stock mínimo</p>
          </div>
          <Button onClick={() => navigate('/inventory')} variant="outline" size="sm">
            Ver Inventario
          </Button>
        </div>
        
        {criticalProducts.length > 0 ? (
          <div className="space-y-3">
            {criticalProducts.map(product => {
              const deficit = product.minStock - product.currentStock;
              const percentage = (product.currentStock / product.minStock) * 100;
              
              return (
                <div key={product.id} className="flex items-center justify-between p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                      <div>
                        <p className="text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">SKU: {product.sku} • {product.warehouse}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm">Stock: <span className="text-destructive">{product.currentStock}</span> / {product.minStock}</p>
                      <div className="w-32 h-2 bg-muted rounded-full mt-1">
                        <div 
                          className="h-full bg-destructive rounded-full" 
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <ArrowDownRight className="w-3 h-3" />
                      -{deficit} unidades
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No hay productos con stock crítico</p>
          </div>
        )}
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock by Category */}
        <Card className="p-6">
          <h3 className="text-lg mb-4">Distribución de Stock por Categoría</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`pie-cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Movement Types */}
        <Card className="p-6">
          <h3 className="text-lg mb-4">Movimientos de Inventario</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={movementsByType}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#1e3a8a" radius={[8, 8, 0, 0]}>
                {movementsByType.map((entry, index) => (
                  <Cell key={`bar-cell-${entry.name}-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent Movements */}
      <Card className="p-6">
        <h3 className="text-lg mb-4">Movimientos Recientes</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm text-muted-foreground">Tipo</th>
                <th className="text-left py-3 px-4 text-sm text-muted-foreground">Producto</th>
                <th className="text-left py-3 px-4 text-sm text-muted-foreground">Cantidad</th>
                <th className="text-left py-3 px-4 text-sm text-muted-foreground">Almacén</th>
                <th className="text-left py-3 px-4 text-sm text-muted-foreground">Operador</th>
                <th className="text-left py-3 px-4 text-sm text-muted-foreground">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {movements.slice(0, 5).map(movement => (
                <tr key={movement.id} className="border-b border-border hover:bg-accent/50">
                  <td className="py-3 px-4">
                    <Badge 
                      variant={movement.type === 'in' ? 'default' : movement.type === 'out' ? 'destructive' : 'secondary'}
                      className={
                        movement.type === 'in' ? 'bg-success hover:bg-success/80' : 
                        movement.type === 'transfer' ? 'bg-warning hover:bg-warning/80' : ''
                      }
                    >
                      {movement.type === 'in' ? 'Entrada' : movement.type === 'out' ? 'Salida' : 'Traspaso'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm">{movement.productName}</td>
                  <td className="py-3 px-4 text-sm">{movement.quantity}</td>
                  <td className="py-3 px-4 text-sm">{movement.warehouse}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{movement.operator}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {new Date(movement.timestamp).toLocaleDateString('es-ES')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
