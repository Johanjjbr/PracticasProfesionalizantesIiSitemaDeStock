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
  PackagePlus, Truck, CheckCircle2, ClipboardList, Search,
  Building2, Package, Warehouse, FileText, DollarSign, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

type Step = 1 | 2 | 3;

interface ReceiptForm {
  supplierId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  warehouse: string;
  invoiceNumber: string;
  notes: string;
}

const emptyForm = (): ReceiptForm => ({
  supplierId: '',
  productId: '',
  quantity: 1,
  unitPrice: 0,
  warehouse: '',
  invoiceNumber: '',
  notes: '',
});

const STEP_LABELS = [
  { step: 1, label: 'Proveedor y Factura', icon: Truck },
  { step: 2, label: 'Producto y Cantidad', icon: Package },
  { step: 3, label: 'Confirmación', icon: CheckCircle2 },
];

export default function GoodsReceipt() {
  const { suppliers, products, goodsReceipts, addGoodsReceipt, user } = useApp();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState<ReceiptForm>(emptyForm());
  const [searchHistory, setSearchHistory] = useState('');

  const activeSuppliers = suppliers.filter(s => s.status === 'active');
  const selectedSupplier = suppliers.find(s => s.id === formData.supplierId);
  const selectedProduct = products.find(p => p.id === formData.productId);

  // Available warehouses from products
  const warehouses = Array.from(new Set(products.map(p => p.warehouse)));

  // Products filtered to those in selected warehouse (or all if no warehouse selected)
  const availableProducts = formData.warehouse
    ? products.filter(p => p.warehouse === formData.warehouse && p.isActive !== false)
    : products.filter(p => p.isActive !== false);

  const totalAmount = formData.quantity * formData.unitPrice;

  const canProceedStep1 = formData.supplierId !== '';
  const canProceedStep2 = formData.productId !== '' && formData.quantity > 0 && formData.warehouse !== '';

  const handleNext = () => {
    if (currentStep === 1 && !canProceedStep1) {
      toast.error('Seleccione un proveedor para continuar');
      return;
    }
    if (currentStep === 2 && !canProceedStep2) {
      toast.error('Complete el producto, cantidad y almacén destino');
      return;
    }
    setCurrentStep((prev) => (prev + 1) as Step);
  };

  const handleBack = () => {
    setCurrentStep((prev) => (prev - 1) as Step);
  };

  const handleSubmit = () => {
    if (!selectedSupplier || !selectedProduct) return;

    addGoodsReceipt({
      supplierId: formData.supplierId,
      supplierName: selectedSupplier.name,
      productId: formData.productId,
      productName: selectedProduct.name,
      sku: selectedProduct.sku,
      quantity: formData.quantity,
      unitPrice: formData.unitPrice || selectedProduct.unitPrice,
      totalAmount,
      warehouse: formData.warehouse,
      invoiceNumber: formData.invoiceNumber || undefined,
      notes: formData.notes || undefined,
      operator: user?.name || 'Sistema',
    });

    toast.success('Ingreso de mercadería registrado exitosamente', {
      description: `${formData.quantity} ${selectedProduct.unitOfMeasure || 'unidades'} de ${selectedProduct.name}`,
    });

    setFormData(emptyForm());
    setCurrentStep(1);
  };

  // Filter history
  const filteredHistory = goodsReceipts.filter(r =>
    r.productName.toLowerCase().includes(searchHistory.toLowerCase()) ||
    r.supplierName.toLowerCase().includes(searchHistory.toLowerCase()) ||
    (r.invoiceNumber || '').toLowerCase().includes(searchHistory.toLowerCase()) ||
    r.sku.toLowerCase().includes(searchHistory.toLowerCase())
  );

  const canEdit = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'operator';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl">Ingreso de Mercadería</h1>
          <p className="text-sm text-muted-foreground">Registro de recepción de productos por proveedor</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <ClipboardList className="w-3 h-3 mr-1" />
            {goodsReceipts.length} ingresos registrados
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Panel */}
        {canEdit && (
          <div className="lg:col-span-2 space-y-4">
            {/* Stepper */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                {STEP_LABELS.map(({ step, label, icon: Icon }, idx) => (
                  <div key={step} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors ${
                        currentStep > step ? 'bg-success border-success text-success-foreground' :
                        currentStep === step ? 'bg-primary border-primary text-primary-foreground' :
                        'bg-background border-muted text-muted-foreground'
                      }`}>
                        {currentStep > step ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                      </div>
                      <span className={`text-xs mt-1 text-center leading-tight ${currentStep === step ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                        {label}
                      </span>
                    </div>
                    {idx < STEP_LABELS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 mb-5 rounded ${currentStep > step ? 'bg-success' : 'bg-muted'}`} />
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Step 1: Supplier & Invoice */}
            {currentStep === 1 && (
              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-5 h-5 text-primary" />
                  <h3 className="text-base">Seleccionar Proveedor</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplier">Proveedor *</Label>
                  <Select value={formData.supplierId} onValueChange={(v) => setFormData({ ...formData, supplierId: v })}>
                    <SelectTrigger id="supplier">
                      <SelectValue placeholder="Seleccionar proveedor activo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {activeSuppliers.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          <div className="flex flex-col">
                            <span>{s.name}</span>
                            {s.cuit && <span className="text-xs text-muted-foreground">CUIT: {s.cuit}</span>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedSupplier && (
                  <div className="bg-accent/50 rounded-md p-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedSupplier.name}</span>
                      {selectedSupplier.fantasyName && (
                        <span className="text-muted-foreground">({selectedSupplier.fantasyName})</span>
                      )}
                    </div>
                    {selectedSupplier.contact && (
                      <p className="text-xs text-muted-foreground ml-6">Contacto: {selectedSupplier.contact}</p>
                    )}
                    {selectedSupplier.paymentTerm && (
                      <p className="text-xs text-muted-foreground ml-6">Pago: {selectedSupplier.paymentTerm}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">Número de Factura / Remito</Label>
                  <Input
                    id="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    placeholder="FAC-2026-001 o REM-00123"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={handleNext} disabled={!canProceedStep1}>
                    Siguiente
                  </Button>
                </div>
              </Card>
            )}

            {/* Step 2: Product & Quantity */}
            {currentStep === 2 && (
              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-primary" />
                  <h3 className="text-base">Producto y Destino</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warehouse">Almacén Destino *</Label>
                  <Select value={formData.warehouse} onValueChange={(v) => setFormData({ ...formData, warehouse: v, productId: '' })}>
                    <SelectTrigger id="warehouse">
                      <SelectValue placeholder="Seleccionar almacén..." />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map(wh => <SelectItem key={wh} value={wh}>{wh}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product">Producto *</Label>
                  <Select value={formData.productId} onValueChange={(v) => {
                    const prod = products.find(p => p.id === v);
                    setFormData({ ...formData, productId: v, unitPrice: prod?.lastPurchasePrice || prod?.unitPrice || 0 });
                  }}>
                    <SelectTrigger id="product">
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

                {selectedProduct && (
                  <div className="bg-accent/50 rounded-md p-3 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Stock actual</p>
                      <p className={`font-medium ${selectedProduct.currentStock < selectedProduct.minStock ? 'text-destructive' : ''}`}>
                        {selectedProduct.currentStock} {selectedProduct.unitOfMeasure}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Stock mínimo</p>
                      <p className="font-medium">{selectedProduct.minStock} {selectedProduct.unitOfMeasure}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ubicación</p>
                      <p className="font-medium">{selectedProduct.location || '—'}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Cantidad *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    />
                    {selectedProduct && (
                      <p className="text-xs text-muted-foreground">Unidad: {selectedProduct.unitOfMeasure || 'Unidad'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unitPriceReceipt">Precio Unitario ({selectedProduct?.currency || 'ARS'})</Label>
                    <Input
                      id="unitPriceReceipt"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.unitPrice}
                      onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                    />
                  </div>
                </div>

                {formData.quantity > 0 && formData.unitPrice > 0 && (
                  <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-md p-3">
                    <span className="text-sm">Total del ingreso:</span>
                    <span className="font-medium">{selectedProduct?.currency || 'ARS'} {totalAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notesReceipt">Notas</Label>
                  <Textarea
                    id="notesReceipt"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Observaciones del ingreso..."
                    rows={2}
                  />
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={handleBack}>Anterior</Button>
                  <Button onClick={handleNext} disabled={!canProceedStep2}>Siguiente</Button>
                </div>
              </Card>
            )}

            {/* Step 3: Confirmation */}
            {currentStep === 3 && selectedSupplier && selectedProduct && (
              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <h3 className="text-base">Confirmar Ingreso</h3>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-accent/40 rounded-md p-3 space-y-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Truck className="w-3 h-3" /> Proveedor</p>
                      <p className="text-sm font-medium">{selectedSupplier.name}</p>
                      {formData.invoiceNumber && (
                        <p className="text-xs text-muted-foreground">Factura: {formData.invoiceNumber}</p>
                      )}
                    </div>
                    <div className="bg-accent/40 rounded-md p-3 space-y-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Warehouse className="w-3 h-3" /> Destino</p>
                      <p className="text-sm font-medium">{formData.warehouse}</p>
                      {selectedProduct.location && (
                        <p className="text-xs text-muted-foreground">{selectedProduct.location}</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-accent/40 rounded-md p-3 space-y-2">
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Package className="w-3 h-3" /> Producto</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-0.5 rounded">{selectedProduct.sku}</code>
                      <span className="text-sm font-medium">{selectedProduct.name}</span>
                    </div>
                    {selectedProduct.description && (
                      <p className="text-xs text-muted-foreground">{selectedProduct.description}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-accent/40 rounded-md p-3 text-center">
                      <p className="text-xs text-muted-foreground">Cantidad</p>
                      <p className="text-xl font-medium">{formData.quantity}</p>
                      <p className="text-xs text-muted-foreground">{selectedProduct.unitOfMeasure}</p>
                    </div>
                    <div className="bg-accent/40 rounded-md p-3 text-center">
                      <p className="text-xs text-muted-foreground">Precio Unit.</p>
                      <p className="text-base font-medium">{selectedProduct.currency || 'ARS'} {formData.unitPrice.toFixed(2)}</p>
                    </div>
                    <div className="bg-primary/10 border border-primary/20 rounded-md p-3 text-center">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-base font-medium text-primary">{selectedProduct.currency || 'ARS'} {totalAmount.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="bg-accent/40 rounded-md p-3 space-y-1">
                    <p className="text-xs text-muted-foreground">Impacto en stock</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">{selectedProduct.currentStock}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-success font-medium">{selectedProduct.currentStock + formData.quantity}</span>
                      <span className="text-xs text-muted-foreground">{selectedProduct.unitOfMeasure}</span>
                      {selectedProduct.currentStock < selectedProduct.minStock &&
                       (selectedProduct.currentStock + formData.quantity) >= selectedProduct.minStock && (
                        <Badge variant="default" className="text-xs ml-auto">Repone stock crítico</Badge>
                      )}
                    </div>
                  </div>

                  {formData.notes && (
                    <div className="bg-accent/40 rounded-md p-3">
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><FileText className="w-3 h-3" /> Notas</p>
                      <p className="text-xs">{formData.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={handleBack}>Anterior</Button>
                  <Button onClick={handleSubmit} className="gap-2">
                    <PackagePlus className="w-4 h-4" />
                    Registrar Ingreso
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Stats Panel */}
        <div className="space-y-4">
          <Card className="p-4 space-y-3">
            <p className="text-sm font-medium">Resumen del día</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Ingresos hoy</span>
                <Badge variant="outline">
                  {goodsReceipts.filter(r => r.createdAt.startsWith(new Date().toISOString().slice(0, 10))).length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Total registrado</span>
                <span className="text-xs font-medium">{goodsReceipts.length} ingresos</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Proveedores activos</span>
                <span className="text-xs font-medium">{activeSuppliers.length}</span>
              </div>
            </div>
          </Card>

          <Card className="p-4 space-y-2">
            <p className="text-sm font-medium">Productos con stock crítico</p>
            {products.filter(p => p.currentStock < p.minStock && p.isActive !== false).slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center justify-between text-xs p-1.5 rounded bg-destructive/10">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-muted-foreground">{p.sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-destructive font-medium">{p.currentStock}</p>
                  <p className="text-muted-foreground">/{p.minStock}</p>
                </div>
              </div>
            ))}
            {products.filter(p => p.currentStock < p.minStock && p.isActive !== false).length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">Sin productos críticos</p>
            )}
          </Card>
        </div>
      </div>

      {/* History */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-base font-medium">Historial de Ingresos</h3>
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
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground">Proveedor</th>
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground">Producto</th>
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground">SKU</th>
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground">Cantidad</th>
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground">Precio Unit.</th>
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground">Total</th>
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground">Almacén</th>
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground">Factura</th>
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground">Operador</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map(receipt => (
                <tr key={receipt.id} className="border-b border-border hover:bg-accent/50">
                  <td className="py-2.5 px-4 text-xs text-muted-foreground">
                    {new Date(receipt.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-2.5 px-4 text-sm">{receipt.supplierName}</td>
                  <td className="py-2.5 px-4 text-sm">{receipt.productName}</td>
                  <td className="py-2.5 px-4">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{receipt.sku}</code>
                  </td>
                  <td className="py-2.5 px-4 text-sm">{receipt.quantity}</td>
                  <td className="py-2.5 px-4 text-sm">{receipt.unitPrice.toFixed(2)}</td>
                  <td className="py-2.5 px-4 text-sm font-medium">{receipt.totalAmount.toFixed(2)}</td>
                  <td className="py-2.5 px-4 text-sm">{receipt.warehouse}</td>
                  <td className="py-2.5 px-4 text-xs text-muted-foreground">{receipt.invoiceNumber || '—'}</td>
                  <td className="py-2.5 px-4 text-xs text-muted-foreground">{receipt.operator}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredHistory.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No se encontraron ingresos</p>
          </div>
        )}
      </Card>
    </div>
  );
}
