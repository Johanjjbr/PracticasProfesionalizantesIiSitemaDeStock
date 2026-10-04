import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { formatMoneda, mensajeError } from '@/lib/format';
import { parseNumero } from '@/lib/validaciones';
import { Campo } from '@/app/components/comun/Campo';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { MEDIO_PAGO_LABEL, type MedioPago, type TipoMovCaja, useCerrarCaja, useMovimientoManual } from './api';

const CONCEPTOS: Record<TipoMovCaja, string[]> = {
  ingreso: ['Aporte de cambio', 'Cobro de deuda', 'Seña de pedido', 'Otro ingreso'],
  egreso: ['Retiro del dueño', 'Pago a proveedor', 'Pago de servicio', 'Delivery / fletes', 'Otro gasto'],
};

export function MovimientoCajaDialog({
  sesionId,
  tipo,
  efectivoDisponible,
  onCerrar,
}: {
  sesionId: string;
  tipo: TipoMovCaja | null;
  efectivoDisponible: number;
  onCerrar: () => void;
}) {
  const registrar = useMovimientoManual();
  const [monto, setMonto] = useState('');
  const [concepto, setConcepto] = useState('');
  const [medio, setMedio] = useState<MedioPago>('efectivo');
  const [error, setError] = useState<{ monto?: string; concepto?: string }>({});

  useEffect(() => {
    if (tipo) {
      setMonto('');
      setConcepto('');
      setMedio('efectivo');
      setError({});
    }
  }, [tipo]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!tipo) return;
    const n = parseNumero(monto);
    const errores: typeof error = {};
    if (Number.isNaN(n) || n <= 0) errores.monto = 'Ingresá un monto mayor a 0';
    else if (tipo === 'egreso' && medio === 'efectivo' && n > efectivoDisponible)
      errores.monto = `Solo hay ${formatMoneda(efectivoDisponible)} en efectivo`;
    if (concepto.trim().length < 3) errores.concepto = 'Describí el movimiento';
    setError(errores);
    if (Object.keys(errores).length) return;
    try {
      await registrar.mutateAsync({ sesionId, tipo, monto: n, concepto: concepto.trim(), medio });
      toast.success(tipo === 'ingreso' ? 'Ingreso registrado' : 'Egreso registrado');
      onCerrar();
    } catch (err) {
      toast.error(mensajeError(err));
    }
  };

  return (
    <Dialog open={!!tipo} onOpenChange={(o) => !o && !registrar.isPending && onCerrar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tipo === 'ingreso' ? 'Registrar ingreso' : 'Registrar egreso / retiro'}</DialogTitle>
          <DialogDescription>
            {tipo === 'egreso'
              ? `Efectivo disponible: ${formatMoneda(efectivoDisponible)}`
              : 'Dinero que entra a la caja sin ser una venta.'}
          </DialogDescription>
        </DialogHeader>
        <form id="form-mov-caja" onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <Campo id="mov-monto" label="Monto" requerido error={error.monto}>
              <Input id="mov-monto" inputMode="decimal" value={monto} onChange={(e) => setMonto(e.target.value)} autoFocus />
            </Campo>
            <Campo id="mov-medio" label="Medio">
              <Select value={medio} onValueChange={(v) => setMedio(v as MedioPago)}>
                <SelectTrigger id="mov-medio">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MEDIO_PAGO_LABEL).map(([k, l]) => (
                    <SelectItem key={k} value={k}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Campo>
          </div>
          <Campo id="mov-concepto" label="Concepto" requerido error={error.concepto}>
            <Input
              id="mov-concepto"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              list="conceptos-caja"
              placeholder="Ej: pago de luz"
            />
            <datalist id="conceptos-caja">
              {tipo && CONCEPTOS[tipo].map((c) => <option key={c} value={c} />)}
            </datalist>
          </Campo>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onCerrar} disabled={registrar.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="form-mov-caja" disabled={registrar.isPending}>
            {registrar.isPending ? 'Guardando…' : 'Registrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CerrarCajaDialog({
  sesion,
  efectivoEsperado,
  abierto,
  onCerrar,
}: {
  sesion: { id: string; numero: number };
  efectivoEsperado: number;
  abierto: boolean;
  onCerrar: () => void;
}) {
  const cerrar = useCerrarCaja();
  const [contado, setContado] = useState('');
  const [obs, setObs] = useState('');

  useEffect(() => {
    if (abierto) {
      setContado('');
      setObs('');
    }
  }, [abierto]);

  const n = parseNumero(contado);
  const valido = !Number.isNaN(n) && n >= 0;
  const diferencia = valido ? Math.round((n - efectivoEsperado) * 100) / 100 : null;
  const faltaObs = diferencia !== null && diferencia !== 0 && obs.trim() === '';

  const confirmar = async () => {
    if (!valido || faltaObs) return;
    try {
      const r = await cerrar.mutateAsync({ sesionId: sesion.id, contado: n, observaciones: obs });
      const d = Number(r.diferencia);
      toast.success(
        d === 0 ? `Caja #${r.numero} cerrada sin diferencias` : `Caja #${r.numero} cerrada con ${d > 0 ? 'sobrante' : 'faltante'} de ${formatMoneda(Math.abs(d))}`,
      );
      onCerrar();
    } catch (err) {
      toast.error(mensajeError(err));
    }
  };

  return (
    <Dialog open={abierto} onOpenChange={(o) => !o && !cerrar.isPending && onCerrar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cerrar caja #{sesion.numero}</DialogTitle>
          <DialogDescription>Contá el efectivo que hay en la caja y cargalo. Los demás medios no se cuentan.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-md bg-muted p-3 flex justify-between text-sm">
            <span>Efectivo esperado</span>
            <strong className="tabular-nums">{formatMoneda(efectivoEsperado)}</strong>
          </div>
          <Campo id="contado" label="Efectivo contado" requerido>
            <Input id="contado" inputMode="decimal" value={contado} onChange={(e) => setContado(e.target.value)} autoFocus />
          </Campo>
          {diferencia !== null && contado.trim() !== '' && (
            <div
              className={`rounded-md p-3 text-sm flex justify-between ${
                diferencia === 0
                  ? 'bg-green-500/10 text-green-800 dark:text-green-300'
                  : 'bg-amber-500/10 text-amber-800 dark:text-amber-300'
              }`}
            >
              <span>{diferencia === 0 ? 'Sin diferencias' : diferencia > 0 ? 'Sobrante' : 'Faltante'}</span>
              <strong className="tabular-nums">{formatMoneda(Math.abs(diferencia))}</strong>
            </div>
          )}
          <Campo
            id="obs-cierre"
            label="Observaciones"
            requerido={diferencia !== null && diferencia !== 0}
            error={faltaObs && contado.trim() !== '' ? 'Explicá la diferencia' : undefined}
          >
            <Textarea id="obs-cierre" value={obs} onChange={(e) => setObs(e.target.value)} />
          </Campo>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCerrar} disabled={cerrar.isPending}>
            Cancelar
          </Button>
          <Button onClick={() => void confirmar()} disabled={!valido || contado.trim() === '' || faltaObs || cerrar.isPending}>
            {cerrar.isPending ? 'Cerrando…' : 'Cerrar caja'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
