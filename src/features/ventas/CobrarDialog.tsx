import { useMemo, useState } from 'react';
import { CheckCircle2, Plus, Printer, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth, useEmpresa } from '@/auth/AuthProvider';
import { configDe } from '@/lib/rubros';
import { formatMoneda, mensajeError } from '@/lib/format';
import { parseNumero } from '@/lib/validaciones';
import type { ProductoConCategoria } from '@/features/productos/api';
import { MEDIO_PAGO_LABEL, type MedioPago } from '@/features/caja/api';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { type PagoInput, useRegistrarVenta } from './api';
import { type DatosTicket, imprimirTicket } from './ticket';

export interface LineaCarrito {
  producto: ProductoConCategoria;
  cantidad: string;
  precio: string;
}

interface LineaCalculada extends LineaCarrito {
  cant: number;
  precioN: number;
  subtotal: number;
}

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  lineas: LineaCalculada[];
  subtotal: number;
  descuento: number;
  total: number;
  cliente: string;
  onVentaRegistrada: () => void;
}

interface FilaPago {
  medio: MedioPago;
  monto: string;
}

const redondear = (n: number) => Math.round(n * 100) / 100;

/** Billetes sugeridos para pagar en efectivo (por encima del total). */
function sugerenciasEfectivo(total: number): number[] {
  const set = new Set<number>([total]);
  for (const m of [1000, 2000, 5000, 10000, 20000]) set.add(Math.ceil(total / m) * m);
  return [...set].filter((n) => n >= total).sort((a, b) => a - b).slice(0, 5);
}

export default function CobrarDialog({ abierto, onCerrar, lineas, subtotal, descuento, total, cliente, onVentaRegistrada }: Props) {
  const { empresa } = useEmpresa();
  const { perfil } = useAuth();
  const mediosHabilitados = configDe(empresa).medios_pago.filter((m): m is MedioPago => m in MEDIO_PAGO_LABEL);
  const registrar = useRegistrarVenta();
  const [pagos, setPagos] = useState<FilaPago[]>([]);
  const [resultado, setResultado] = useState<DatosTicket | null>(null);

  // Se reinicia solo al abrir (no cuando cambia el total: tras registrar, el carrito se vacía)
  const [abiertoAntes, setAbiertoAntes] = useState(false);
  if (abierto !== abiertoAntes) {
    setAbiertoAntes(abierto);
    if (abierto) {
      setPagos([{ medio: 'efectivo', monto: String(total).replace('.', ',') }]);
      setResultado(null);
    }
  }

  const calc = useMemo(() => {
    let efectivo = 0;
    let otros = 0;
    let invalido = false;
    for (const p of pagos) {
      const n = parseNumero(p.monto);
      if (Number.isNaN(n) || n <= 0) {
        invalido = true;
        continue;
      }
      if (p.medio === 'efectivo') efectivo += n;
      else otros += n;
    }
    const recibido = redondear(efectivo + otros);
    const falta = redondear(Math.max(0, total - recibido));
    const vuelto = redondear(Math.max(0, recibido - total));
    let error: string | undefined;
    if (invalido) error = 'Hay montos inválidos';
    else if (redondear(otros) > total) error = 'Tarjeta/transferencia no pueden superar el total (no se da vuelto)';
    else if (falta > 0) error = `Falta cobrar ${formatMoneda(falta)}`;
    return { recibido, falta, vuelto, error };
  }, [pagos, total]);

  const setMonto = (i: number, monto: string) => setPagos((ps) => ps.map((p, j) => (j === i ? { ...p, monto } : p)));
  const setMedio = (i: number, medio: MedioPago) => setPagos((ps) => ps.map((p, j) => (j === i ? { ...p, medio } : p)));

  const agregarMedio = () => {
    const usados = new Set(pagos.map((p) => p.medio));
    const medio = mediosHabilitados.find((m) => !usados.has(m)) ?? 'otro';
    setPagos((ps) => [...ps, { medio, monto: calc.falta > 0 ? String(calc.falta).replace('.', ',') : '' }]);
  };

  const confirmar = async () => {
    if (calc.error || registrar.isPending) return;
    const pagosInput: PagoInput[] = pagos.map((p) => ({ medio: p.medio, monto: redondear(parseNumero(p.monto)) }));
    try {
      const venta = await registrar.mutateAsync({
        items: lineas.map((l) => ({
          producto_id: l.producto.id,
          cantidad: l.cant,
          ...(l.precioN !== Number(l.producto.precio_venta) ? { precio_unitario: l.precioN } : {}),
        })),
        pagos: pagosInput,
        descuento,
        cliente,
      });
      // Pagos netos: al efectivo se le descuenta el vuelto (igual que en la BD)
      const porMedio = new Map<MedioPago, number>();
      for (const p of pagosInput) porMedio.set(p.medio, (porMedio.get(p.medio) ?? 0) + p.monto);
      if (porMedio.has('efectivo')) porMedio.set('efectivo', redondear(porMedio.get('efectivo')! - Number(venta.vuelto)));
      setResultado({
        empresa,
        numero: venta.numero,
        fecha: venta.fecha,
        vendedor: perfil?.nombre ?? perfil?.email,
        cliente: venta.cliente_nombre,
        items: lineas.map((l) => ({
          nombre: l.producto.nombre,
          cantidad: l.cant,
          unidad: l.producto.unidad_codigo,
          precio: l.precioN,
          subtotal: l.subtotal,
        })),
        subtotal: Number(venta.subtotal),
        descuento: Number(venta.descuento),
        total: Number(venta.total),
        pagos: [...porMedio].filter(([, m]) => m > 0).map(([medio, monto]) => ({ medio, monto })),
        recibido: Number(venta.pago_recibido),
        vuelto: Number(venta.vuelto),
      });
      onVentaRegistrada();
    } catch (err) {
      toast.error(mensajeError(err));
    }
  };

  const cerrar = () => {
    if (registrar.isPending) return;
    onCerrar();
  };

  return (
    <Dialog open={abierto} onOpenChange={(o) => !o && cerrar()}>
      <DialogContent
        className="sm:max-w-md"
        onCloseAutoFocus={(e) => {
          // Volver al buscador del POS para seguir escaneando
          e.preventDefault();
          document.querySelector<HTMLInputElement>('[aria-label="Buscar producto"]')?.focus();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement)) {
            e.preventDefault();
            if (resultado) cerrar();
            else void confirmar();
          }
        }}
      >
        {resultado ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" /> Venta #{resultado.numero} registrada
              </DialogTitle>
              <DialogDescription>Total {formatMoneda(resultado.total)}</DialogDescription>
            </DialogHeader>
            {resultado.vuelto > 0 ? (
              <div className="rounded-lg bg-green-500/10 p-6 text-center">
                <p className="text-sm text-muted-foreground">Vuelto</p>
                <p className="text-4xl font-semibold tabular-nums">{formatMoneda(resultado.vuelto)}</p>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">Sin vuelto</p>
            )}
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (!imprimirTicket(resultado)) toast.error('El navegador bloqueó la ventana del ticket. Permití ventanas emergentes.');
                }}
              >
                <Printer className="w-4 h-4 mr-2" /> Imprimir ticket
              </Button>
              <Button onClick={cerrar} autoFocus>
                Nueva venta (Enter)
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Cobrar</DialogTitle>
              <DialogDescription>
                {lineas.length} productos · subtotal {formatMoneda(subtotal)}
                {descuento > 0 && ` · descuento ${formatMoneda(descuento)}`}
              </DialogDescription>
            </DialogHeader>
            <div className="text-center py-2">
              <p className="text-sm text-muted-foreground">Total a cobrar</p>
              <p className="text-4xl font-semibold tabular-nums">{formatMoneda(total)}</p>
            </div>

            <div className="space-y-2">
              {pagos.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <Select value={p.medio} onValueChange={(v) => setMedio(i, v as MedioPago)}>
                    <SelectTrigger className="w-40" aria-label={`Medio de pago ${i + 1}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(MEDIO_PAGO_LABEL) as MedioPago[])
                        .filter((m) => mediosHabilitados.includes(m) || m === p.medio)
                        .map((m) => (
                          <SelectItem key={m} value={m}>
                            {MEDIO_PAGO_LABEL[m]}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Input
                    className="text-right"
                    inputMode="decimal"
                    value={p.monto}
                    onChange={(e) => setMonto(i, e.target.value)}
                    aria-label={`Monto ${i + 1}`}
                    autoFocus={i === 0}
                    onFocus={(e) => e.target.select()}
                  />
                  {pagos.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => setPagos((ps) => ps.filter((_, j) => j !== i))} aria-label="Quitar pago">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={agregarMedio}>
                <Plus className="w-4 h-4 mr-1" /> Pago combinado (otro medio)
              </Button>
            </div>

            {pagos.length === 1 && pagos[0].medio === 'efectivo' && (
              <div className="flex flex-wrap gap-2">
                {sugerenciasEfectivo(total).map((n) => (
                  <Button key={n} variant="outline" size="sm" onClick={() => setMonto(0, String(n))}>
                    {formatMoneda(n)}
                  </Button>
                ))}
              </div>
            )}

            <div className="rounded-md bg-muted p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Recibido</span>
                <span className="tabular-nums">{formatMoneda(calc.recibido)}</span>
              </div>
              {calc.falta > 0 ? (
                <div className="flex justify-between text-destructive font-medium">
                  <span>Falta</span>
                  <span className="tabular-nums">{formatMoneda(calc.falta)}</span>
                </div>
              ) : (
                <div className="flex justify-between text-base font-semibold">
                  <span>Vuelto</span>
                  <span className="tabular-nums">{formatMoneda(calc.vuelto)}</span>
                </div>
              )}
            </div>
            {calc.error && calc.falta === 0 && <p className="text-xs text-destructive">{calc.error}</p>}

            <DialogFooter>
              <Button variant="outline" onClick={cerrar} disabled={registrar.isPending}>
                Volver
              </Button>
              <Button onClick={() => void confirmar()} disabled={!!calc.error || registrar.isPending}>
                {registrar.isPending ? 'Registrando…' : 'Confirmar venta (Enter)'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
