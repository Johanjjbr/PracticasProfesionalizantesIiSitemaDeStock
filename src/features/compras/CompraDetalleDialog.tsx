import { useState } from 'react';
import { Ban } from 'lucide-react';
import { toast } from 'sonner';
import { useEmpresa } from '@/auth/AuthProvider';
import { puede } from '@/auth/permisos';
import { formatFecha, formatFechaCorta, formatMoneda, formatNumero, mensajeError } from '@/lib/format';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Cargando, ErrorCarga } from '@/app/components/comun/Estados';
import { useAnularCompra, useCompra } from './api';

export default function CompraDetalleDialog({ compraId, onCerrar }: { compraId: string | null; onCerrar: () => void }) {
  const { rol } = useEmpresa();
  const { data: compra, isLoading, error } = useCompra(compraId);
  const anular = useAnularCompra();
  const [anulando, setAnulando] = useState(false);
  const [motivo, setMotivo] = useState('');

  const cerrar = () => {
    if (anular.isPending) return;
    setAnulando(false);
    setMotivo('');
    onCerrar();
  };

  const confirmarAnulacion = async () => {
    if (!compra || motivo.trim().length < 3) return;
    try {
      await anular.mutateAsync({ id: compra.id, motivo: motivo.trim() });
      toast.success(`Compra #${compra.numero} anulada. Se descontó el stock recibido.`);
      setAnulando(false);
      setMotivo('');
    } catch (err) {
      toast.error(mensajeError(err));
    }
  };

  const conLotes = compra?.items.some((i) => i.lote || i.vencimiento);

  return (
    <Dialog open={!!compraId} onOpenChange={(o) => !o && cerrar()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        {isLoading || !compra ? (
          <>
            <DialogTitle className="sr-only">Detalle de compra</DialogTitle>
            {error ? <ErrorCarga error={error} /> : <Cargando />}
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Compra #{compra.numero}
                {compra.estado === 'anulada' && <Badge variant="destructive">Anulada</Badge>}
              </DialogTitle>
              <DialogDescription>
                {compra.proveedor?.razon_social}
                {compra.proveedor?.cuit ? ` · CUIT ${compra.proveedor.cuit}` : ''}
              </DialogDescription>
            </DialogHeader>

            <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs">Registrada</dt>
                <dd>{formatFecha(compra.fecha)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Comprobante</dt>
                <dd>{[compra.tipo_comprobante, compra.nro_comprobante].filter(Boolean).join(' ') || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Fecha comprobante</dt>
                <dd>{formatFechaCorta(compra.fecha_comprobante)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Usuario</dt>
                <dd>{compra.usuario?.nombre ?? compra.usuario?.email ?? '—'}</dd>
              </div>
            </dl>

            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Costo</TableHead>
                    {conLotes && <TableHead>Lote / Venc.</TableHead>}
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {compra.items.map((i) => {
                    const ant = Number(i.costo_anterior ?? 0);
                    const variacion = ant > 0 ? ((Number(i.costo_unitario) - ant) / ant) * 100 : null;
                    return (
                      <TableRow key={i.id}>
                        <TableCell>
                          <span className="font-mono text-xs text-muted-foreground mr-2">{i.producto?.codigo}</span>
                          {i.producto?.nombre}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatNumero(i.cantidad)} <span className="text-xs text-muted-foreground">{i.producto?.unidad_codigo}</span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMoneda(i.costo_unitario)}
                          {variacion !== null && Math.abs(variacion) >= 0.5 && (
                            <p className="text-xs text-muted-foreground">
                              antes {formatMoneda(ant)} ({variacion > 0 ? '+' : ''}
                              {variacion.toFixed(0)}%)
                            </p>
                          )}
                        </TableCell>
                        {conLotes && (
                          <TableCell className="text-sm">
                            {i.lote ?? '—'}
                            {i.vencimiento && <p className="text-xs text-muted-foreground">vence {formatFechaCorta(i.vencimiento)}</p>}
                          </TableCell>
                        )}
                        <TableCell className="text-right tabular-nums">{formatMoneda(i.subtotal)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={conLotes ? 4 : 3} className="text-right">
                      Total
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoneda(compra.total)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            {compra.observaciones && (
              <p className="text-sm">
                <span className="text-muted-foreground">Observaciones: </span>
                {compra.observaciones}
              </p>
            )}
            {compra.pagada_desde_caja && (
              <p className="text-xs text-muted-foreground">Pagada en efectivo desde la caja.</p>
            )}
            {!compra.actualizo_costos && (
              <p className="text-xs text-muted-foreground">Esta compra no actualizó los precios de costo.</p>
            )}

            {compra.estado === 'anulada' && (
              <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
                Anulada el {formatFecha(compra.anulada_at)} por {compra.anulador?.nombre ?? compra.anulador?.email ?? '—'}.
                <br />
                Motivo: {compra.motivo_anulacion}
              </div>
            )}

            {anulando && (
              <div className="space-y-2 rounded-md border p-3">
                <Label htmlFor="motivo_anulacion">Motivo de la anulación</Label>
                <Textarea
                  id="motivo_anulacion"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej: se cargó dos veces / el proveedor no entregó"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Se descuenta del stock lo que ingresó con esta compra. Los precios de costo no se revierten.
                </p>
              </div>
            )}

            <DialogFooter>
              {compra.estado === 'confirmada' && puede('gestionarCatalogo', rol) && !anulando && (
                <Button variant="outline" className="mr-auto text-destructive" onClick={() => setAnulando(true)}>
                  <Ban className="w-4 h-4 mr-2" /> Anular compra
                </Button>
              )}
              {anulando ? (
                <>
                  <Button variant="outline" onClick={() => setAnulando(false)} disabled={anular.isPending}>
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => void confirmarAnulacion()}
                    disabled={anular.isPending || motivo.trim().length < 3}
                  >
                    {anular.isPending ? 'Anulando…' : 'Confirmar anulación'}
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={cerrar}>
                  Cerrar
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
