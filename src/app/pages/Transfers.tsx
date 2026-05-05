import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { ArrowRight, Package, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../components/ui/utils';

export default function Transfers() {
  const { transfers, products, createTransfer, updateTransferStatus, user } = useApp();
  const [isNewTransferOpen, setIsNewTransferOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 0,
    sourceWarehouse: '',
    destinationWarehouse: '',
  });

  const warehouses = Array.from(new Set(products.map(p => p.warehouse)));

  const steps = [
    { id: 0, title: 'Entrega', icon: Package, description: 'Seleccionar producto y origen' },
    { id: 1, title: 'Tránsito', icon: Truck, description: 'Confirmar cantidades y destino' },
    { id: 2, title: 'Recepción', icon: CheckCircle, description: 'Resumen y confirmación' },
  ];

  const handleNext = () => {
    if (currentStep === 0) {
      if (!formData.productId || !formData.sourceWarehouse || formData.quantity <= 0) {
        toast.error('Por favor complete todos los campos');
        return;
      }
      const product = products.find(p => p.id === formData.productId);
      if (product && product.currentStock < formData.quantity) {
        toast.error('Stock insuficiente en almacén de origen');
        return;
      }
    }
    if (currentStep === 1) {
      if (!formData.destinationWarehouse) {
        toast.error('Seleccione un almacén de destino');
        return;
      }
      if (formData.sourceWarehouse === formData.destinationWarehouse) {
        toast.error('El almacén de origen y destino no pueden ser el mismo');
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    const product = products.find(p => p.id === formData.productId);
    if (!product) return;

    createTransfer({
      product: product.name,
      quantity: formData.quantity,
      sourceWarehouse: formData.sourceWarehouse,
      destinationWarehouse: formData.destinationWarehouse,
      operator: user?.name || 'Unknown',
      estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

    toast.success('Traspaso creado exitosamente', {
      description: `Operador: ${user?.name}`,
    });

    resetForm();
    setIsNewTransferOpen(false);
  };

  const resetForm = () => {
    setFormData({
      productId: '',
      quantity: 0,
      sourceWarehouse: '',
      destinationWarehouse: '',
    });
    setCurrentStep(0);
  };

  const handleStatusChange = (transferId: string, newStatus: 'in_transit' | 'pending_reception' | 'completed' | 'cancelled') => {
    updateTransferStatus(transferId, newStatus);
    const statusText =
      newStatus === 'in_transit' ? 'en tránsito' :
      newStatus === 'pending_reception' ? 'pendiente de recepción' :
      newStatus === 'completed' ? 'completado' :
      'cancelado';

    toast.success(`Traspaso actualizado a ${statusText}`, {
      description: `Operador: ${user?.name}`,
    });
  };

  const selectedProduct = products.find(p => p.id === formData.productId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl">Traspasos entre Almacenes</h1>
          <p className="text-sm text-muted-foreground">Gestión de movimientos logísticos</p>
        </div>
        <Button onClick={() => setIsNewTransferOpen(true)}>
          <Package className="w-4 h-4 mr-2" />
          Nuevo Traspaso
        </Button>
      </div>

      {/* New Transfer Dialog */}
      <Dialog open={isNewTransferOpen} onOpenChange={(open) => {
        setIsNewTransferOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-3xl" aria-describedby="transfer-dialog-description">
          <DialogHeader>
            <DialogTitle>Nuevo Traspaso de Almacén</DialogTitle>
          </DialogHeader>
          <span id="transfer-dialog-description" className="sr-only">
            Formulario de tres pasos para crear un nuevo traspaso entre almacenes
          </span>

          {/* Stepper */}
          <div className="py-4">
            <div className="flex items-center justify-between mb-8">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === index;
                const isCompleted = currentStep > index;

                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors",
                          isActive && "bg-primary border-primary text-primary-foreground",
                          isCompleted && "bg-success border-success text-success-foreground",
                          !isActive && !isCompleted && "border-border text-muted-foreground"
                        )}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <p className={cn(
                        "text-sm mt-2",
                        isActive && "text-foreground",
                        !isActive && "text-muted-foreground"
                      )}>
                        {step.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={cn(
                        "h-0.5 flex-1 mx-4",
                        isCompleted ? "bg-success" : "bg-border"
                      )} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Step Content */}
            <div className="min-h-[300px]">
              {currentStep === 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg">Paso 1: Selección y Entrega</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="product">Producto *</Label>
                    <Select value={formData.productId} onValueChange={(value) => setFormData({ ...formData, productId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - {product.sku} (Stock: {product.currentStock})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedProduct && (
                    <Card className="p-4 bg-accent">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Categoría</p>
                          <p>{selectedProduct.category}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Stock Actual</p>
                          <p>{selectedProduct.currentStock} unidades</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Ubicación Actual</p>
                          <p>{selectedProduct.warehouse}</p>
                        </div>
                      </div>
                    </Card>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sourceWarehouse">Almacén de Origen *</Label>
                      <Select value={formData.sourceWarehouse} onValueChange={(value) => setFormData({ ...formData, sourceWarehouse: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione origen" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.map(wh => (
                            <SelectItem key={wh} value={wh}>{wh}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantity">Cantidad a Traspasar *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        max={selectedProduct?.currentStock || 0}
                        value={formData.quantity || ''}
                        onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                        placeholder="0"
                      />
                      {selectedProduct && (
                        <p className="text-xs text-muted-foreground">
                          Máximo disponible: {selectedProduct.currentStock} unidades
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg">Paso 2: En Tránsito</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="destinationWarehouse">Almacén de Destino *</Label>
                    <Select value={formData.destinationWarehouse} onValueChange={(value) => setFormData({ ...formData, destinationWarehouse: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione destino" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses
                          .filter(wh => wh !== formData.sourceWarehouse)
                          .map(wh => (
                            <SelectItem key={wh} value={wh}>{wh}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Card className="p-4 bg-warning/10 border-warning/30">
                    <div className="flex items-start gap-3">
                      <Truck className="w-5 h-5 text-warning mt-0.5" />
                      <div>
                        <p className="text-sm">Ruta de Traspaso</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{formData.sourceWarehouse}</Badge>
                          <ArrowRight className="w-4 h-4 text-warning" />
                          <Badge variant="outline">{formData.destinationWarehouse || '?'}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Tiempo estimado de tránsito: 24 horas
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg">Paso 3: Confirmación de Recepción</h3>
                  
                  <Card className="p-6">
                    <h4 className="mb-4">Resumen del Traspaso</h4>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-muted-foreground">Producto</span>
                        <span>{selectedProduct?.name}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-muted-foreground">SKU</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded">{selectedProduct?.sku}</code>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-muted-foreground">Cantidad</span>
                        <span>{formData.quantity} unidades</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-muted-foreground">Origen</span>
                        <Badge variant="outline">{formData.sourceWarehouse}</Badge>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-muted-foreground">Destino</span>
                        <Badge variant="outline">{formData.destinationWarehouse}</Badge>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-muted-foreground">Operador</span>
                        <span>{user?.name}</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 bg-success/10 border-success/30">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-success mt-0.5" />
                      <div>
                        <p className="text-sm">Todo listo para crear el traspaso</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Se generará automáticamente el registro de trazabilidad
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t border-border mt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
              >
                Anterior
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsNewTransferOpen(false)}>
                  Cancelar
                </Button>
                {currentStep < steps.length - 1 ? (
                  <Button onClick={handleNext}>
                    Siguiente
                  </Button>
                ) : (
                  <Button onClick={handleSubmit}>
                    Crear Traspaso
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfers List */}
      <div className="space-y-4">
        <h3 className="text-lg">Traspasos Recientes</h3>
        
        {transfers.map(transfer => (
          <Card key={transfer.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h4>{transfer.product}</h4>
                  <Badge
                    variant={
                      transfer.status === 'completed' ? 'default' :
                      transfer.status === 'in_transit' ? 'secondary' :
                      transfer.status === 'pending_reception' ? 'secondary' :
                      transfer.status === 'cancelled' || transfer.status === 'rejected' ? 'destructive' :
                      'outline'
                    }
                    className={
                      transfer.status === 'completed' ? 'bg-success hover:bg-success/80' :
                      transfer.status === 'in_transit' || transfer.status === 'pending_reception' ? 'bg-warning hover:bg-warning/80 text-warning-foreground' :
                      ''
                    }
                  >
                    {transfer.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                    {transfer.status === 'in_transit' && <Truck className="w-3 h-3 mr-1" />}
                    {transfer.status === 'pending_reception' && <Clock className="w-3 h-3 mr-1" />}
                    {transfer.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                    {(transfer.status === 'cancelled' || transfer.status === 'rejected') && <XCircle className="w-3 h-3 mr-1" />}
                    {transfer.status === 'pending' ? 'Pendiente' :
                     transfer.status === 'in_transit' ? 'En Tránsito' :
                     transfer.status === 'pending_reception' ? 'Pendiente Recepción' :
                     transfer.status === 'completed' ? 'Completado' :
                     transfer.status === 'rejected' ? 'Rechazado' :
                     'Cancelado'}
                  </Badge>
                </div>

                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Cantidad</p>
                    <p>{transfer.quantity} unidades</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ruta</p>
                    <div className="flex items-center gap-1">
                      <span className="text-xs">{transfer.sourceWarehouse}</span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs">{transfer.destinationWarehouse}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Operador</p>
                    <p>{transfer.operator}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Fecha Creación</p>
                    <p>{new Date(transfer.createdAt).toLocaleDateString('es-ES')}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {transfer.status === 'pending' && (
                  <Button
                    size="sm"
                    onClick={() => handleStatusChange(transfer.id, 'pending_reception')}
                  >
                    Iniciar Tránsito
                  </Button>
                )}
                {transfer.status === 'pending_reception' && (
                  <Badge variant="secondary" className="bg-warning text-warning-foreground">
                    Esperando Recepción
                  </Badge>
                )}
                {(transfer.status === 'pending' || transfer.status === 'in_transit') && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(transfer.id, 'cancelled')}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}

        {transfers.length === 0 && (
          <Card className="p-12 text-center text-muted-foreground">
            <Truck className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No hay traspasos registrados</p>
          </Card>
        )}
      </div>
    </div>
  );
}
