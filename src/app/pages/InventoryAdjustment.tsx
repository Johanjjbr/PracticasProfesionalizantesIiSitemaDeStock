import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import {
  SlidersHorizontal, TrendingUp, TrendingDown, CheckCircle2,
  AlertTriangle, Search, Package, ClipboardList, History
} from 'lucide-react';
import { toast } from 'sonner';

const ADJUSTMENT_REASONS = {
  decrease: [
    'Producto dañado',
    'Merma / Vencimiento',
    'Error de conteo (exceso registrado)',
    'Robo / Pérdida',
    'Devolución a proveedor',
    'Baja de inventario',
    'Otro',
  ],
  increase: [
    'Error de conteo (faltante registrado)',
    'Ingreso no registrado',
    'Devolución de cliente',
    'Corrección de inventario',
    'Otro',
  ],
};

interface AdjustmentForm {
  productId: string;
  warehouse: string;
  type: 'increase' | 'decrease';
  adjustmentQuantity: number;
  reason: string;
  notes: string;
}

const emptyForm = (): AdjustmentForm => ({
  productId: '',
  warehouse: '',
  type: 'decrease',
  adjustmentQuantity: 0,
  reason: '',
  notes: '',
});

export default function InventoryAdjustment() {
  const { products, inventoryAdjustments, addInventoryAdjustment, user } = useApp();
  const [formData, setFormData] = useState<AdjustmentForm>(emptyForm());
  const [searchHistory, setSearchHistory] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const warehouses = Array.from(new Set(products.map(p => p.warehouse)));

  const availableProducts = formData.warehouse
    ? products.filter(p => p.warehouse === formData.warehouse && p.isActive !== false)
    : products.filter(p => p.isActive !== false);

  const selectedProduct = products.find(p => p.id === formData.productId);

  const newStock = selectedProduct
    ? formData.type === 'increase'
      ? selectedProduct.currentStock + formData.adjustmentQuantity
      : selectedProduct.currentStock - formData.adjustmentQuantity
    : 0;

  const isNewStockNegative = newStock < 0;

  const canSubmit =
    formData.productId !== '' &&
    formData.warehouse !== '' &&
    formData.adjustmentQuantity > 0 &&
    formData.reason !== '' &&
    !isNewStockNegative &&
    confirmed;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !canSubmit) return;

    addInventoryAdjustment({
      productId: formData.productId,
      productName: selectedProduct.name,
      sku: selectedProduct.sku,
      warehouse: formData.warehouse,
      previousStock: selectedProduct.currentStock,
      adjustmentQuantity: formData.type === 'increase' ? formData.adjustmentQuantity : -formData.adjustmentQuantity,
      newStock,
      reason: formData.reason,
      type: formData.type,
      operator: user?.name || 'Sistema',
      notes: formData.notes || undefined,
    });

    toast.success('Ajuste de inventario registrado', {
      description: `${selectedProduct.name}: ${selectedProduct.currentStock} → ${newStock} ${selectedProduct.unitOfMeasure || 'unidades'}`,
    });

    setFormData(emptyForm());
    setConfirmed(false);
  };

  const handleProductChange = (productId: string) => {
    setFormData({ ...formData, productId, adjustmentQuantity: 0, reason: '' });
    setConfirmed(false);
  };

  const handleWarehouseChange = (warehouse: string) => {
    setFormData({ ...formData, warehouse, productId: '', adjustmentQuantity: 0, reason: '' });
    setConfirmed(false);
  };

  const filteredHistory = inventoryAdjustments.filter(a =>
    a.productName.toLowerCase().includes(searchHistory.toLowerCase()) ||
    a.sku.toLowerCase().includes(searchHistory.toLowerCase()) ||
    a.reason.toLowerCase().includes(searchHistory.toLowerCase()) ||
    a.operator.toLowerCase().includes(searchHistory.toLowerCase())
  );

  const canEdit = user?.role === 'admin' || user?.role === 'manager';

  const reasons = ADJUSTMENT_REASONS[formData.type];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl">Ajuste de Inventario</h1>
          <p className="text-sm text-muted-foreground">Corrección manual de cantidades en stock</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <History className="w-3 h-3 mr-1" />
            {inventoryAdjustments.length} ajustes registrados
          </Badge>
          {!canEdit && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Solo Admin / Gerente
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          {!canEdit ? (
            <Card className="p-8 text-center space-y-3">
              <AlertTriangle className="w-12 h-12 mx-auto text-warning opacity-70" />
              <p className="text-base">Acceso Restringido</p>
              <p className="text-sm text-muted-foreground">Solo los roles Admin y Gerente pueden realizar ajustes de inventario.</p>
            </Card>
          ) : (
            <form onSubmit={handleSubmit}>
              <Card className="p-6 space-y-5">
                <div className="flex items-center gap-2 mb-1">
                  <SlidersHorizontal className="w-5 h-5 text-primary" />
                  <h3 className="text-base">Nuevo Ajuste</h3>
                </div>

                {/* Type selector */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setFormData({ ...formData, type: 'increase', reason: '', adjustmentQuantity: 0 }); setConfirmed(false); }}
                    className={`flex items-center justify-center gap-2 p-3 rounded-md border-2 transition-colors ${
                      formData.type === 'increase'
                        ? 'border-success bg-success/10 text-success'
                        : 'border-border text-muted-foreground hover:border-muted-foreground'
                    }`}
                  >
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-sm font-medium">Incremento</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setFormData({ ...formData, type: 'decrease', reason: '', adjustmentQuantity: 0 }); setConfirmed(false); }}
                    className={`flex items-center justify-center gap-2 p-3 rounded-md border-2 transition-colors ${
                      formData.type === 'decrease'
                        ? 'border-destructive bg-destructive/10 text-destructive'
                        : 'border-border text-muted-foreground hover:border-muted-foreground'
                    }`}
                  >
                    <TrendingDown className="w-5 h-5" />
                    <span className="text-sm font-medium">Reducción</span>
                  </button>
                </div>

                {/* Warehouse */}
                <div className="space-y-2">
                  <Label htmlFor="adjWarehouse">Almacén *</Label>
                  <Select value={formData.warehouse} onValueChange={handleWarehouseChange}>
                    <SelectTrigger id="adjWarehouse">
                      <SelectValue placeholder="Seleccionar almacén..." />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map(wh => <SelectItem key={wh} value={wh}>{wh}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Product */}
                <div className="space-y-2">
                  <Label htmlFor="adjProduct">Producto *</Label>
                  <Select value={formData.productId} onValueChange={handleProductChange}>
                    <SelectTrigger id="adjProduct">
                      <SelectValue placeholder="Seleccionar producto..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProducts.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-muted px-1 rounded">{p.sku}</code>
                            <span>{p.name}</span>
                            {p.currentStock < p.minStock && (
                              <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Current stock info */}
                {selectedProduct && (
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-accent/40 rounded-md p-2.5 text-center">
                      <p className="text-muted-foreground">Stock actual</p>
                      <p className={`text-base font-medium mt-0.5 ${selectedProduct.currentStock < selectedProduct.minStock ? 'text-destructive' : ''}`}>
                        {selectedProduct.currentStock}
                      </p>
                      <p className="text-muted-foreground">{selectedProduct.unitOfMeasure}</p>
                    </div>
                    <div className="bg-accent/40 rounded-md p-2.5 text-center">
                      <p className="text-muted-foreground">Stock mínimo</p>
                      <p className="text-base font-medium mt-0.5">{selectedProduct.minStock}</p>
                      <p className="text-muted-foreground">{selectedProduct.unitOfMeasure}</p>
                    </div>
                    <div className={`rounded-md p-2.5 text-center border-2 ${
                      isNewStockNegative ? 'bg-destructive/10 border-destructive' :
                      formData.adjustmentQuantity > 0 && formData.type === 'increase' ? 'bg-success/10 border-success' :
                      formData.adjustmentQuantity > 0 ? 'bg-warning/10 border-warning' : 'bg-accent/40 border-border'
                    }`}>
                      <p className="text-muted-foreground">Stock resultante</p>
                      <p className={`text-base font-medium mt-0.5 ${isNewStockNegative ? 'text-destructive' : ''}`}>
                        {formData.adjustmentQuantity > 0 ? newStock : '—'}
                      </p>
                      <p className="text-muted-foreground">{selectedProduct.unitOfMeasure}</p>
                    </div>
                  </div>
                )}

                {isNewStockNegative && (
                  <div className="flex items-center gap-2 text-destructive bg-destructive/10 rounded-md p-3 text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>El ajuste resultaría en stock negativo. Reduzca la cantidad.</span>
                  </div>
                )}

                {/* Quantity */}
                <div className="space-y-2">
                  <Label htmlFor="adjQty">Cantidad a {formData.type === 'increase' ? 'Incrementar' : 'Reducir'} *</Label>
                  <Input
                    id="adjQty"
                    type="number"
                    min="1"
                    value={formData.adjustmentQuantity || ''}
                    onChange={(e) => { setFormData({ ...formData, adjustmentQuantity: Number(e.target.value) }); setConfirmed(false); }}
                    placeholder="0"
                    className={isNewStockNegative ? 'border-destructive' : ''}
                  />
                </div>

                {/* Reason */}
                <div className="space-y-2">
                  <Label htmlFor="adjReason">Motivo del Ajuste *</Label>
                  <Select value={formData.reason} onValueChange={(v) => { setFormData({ ...formData, reason: v }); setConfirmed(false); }}>
                    <SelectTrigger id="adjReason">
                      <SelectValue placeholder="Seleccionar motivo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {reasons.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="adjNotes">Observaciones</Label>
                  <Textarea
                    id="adjNotes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Descripción adicional del ajuste..."
                    rows={3}
                  />
                </div>

                {/* Confirmation checkbox */}
                {formData.productId && formData.adjustmentQuantity > 0 && formData.reason && !isNewStockNegative && (
                  <div className="border border-warning rounded-md p-3 bg-warning/10">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={confirmed}
                        onChange={(e) => setConfirmed(e.target.checked)}
                        className="mt-0.5 w-4 h-4 flex-shrink-0"
                      />
                      <span className="text-sm">
                        Confirmo que el ajuste de <strong>{formData.type === 'increase' ? '+' : '-'}{formData.adjustmentQuantity}</strong> {selectedProduct?.unitOfMeasure || 'unidades'} de <strong>{selectedProduct?.name}</strong> es correcto y está autorizado.
                        {formData.reason && <> Motivo: <em>{formData.reason}</em>.</>}
                      </span>
                    </label>
                  </div>
                )}

                <Button type="submit" disabled={!canSubmit} className="w-full gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Registrar Ajuste
                </Button>
              </Card>
            </form>
          )}
        </div>

        {/* Stats */}
        <div className="space-y-4">
          <Card className="p-4 space-y-3">
            <p className="text-sm font-medium">Estadísticas</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Total ajustes</span>
                <span className="text-xs font-medium">{inventoryAdjustments.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-success" /> Incrementos
                </span>
                <span className="text-xs font-medium text-success">
                  {inventoryAdjustments.filter(a => a.type === 'increase').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingDown className="w-3 h-3 text-destructive" /> Reducciones
                </span>
                <span className="text-xs font-medium text-destructive">
                  {inventoryAdjustments.filter(a => a.type === 'decrease').length}
                </span>
              </div>
            </div>
          </Card>

          {/* Recent adjustments */}
          <Card className="p-4 space-y-3">
            <p className="text-sm font-medium">Últimos ajustes</p>
            {inventoryAdjustments.slice(0, 5).map(adj => (
              <div key={adj.id} className="flex items-start gap-2 text-xs border-b border-border pb-2 last:border-0 last:pb-0">
                <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${adj.type === 'increase' ? 'bg-success/20' : 'bg-destructive/20'}`}>
                  {adj.type === 'increase'
                    ? <TrendingUp className="w-3 h-3 text-success" />
                    : <TrendingDown className="w-3 h-3 text-destructive" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate">{adj.productName}</p>
                  <p className="text-muted-foreground">{adj.reason}</p>
                  <p className={`font-medium ${adj.type === 'increase' ? 'text-success' : 'text-destructive'}`}>
                    {adj.type === 'increase' ? '+' : ''}{adj.adjustmentQuantity} → {adj.newStock}
                  </p>
                </div>
              </div>
            ))}
            {inventoryAdjustments.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">Sin ajustes registrados</p>
            )}
          </Card>
        </div>
      </div>

      {/* History Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-base font-medium">Historial de Ajustes</h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar en historial..."
              value={searchHistory}
              onChange={(e) => setSearchHistory(e.target.value)}
              className="pl-9 h-8 text-sm"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground">Fecha</th>
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground">Tipo</th>
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground">Producto</th>
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground">SKU</th>
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground">Almacén</th>
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground">Stock Anterior</th>
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground">Ajuste</th>
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground">Stock Nuevo</th>
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground">Motivo</th>
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground">Operador</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map(adj => (
                <tr key={adj.id} className="border-b border-border hover:bg-accent/50">
                  <td className="py-2.5 px-4 text-xs text-muted-foreground">
                    {new Date(adj.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-2.5 px-4">
                    <Badge
                      variant={adj.type === 'increase' ? 'default' : 'destructive'}
                      className="text-xs gap-1"
                    >
                      {adj.type === 'increase'
                        ? <><TrendingUp className="w-3 h-3" /> Incremento</>
                        : <><TrendingDown className="w-3 h-3" /> Reducción</>
                      }
                    </Badge>
                  </td>
                  <td className="py-2.5 px-4 text-sm">{adj.productName}</td>
                  <td className="py-2.5 px-4">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{adj.sku}</code>
                  </td>
                  <td className="py-2.5 px-4 text-sm">{adj.warehouse}</td>
                  <td className="py-2.5 px-4 text-sm text-muted-foreground">{adj.previousStock}</td>
                  <td className="py-2.5 px-4">
                    <span className={`text-sm font-medium ${adj.type === 'increase' ? 'text-success' : 'text-destructive'}`}>
                      {adj.type === 'increase' ? '+' : ''}{adj.adjustmentQuantity}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-sm font-medium">{adj.newStock}</td>
                  <td className="py-2.5 px-4 text-xs">{adj.reason}</td>
                  <td className="py-2.5 px-4 text-xs text-muted-foreground">{adj.operator}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredHistory.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No se encontraron ajustes</p>
          </div>
        )}
      </Card>
    </div>
  );
}
