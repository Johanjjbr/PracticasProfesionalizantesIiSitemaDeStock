import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { ArrowRight, Package, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../components/ui/utils';

export default function Reception() {
  const { transfers, user, validateTransfer, rejectTransfer } = useApp();
  const [selectedTransfer, setSelectedTransfer] = useState<string | null>(null);
  const [isValidateOpen, setIsValidateOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [quantityReceived, setQuantityReceived] = useState(0);
  const [notes, setNotes] = useState('');

  // Filter transfers for the current user's warehouse
  const pendingTransfers = transfers.filter(
    t => t.destinationWarehouse === user?.warehouse && t.status === 'pending_reception'
  );

  const completedTransfers = transfers.filter(
    t => t.destinationWarehouse === user?.warehouse &&
    (t.status === 'completed' || t.status === 'rejected')
  );

  const handleOpenValidate = (transferId: string) => {
    const transfer = transfers.find(t => t.id === transferId);
    if (transfer) {
      setSelectedTransfer(transferId);
      setQuantityReceived(transfer.quantity);
      setNotes('');
      setIsValidateOpen(true);
    }
  };

  const handleOpenReject = (transferId: string) => {
    setSelectedTransfer(transferId);
    setNotes('');
    setIsRejectOpen(true);
  };

  const handleValidate = () => {
    if (!selectedTransfer || !user) return;

    const transfer = transfers.find(t => t.id === selectedTransfer);
    if (!transfer) return;

    if (quantityReceived <= 0) {
      toast.error('La cantidad recibida debe ser mayor a 0');
      return;
    }

    if (quantityReceived > transfer.quantity) {
      toast.error('La cantidad recibida no puede ser mayor a la cantidad enviada');
      return;
    }

    validateTransfer(selectedTransfer, quantityReceived, notes || 'Recepción sin observaciones', user.name);

    toast.success('Traspaso validado exitosamente', {
      description: `${quantityReceived} unidades de ${transfer.product} recibidas`,
    });

    setIsValidateOpen(false);
    setSelectedTransfer(null);
  };

  const handleReject = () => {
    if (!selectedTransfer || !user) return;

    if (!notes.trim()) {
      toast.error('Debe proporcionar un motivo de rechazo');
      return;
    }

    const transfer = transfers.find(t => t.id === selectedTransfer);
    if (!transfer) return;

    rejectTransfer(selectedTransfer, notes, user.name);

    toast.error('Traspaso rechazado', {
      description: `${transfer.product} - ${notes}`,
    });

    setIsRejectOpen(false);
    setSelectedTransfer(null);
  };

  const selectedTransferData = transfers.find(t => t.id === selectedTransfer);
  const hasDiscrepancy = selectedTransferData && quantityReceived !== selectedTransferData.quantity;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl">Recepción de Traspasos</h1>
        <p className="text-sm text-muted-foreground">
          Validación de productos para {user?.warehouse}
        </p>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pendientes</p>
              <p className="text-2xl mt-1">{pendingTransfers.length}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-warning" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Validados Hoy</p>
              <p className="text-2xl mt-1">
                {completedTransfers.filter(t => {
                  const today = new Date().toDateString();
                  const completedDate = t.completedAt ? new Date(t.completedAt).toDateString() : '';
                  return t.status === 'completed' && completedDate === today;
                }).length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Rechazados</p>
              <p className="text-2xl mt-1">
                {completedTransfers.filter(t => t.status === 'rejected').length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-destructive" />
            </div>
          </div>
        </Card>
      </div>

      {/* Pending Transfers */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg">Traspasos Pendientes de Validación</h3>
          {pendingTransfers.length > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {pendingTransfers.length} pendiente{pendingTransfers.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {pendingTransfers.map(transfer => (
          <Card key={transfer.id} className="p-6 border-l-4 border-l-warning">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Package className="w-5 h-5 text-muted-foreground" />
                  <h4>{transfer.product}</h4>
                  <Badge className="bg-warning hover:bg-warning/80 text-warning-foreground">
                    <Clock className="w-3 h-3 mr-1" />
                    Pendiente de Recepción
                  </Badge>
                </div>

                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Cantidad Enviada</p>
                    <p className="text-lg">{transfer.quantity} unidades</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Origen</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs">{transfer.sourceWarehouse}</span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs font-semibold">{transfer.destinationWarehouse}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Operador Origen</p>
                    <p>{transfer.operator}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Fecha Envío</p>
                    <p>{new Date(transfer.createdAt).toLocaleDateString('es-ES')}</p>
                  </div>
                </div>

                {transfer.estimatedDelivery && (
                  <div className="mt-3 p-3 bg-accent rounded-md">
                    <p className="text-xs text-muted-foreground">
                      Estimado de llegada: {new Date(transfer.estimatedDelivery).toLocaleString('es-ES')}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 ml-4">
                <Button
                  size="sm"
                  onClick={() => handleOpenValidate(transfer.id)}
                  className="bg-success hover:bg-success/80"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Validar Recepción
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleOpenReject(transfer.id)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rechazar
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {pendingTransfers.length === 0 && (
          <Card className="p-12 text-center text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No hay traspasos pendientes de validación</p>
            <p className="text-xs mt-1">Todos los traspasos han sido procesados</p>
          </Card>
        )}
      </div>

      {/* Validate Dialog */}
      <Dialog open={isValidateOpen} onOpenChange={setIsValidateOpen}>
        <DialogContent className="max-w-2xl" aria-describedby="validate-dialog-description">
          <DialogHeader>
            <DialogTitle>Validar Recepción de Traspaso</DialogTitle>
          </DialogHeader>
          <span id="validate-dialog-description" className="sr-only">
            Formulario para validar la recepción de productos y actualizar el inventario
          </span>

          {selectedTransferData && (
            <div className="space-y-4">
              <Card className="p-4 bg-accent">
                <h4 className="mb-3">Información del Traspaso</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Producto</p>
                    <p>{selectedTransferData.product}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Cantidad Enviada</p>
                    <p>{selectedTransferData.quantity} unidades</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Origen</p>
                    <p>{selectedTransferData.sourceWarehouse}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Operador</p>
                    <p>{selectedTransferData.operator}</p>
                  </div>
                </div>
              </Card>

              <div className="space-y-2">
                <Label htmlFor="quantityReceived">Cantidad Recibida *</Label>
                <Input
                  id="quantityReceived"
                  type="number"
                  min="0"
                  max={selectedTransferData.quantity}
                  value={quantityReceived}
                  onChange={(e) => setQuantityReceived(Number(e.target.value))}
                  className={cn(
                    hasDiscrepancy && "border-warning"
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Máximo esperado: {selectedTransferData.quantity} unidades
                </p>
              </div>

              {hasDiscrepancy && (
                <Card className="p-3 bg-warning/10 border-warning/30">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-warning">Discrepancia detectada</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        La cantidad recibida ({quantityReceived}) difiere de la cantidad enviada ({selectedTransferData.quantity}).
                        Por favor, documente la razón en las observaciones.
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Observaciones {hasDiscrepancy && '*'}</Label>
                <Textarea
                  id="notes"
                  placeholder="Ingrese observaciones sobre la recepción (estado de los productos, embalaje, etc.)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="p-3 bg-accent rounded-md text-sm">
                <p className="text-muted-foreground mb-1">Recepcionista:</p>
                <p>{user?.name}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsValidateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleValidate} className="bg-success hover:bg-success/80">
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirmar Recepción
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent aria-describedby="reject-dialog-description">
          <DialogHeader>
            <DialogTitle>Rechazar Traspaso</DialogTitle>
          </DialogHeader>
          <span id="reject-dialog-description" className="sr-only">
            Formulario para rechazar el traspaso y documentar el motivo
          </span>

          {selectedTransferData && (
            <div className="space-y-4">
              <Card className="p-4 bg-destructive/10 border-destructive/30">
                <div className="flex items-start gap-2">
                  <XCircle className="w-5 h-5 text-destructive mt-0.5" />
                  <div>
                    <p className="text-sm">Producto: {selectedTransferData.product}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Esta acción rechazará el traspaso y no actualizará el inventario
                    </p>
                  </div>
                </div>
              </Card>

              <div className="space-y-2">
                <Label htmlFor="rejectNotes">Motivo del Rechazo *</Label>
                <Textarea
                  id="rejectNotes"
                  placeholder="Describa el motivo del rechazo (productos dañados, cantidad incorrecta, documentación faltante, etc.)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  required
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              <XCircle className="w-4 h-4 mr-2" />
              Confirmar Rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Completed Transfers History */}
      {completedTransfers.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg">Historial de Recepciones</h3>

          {completedTransfers.map(transfer => (
            <Card key={transfer.id} className={cn(
              "p-6",
              transfer.status === 'rejected' ? "border-l-4 border-l-destructive" : "border-l-4 border-l-success"
            )}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Package className="w-5 h-5 text-muted-foreground" />
                    <h4>{transfer.product}</h4>
                    <Badge
                      variant={transfer.status === 'completed' ? 'default' : 'destructive'}
                      className={transfer.status === 'completed' ? 'bg-success hover:bg-success/80' : ''}
                    >
                      {transfer.status === 'completed' ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Validado
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 mr-1" />
                          Rechazado
                        </>
                      )}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Cantidad</p>
                      <p>
                        {transfer.status === 'completed' && transfer.quantityReceived !== undefined ? (
                          <>
                            {transfer.quantityReceived} / {transfer.quantity}
                            {transfer.quantityReceived !== transfer.quantity && (
                              <AlertTriangle className="inline w-3 h-3 ml-1 text-warning" />
                            )}
                          </>
                        ) : (
                          `${transfer.quantity} unidades`
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Recepcionista</p>
                      <p>{transfer.receptionist || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Fecha</p>
                      <p>{transfer.completedAt ? new Date(transfer.completedAt).toLocaleDateString('es-ES') : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Operador Origen</p>
                      <p>{transfer.operator}</p>
                    </div>
                  </div>

                  {transfer.receptionNotes && (
                    <div className="mt-3 p-3 bg-accent rounded-md">
                      <p className="text-xs text-muted-foreground mb-1">Observaciones:</p>
                      <p className="text-sm">{transfer.receptionNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
