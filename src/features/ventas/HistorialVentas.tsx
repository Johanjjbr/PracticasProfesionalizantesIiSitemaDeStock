import { useState } from 'react';
import { Ban, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { useEmpresa } from '@/auth/AuthProvider';
import { puede } from '@/auth/permisos';
import { formatFecha, formatMoneda, formatNumero, hoyISO, mensajeError } from '@/lib/format';
import { MEDIO_PAGO_LABEL, type MedioPago } from '@/features/caja/api';
import { Cargando, ErrorCarga } from '@/app/components/comun/Estados';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { type EstadoVenta, type FiltrosVentas, VENTAS_POR_PAGINA, useAnularVenta, useVenta, useVentas } from './api';
import { imprimirTicket } from './ticket';

const TODOS = '__todos__';

function DetalleVenta({ id, onCerrar }: { id: string | null; onCerrar: () => void }) {
  const { empresa, rol } = useEmpresa();
  const { data: v, isLoading, error } = useVenta(id);
  const anular = useAnularVenta();
  const [anulando, setAnulando] = useState(false);
  const [motivo, setMotivo] = useState('');

  const cerrar = () => {
    if (anular.isPending) return;
    setAnulando(false);
    setMotivo('');
    onCerrar();
  };

  const reimprimir = () => {
    if (!v) return;
    const ok = imprimirTicket({
      empresa,
      numero: v.numero,
      fecha: v.fecha,
      vendedor: v.usuario?.nombre ?? v.usuario?.email,
      cliente: v.cliente_nombre,
      items: v.items.map((i) => ({
        nombre: i.producto?.nombre ?? '',
        cantidad: Number(i.cantidad),
        unidad: i.producto?.unidad_codigo ?? '',
        precio: Number(i.precio_unitario),
        subtotal: Number(i.subtotal),
      })),
      subtotal: Number(v.subtotal),
      descuento: Number(v.descuento),
      total: Number(v.total),
      pagos: v.pagos.map((p) => ({ medio: p.medio_pago, monto: Number(p.monto) })),
      recibido: Number(v.pago_recibido),
      vuelto: Number(v.vuelto),
      anulada: v.estado === 'anulada',
    });
    if (!ok) toast.error('El navegador bloqueó la ventana del ticket. Permití ventanas emergentes.');
  };

  const confirmarAnulacion = async () => {
    if (!v || motivo.trim().length < 3) return;
    try {
      await anular.mutateAsync({ id: v.id, motivo: motivo.trim() });
      toast.success(`Venta #${v.numero} anulada: se devolvió el stock y se registró el egreso en tu caja.`);
      setAnulando(false);
      setMotivo('');
    } catch (err) {
      toast.error(mensajeError(err));
    }
  };

  return (
    <Dialog open={!!id} onOpenChange={(o) => !o && cerrar()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        {isLoading || !v ? (
          <>
            <DialogTitle className="sr-only">Detalle de venta</DialogTitle>
            {error ? <ErrorCarga error={error} /> : <Cargando />}
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Venta #{v.numero} {v.estado === 'anulada' && <Badge variant="destructive">Anulada</Badge>}
              </DialogTitle>
              <DialogDescription>
                {formatFecha(v.fecha)} · {v.usuario?.nombre ?? v.usuario?.email}
                {v.cliente_nombre ? ` · Cliente: ${v.cliente_nombre}` : ''}
              </DialogDescription>
            </DialogHeader>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {v.items.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell>{i.producto?.nombre}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumero(i.cantidad)} <span className="text-xs text-muted-foreground">{i.producto?.unidad_codigo}</span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatMoneda(i.precio_unitario)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatMoneda(i.subtotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  {Number(v.descuento) > 0 && (
                    <>
                      <TableRow>
                        <TableCell colSpan={3} className="text-right">Subtotal</TableCell>
                        <TableCell className="text-right tabular-nums">{formatMoneda(v.subtotal)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={3} className="text-right">Descuento</TableCell>
                        <TableCell className="text-right tabular-nums">−{formatMoneda(v.descuento)}</TableCell>
                      </TableRow>
                    </>
                  )}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right">Total</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoneda(v.total)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
            <div className="text-sm space-y-1">
              <p className="text-muted-foreground">Pagos</p>
              {v.pagos.map((p) => (
                <div key={p.id} className="flex justify-between">
                  <span>{MEDIO_PAGO_LABEL[p.medio_pago]}</span>
                  <span className="tabular-nums">{formatMoneda(p.monto)}</span>
                </div>
              ))}
              {Number(v.vuelto) > 0 && (
                <p className="text-xs text-muted-foreground">
                  Recibido {formatMoneda(v.pago_recibido)} · vuelto {formatMoneda(v.vuelto)}
                </p>
              )}
            </div>
            {v.estado === 'anulada' && (
              <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
                Anulada el {formatFecha(v.anulada_at)} por {v.anulador?.nombre ?? v.anulador?.email}. Motivo: {v.motivo_anulacion}
              </div>
            )}
            {anulando && (
              <div className="space-y-2 rounded-md border p-3">
                <Label htmlFor="motivo-anulacion-venta">Motivo de la anulación</Label>
                <Textarea
                  id="motivo-anulacion-venta"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej: el cliente devolvió el producto / se cobró dos veces"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Se devuelve el stock y se registra la devolución del dinero en tu caja abierta (por el mismo medio de pago).
                </p>
              </div>
            )}
            <DialogFooter className="gap-2">
              {v.estado === 'confirmada' && puede('gestionarCatalogo', rol) && !anulando && (
                <Button variant="outline" className="sm:mr-auto text-destructive" onClick={() => setAnulando(true)}>
                  <Ban className="w-4 h-4 mr-2" /> Anular venta
                </Button>
              )}
              {anulando ? (
                <>
                  <Button variant="outline" onClick={() => setAnulando(false)} disabled={anular.isPending}>
                    Cancelar
                  </Button>
                  <Button variant="destructive" onClick={() => void confirmarAnulacion()} disabled={anular.isPending || motivo.trim().length < 3}>
                    {anular.isPending ? 'Anulando…' : 'Confirmar anulación'}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={reimprimir}>
                    <Printer className="w-4 h-4 mr-2" /> Ticket
                  </Button>
                  <Button variant="outline" onClick={cerrar}>
                    Cerrar
                  </Button>
                </>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function HistorialVentas() {
  const hoy = hoyISO();
  const [filtros, setFiltros] = useState<FiltrosVentas>({ desde: hoy, hasta: hoy, estado: '' });
  const [pagina, setPagina] = useState(0);
  const [abierta, setAbierta] = useState<string | null>(null);
  const { data, isLoading, error, isFetching } = useVentas(filtros, pagina);

  const set = (cambios: Partial<FiltrosVentas>) => {
    setFiltros((f) => ({ ...f, ...cambios }));
    setPagina(0);
  };

  const filas = data?.filas ?? [];
  const confirmadas = filas.filter((v) => v.estado === 'confirmada');
  const totalPagina = confirmadas.reduce((s, v) => s + Number(v.total), 0);
  const total = data?.total ?? 0;
  const paginas = Math.max(1, Math.ceil(total / VENTAS_POR_PAGINA));

  return (
    <div className="space-y-3">
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div className="space-y-1.5">
            <Label htmlFor="v-desde">Desde</Label>
            <Input id="v-desde" type="date" value={filtros.desde} onChange={(e) => set({ desde: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="v-hasta">Hasta</Label>
            <Input id="v-hasta" type="date" value={filtros.hasta} onChange={(e) => set({ hasta: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="v-estado">Estado</Label>
            <Select value={filtros.estado || TODOS} onValueChange={(v) => set({ estado: v === TODOS ? '' : (v as EstadoVenta) })}>
              <SelectTrigger id="v-estado">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todas</SelectItem>
                <SelectItem value="confirmada">Confirmadas</SelectItem>
                <SelectItem value="anulada">Anuladas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="ghost" onClick={() => set({ desde: hoy, hasta: hoy, estado: '' })}>
            Hoy
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <Cargando />
      ) : error ? (
        <ErrorCarga error={error} />
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table className={isFetching ? 'opacity-60' : ''}>
            <TableHeader>
              <TableRow>
                <TableHead>N°</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="hidden md:table-cell">Vendedor</TableHead>
                <TableHead className="hidden lg:table-cell">Cliente</TableHead>
                <TableHead className="hidden sm:table-cell">Pago</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((v) => (
                <TableRow key={v.id} className={`cursor-pointer ${v.estado === 'anulada' ? 'opacity-60' : ''}`} onClick={() => setAbierta(v.id)}>
                  <TableCell className="tabular-nums">
                    <button type="button" className="hover:underline">#{v.numero}</button>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">{formatFecha(v.fecha)}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{v.usuario?.nombre ?? v.usuario?.email}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{v.cliente_nombre ?? '—'}</TableCell>
                  <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                    {[...new Set(v.pagos.map((p) => MEDIO_PAGO_LABEL[p.medio_pago as MedioPago]))].join(' + ')}
                  </TableCell>
                  <TableCell className={`text-right tabular-nums ${v.estado === 'anulada' ? 'line-through' : ''}`}>{formatMoneda(v.total)}</TableCell>
                  <TableCell>
                    {v.estado === 'anulada' ? (
                      <Badge variant="destructive" className="text-[10px]">Anulada</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">OK</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                    No hay ventas en ese período.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 border-t text-sm">
            <span className="text-muted-foreground">
              {total} ventas · {confirmadas.length} confirmadas en esta página por{' '}
              <strong className="text-foreground">{formatMoneda(totalPagina)}</strong>
            </span>
            {paginas > 1 && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={pagina === 0} onClick={() => setPagina(pagina - 1)}>Anterior</Button>
                <Button variant="outline" size="sm" disabled={pagina >= paginas - 1} onClick={() => setPagina(pagina + 1)}>Siguiente</Button>
              </div>
            )}
          </div>
        </Card>
      )}
      <DetalleVenta id={abierta} onCerrar={() => setAbierta(null)} />
    </div>
  );
}
