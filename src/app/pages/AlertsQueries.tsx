import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  AlertTriangle, AlertCircle, Info, Bell, Search, Package, Warehouse,
  TrendingDown, Clock, Archive, Filter, ChevronRight, SlidersHorizontal,
  PackageX, CheckCircle2, XCircle, Calendar
} from 'lucide-react';

type AlertType = 'critical' | 'warning' | 'info';
type AlertCategory = 'stock' | 'transfer' | 'product' | 'adjustment';

interface Alert {
  id: string;
  type: AlertType;
  category: AlertCategory;
  title: string;
  description: string;
  productId?: string;
  productName?: string;
  warehouse?: string;
  timestamp: string;
  actionLabel?: string;
  actionPath?: string;
}

export default function AlertsQueries() {
  const { products, transfers, inventoryAdjustments, user } = useApp();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | AlertType>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | AlertCategory>('all');

  // Generate alerts from system data
  const alerts = useMemo<Alert[]>(() => {
    const generatedAlerts: Alert[] = [];

    // Stock crítico
    products.forEach(product => {
      if (product.isActive !== false && product.currentStock < product.minStock) {
        generatedAlerts.push({
          id: `stock-critical-${product.id}`,
          type: 'critical',
          category: 'stock',
          title: `Stock crítico: ${product.name}`,
          description: `Solo quedan ${product.currentStock} ${product.unitOfMeasure || 'unidades'} (mínimo: ${product.minStock})`,
          productId: product.id,
          productName: product.name,
          warehouse: product.warehouse,
          timestamp: product.lastUpdated,
          actionLabel: 'Ver producto',
          actionPath: `/inventory`,
        });
      }
    });

    // Stock bajo (entre mínimo y mínimo * 1.5)
    products.forEach(product => {
      if (product.isActive !== false &&
          product.currentStock >= product.minStock &&
          product.currentStock < product.minStock * 1.5) {
        generatedAlerts.push({
          id: `stock-low-${product.id}`,
          type: 'warning',
          category: 'stock',
          title: `Stock bajo: ${product.name}`,
          description: `Stock actual: ${product.currentStock} ${product.unitOfMeasure || 'unidades'} (mínimo: ${product.minStock})`,
          productId: product.id,
          productName: product.name,
          warehouse: product.warehouse,
          timestamp: product.lastUpdated,
          actionLabel: 'Ver producto',
          actionPath: `/inventory`,
        });
      }
    });

    // Traspasos pendientes de recepción
    transfers.forEach(transfer => {
      if (transfer.status === 'pending_reception') {
        const product = products.find(p => p.id === transfer.productId);
        generatedAlerts.push({
          id: `transfer-pending-${transfer.id}`,
          type: 'warning',
          category: 'transfer',
          title: `Traspaso pendiente de recepción`,
          description: `${transfer.quantity} ${product?.unitOfMeasure || 'unidades'} de ${transfer.product} → ${transfer.destinationWarehouse}`,
          productName: transfer.product,
          warehouse: transfer.destinationWarehouse,
          timestamp: transfer.createdAt,
          actionLabel: 'Ver traspaso',
          actionPath: user?.role === 'receptionist' ? '/reception' : '/transfers',
        });
      }
    });

    // Productos inactivos
    const inactiveCount = products.filter(p => p.isActive === false).length;
    if (inactiveCount > 0) {
      generatedAlerts.push({
        id: 'products-inactive',
        type: 'info',
        category: 'product',
        title: `Productos inactivos`,
        description: `Hay ${inactiveCount} producto${inactiveCount > 1 ? 's' : ''} marcado${inactiveCount > 1 ? 's' : ''} como inactivo${inactiveCount > 1 ? 's' : ''}`,
        timestamp: new Date().toISOString(),
        actionLabel: 'Ver inventario',
        actionPath: '/inventory',
      });
    }

    // Ajustes de inventario recientes (últimas 24h)
    const recentAdjustments = inventoryAdjustments.filter(adj => {
      const adjustmentDate = new Date(adj.createdAt);
      const dayAgo = new Date();
      dayAgo.setDate(dayAgo.getDate() - 1);
      return adjustmentDate >= dayAgo;
    });

    if (recentAdjustments.length > 0) {
      generatedAlerts.push({
        id: 'adjustments-recent',
        type: 'info',
        category: 'adjustment',
        title: `Ajustes de inventario recientes`,
        description: `${recentAdjustments.length} ajuste${recentAdjustments.length > 1 ? 's' : ''} realizados en las últimas 24 horas`,
        timestamp: new Date().toISOString(),
        actionLabel: 'Ver reportes',
        actionPath: '/reports',
      });
    }

    // Sort by priority and timestamp
    return generatedAlerts.sort((a, b) => {
      const priorityOrder = { critical: 0, warning: 1, info: 2 };
      if (priorityOrder[a.type] !== priorityOrder[b.type]) {
        return priorityOrder[a.type] - priorityOrder[b.type];
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [products, transfers, inventoryAdjustments, user]);

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch =
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (alert.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (alert.warehouse || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || alert.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || alert.category === categoryFilter;

    return matchesSearch && matchesType && matchesCategory;
  });

  // Quick search products
  const [quickSearchTerm, setQuickSearchTerm] = useState('');
  const quickSearchResults = products.filter(p =>
    p.isActive !== false && (
      p.name.toLowerCase().includes(quickSearchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(quickSearchTerm.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(quickSearchTerm.toLowerCase())
    )
  ).slice(0, 5);

  const getAlertIcon = (type: AlertType) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-destructive" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-warning" />;
      case 'info':
        return <Info className="w-5 h-5 text-primary" />;
    }
  };

  const getAlertBadgeVariant = (type: AlertType): 'destructive' | 'default' | 'secondary' => {
    switch (type) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'info':
        return 'secondary';
    }
  };

  const getCategoryIcon = (category: AlertCategory) => {
    switch (category) {
      case 'stock':
        return <Package className="w-4 h-4" />;
      case 'transfer':
        return <Warehouse className="w-4 h-4" />;
      case 'product':
        return <Archive className="w-4 h-4" />;
      case 'adjustment':
        return <SlidersHorizontal className="w-4 h-4" />;
    }
  };

  const getCategoryLabel = (category: AlertCategory) => {
    switch (category) {
      case 'stock':
        return 'Stock';
      case 'transfer':
        return 'Traspaso';
      case 'product':
        return 'Producto';
      case 'adjustment':
        return 'Ajuste';
    }
  };

  const criticalCount = alerts.filter(a => a.type === 'critical').length;
  const warningCount = alerts.filter(a => a.type === 'warning').length;
  const infoCount = alerts.filter(a => a.type === 'info').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl">Consultas y Alertas</h1>
          <p className="text-sm text-muted-foreground">Centro de notificaciones y búsqueda rápida</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="text-xs gap-1">
            <AlertTriangle className="w-3 h-3" />
            {criticalCount} críticas
          </Badge>
          <Badge variant="default" className="text-xs gap-1">
            <AlertCircle className="w-3 h-3" />
            {warningCount} advertencias
          </Badge>
          <Badge variant="secondary" className="text-xs gap-1">
            <Info className="w-3 h-3" />
            {infoCount} informativas
          </Badge>
        </div>
      </div>

      {/* Quick Search */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Search className="w-5 h-5 text-primary" />
          <h3 className="text-base font-medium">Búsqueda Rápida de Productos</h3>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por SKU, nombre o descripción..."
            value={quickSearchTerm}
            onChange={(e) => setQuickSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        {quickSearchTerm && (
          <div className="mt-3 space-y-2">
            {quickSearchResults.length > 0 ? (
              quickSearchResults.map(product => {
                const isCritical = product.currentStock < product.minStock;
                const isLow = product.currentStock >= product.minStock && product.currentStock < product.minStock * 1.5;
                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-accent/30 rounded-md hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => navigate('/inventory')}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {isCritical && <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />}
                      {isLow && <AlertCircle className="w-4 h-4 text-warning flex-shrink-0" />}
                      {!isCritical && !isLow && <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{product.sku}</code>
                          <p className="text-sm font-medium truncate">{product.name}</p>
                          <Badge variant="outline" className="text-xs">{product.category}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{product.warehouse}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`text-sm font-medium ${isCritical ? 'text-destructive' : isLow ? 'text-warning' : ''}`}>
                          Stock: {product.currentStock}
                        </p>
                        <p className="text-xs text-muted-foreground">Mín: {product.minStock}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4 text-sm text-muted-foreground">
                <PackageX className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No se encontraron productos</p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar alertas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo de alerta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="critical">Críticas</SelectItem>
              <SelectItem value="warning">Advertencias</SelectItem>
              <SelectItem value="info">Informativas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              <SelectItem value="stock">Stock</SelectItem>
              <SelectItem value="transfer">Traspasos</SelectItem>
              <SelectItem value="product">Productos</SelectItem>
              <SelectItem value="adjustment">Ajustes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map(alert => (
            <Card key={alert.id} className={`p-4 hover:shadow-md transition-shadow ${
              alert.type === 'critical' ? 'border-l-4 border-l-destructive' :
              alert.type === 'warning' ? 'border-l-4 border-l-warning' :
              'border-l-4 border-l-primary'
            }`}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-0.5">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-medium">{alert.title}</h3>
                        <Badge variant={getAlertBadgeVariant(alert.type)} className="text-xs">
                          {alert.type === 'critical' ? 'Crítica' :
                           alert.type === 'warning' ? 'Advertencia' :
                           'Info'}
                        </Badge>
                        <Badge variant="outline" className="text-xs gap-1">
                          {getCategoryIcon(alert.category)}
                          {getCategoryLabel(alert.category)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {alert.warehouse && (
                        <div className="flex items-center gap-1">
                          <Warehouse className="w-3 h-3" />
                          <span>{alert.warehouse}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(alert.timestamp).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                      </div>
                    </div>
                    {alert.actionLabel && alert.actionPath && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(alert.actionPath!)}
                      >
                        {alert.actionLabel}
                        <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-12">
            <div className="text-center text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-base">No hay alertas que coincidan con los filtros</p>
              <p className="text-sm mt-1">Intenta ajustar los criterios de búsqueda</p>
            </div>
          </Card>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-destructive/10 rounded-md flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Alertas Críticas</p>
              <p className="text-2xl font-medium text-destructive">{criticalCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warning/10 rounded-md flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Advertencias</p>
              <p className="text-2xl font-medium text-warning">{warningCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center">
              <Info className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Informativas</p>
              <p className="text-2xl font-medium">{infoCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-md flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Alertas</p>
              <p className="text-2xl font-medium">{alerts.length}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
