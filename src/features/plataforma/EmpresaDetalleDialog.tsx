import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import type { Database } from '@/lib/database.types';
import { formatFecha, formatFechaCorta, formatMoneda, hoyISO, mensajeError } from '@/lib/format';
import { parseNumero } from '@/lib/validaciones';
import { RUBRO_LABEL } from '@/lib/rubros';
import { Campo } from '@/app/components/comun/Campo';
import { Cargando, ErrorCarga } from '@/app/components/comun/Estados';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import {
  type EmpresaPlataforma,
  MEDIOS_COBRO,
  useActivarEmpresa,
  useActualizarEmpresa,
  useAnularPago,
  usePagos,
  usePlanes,
  useRegistrarPago,
  useSuspenderEmpresa,
} from './api';
import { EstadoBadge } from './EstadoBadge';

type Rubro = Database['public']['Enums']['rubro_empresa'];
const SIN_PLAN = '__sin_plan__';

function DatosTab({ e }: { e: EmpresaPlataforma }) {
  const planes = usePlanes();
  const actualizar = useActualizarEmpresa();
  const [f, setF] = useState({ nombre: '', rubro: 'general' as Rubro, plan: SIN_PLAN, pagadoHasta: '', gracia: '7' });
  const [err, setErr] = useState<Record<string, string>>({});

  useEffect(() => {
    setF({
      nombre: e.nombre,
      rubro: e.rubro,
      plan: e.plan_id ?? SIN_PLAN,
      pagadoHasta: e.pagado_hasta ?? '',
      gracia: String(e.dias_gracia),
    });
    setErr({});
  }, [e]);

  const guardar = async (ev: FormEvent) => {
    ev.preventDefault();
    const e2: Record<string, string> = {};
    const gracia = Number(f.gracia);
    if (f.nombre.trim().length < 2) e2.nombre = 'Ingresá el nombre';
    if (!Number.isInteger(gracia) || gracia < 0 || gracia > 60) e2.gracia = 'Entre 0 y 60 días';
    setErr(e2);
    if (Object.keys(e2).length) return;
    try {
      await actualizar.mutateAsync({
        id: e.id,
        nombre: f.nombre.trim(),
        rubro: f.rubro,
        plan_id: f.plan === SIN_PLAN ? null : f.plan,
        pagado_hasta: f.pagadoHasta || null,
        dias_gracia: gracia,
      });
      toast.success('Cambios guardados');
    } catch (er) {
      toast.error(mensajeError(er));
    }
  };

  return (
    <form onSubmit={guardar} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="ed-nombre" label="Nombre" requerido error={err.nombre}>
          <Input id="ed-nombre" value={f.nombre} onChange={(ev) => setF({ ...f, nombre: ev.target.value })} />
        </Campo>
        <Campo id="ed-rubro" label="Rubro" ayuda="Cambia los campos extra de productos">
          <Select value={f.rubro} onValueChange={(v) => setF({ ...f, rubro: v as Rubro })}>
            <SelectTrigger id="ed-rubro">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(RUBRO_LABEL) as Rubro[]).map((r) => (
                <SelectItem key={r} value={r}>
                  {RUBRO_LABEL[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Campo>
        <Campo id="ed-plan" label="Plan" className="sm:col-span-2">
          <Select value={f.plan} onValueChange={(v) => setF({ ...f, plan: v })}>
            <SelectTrigger id="ed-plan">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SIN_PLAN}>Sin plan (sin límites)</SelectItem>
              {(planes.data ?? [])
                .filter((p) => p.activo || p.id === e.plan_id)
                .map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre} · {formatMoneda(p.precio_mensual)}/mes
                    {p.max_usuarios ? ` · ${p.max_usuarios} usuarios` : ''}
                    {p.max_productos ? ` · ${p.max_productos} productos` : ''}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </Campo>
        <Campo id="ed-hasta" label="Pagado hasta" ayuda="Vacío = sin vencimiento. Para pagos usá la pestaña Pagos.">
          <Input id="ed-hasta" type="date" value={f.pagadoHasta} onChange={(ev) => setF({ ...f, pagadoHasta: ev.target.value })} />
        </Campo>
        <Campo id="ed-gracia" label="Días de gracia" error={err.gracia} ayuda="Después del vencimiento, antes de pasar a solo lectura">
          <Input id="ed-gracia" inputMode="numeric" value={f.gracia} onChange={(ev) => setF({ ...f, gracia: ev.target.value })} />
        </Campo>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={actualizar.isPending}>
          {actualizar.isPending ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
}

function PagosTab({ e }: { e: EmpresaPlataforma }) {
  const pagos = usePagos(e.id);
  const registrar = useRegistrarPago();
  const anular = useAnularPago();
  const precio = Number(e.precio_mensual ?? 0);
  const [f, setF] = useState({ meses: '1', monto: precio ? String(precio) : '', medio: 'transferencia', fecha: hoyISO(), nota: '' });
  const [err, setErr] = useState<Record<string, string>>({});
  const [anulando, setAnulando] = useState<{ id: string; motivo: string } | null>(null);

  const cambiarMeses = (v: string) => {
    const m = Number(v);
    setF((x) => ({ ...x, meses: v, monto: precio && Number.isInteger(m) && m > 0 ? String(precio * m) : x.monto }));
  };

  const enviar = async (ev: FormEvent) => {
    ev.preventDefault();
    const e2: Record<string, string> = {};
    const meses = Number(f.meses);
    const monto = parseNumero(f.monto);
    if (!Number.isInteger(meses) || meses < 1 || meses > 36) e2.meses = 'Entre 1 y 36';
    if (!Number.isFinite(monto) || monto < 0) e2.monto = 'Monto inválido';
    if (!f.fecha || f.fecha > hoyISO()) e2.fecha = 'Fecha inválida';
    setErr(e2);
    if (Object.keys(e2).length) return;
    try {
      const p = await registrar.mutateAsync({ empresaId: e.id, meses, monto, medio: f.medio, fecha: f.fecha, nota: f.nota.trim() });
      toast.success(`Pago registrado: cubre hasta el ${formatFechaCorta(p.hasta)}`);
      setF((x) => ({ ...x, nota: '' }));
    } catch (er) {
      toast.error(mensajeError(er));
    }
  };

  const confirmarAnulacion = async () => {
    if (!anulando) return;
    try {
      await anular.mutateAsync(anulando);
      toast.success('Pago anulado');
      setAnulando(null);
    } catch (er) {
      toast.error(mensajeError(er));
    }
  };

  const ultimoVigente = pagos.data?.find((p) => !p.anulado)?.id;

  return (
    <div className="space-y-5">
      <form onSubmit={enviar} className="rounded-md border p-4 space-y-3" noValidate>
        <p className="text-sm font-medium">Registrar pago</p>
        <p className="text-xs text-muted-foreground">
          {e.pagado_hasta
            ? `Hoy cubre hasta el ${formatFechaCorta(e.pagado_hasta)}. Si sigue vigente, el pago se suma a continuación; si ya venció, cuenta desde la fecha del pago.`
            : 'La empresa no tiene vencimiento: el pago cuenta desde la fecha del pago.'}
        </p>
        <div className="grid gap-3 sm:grid-cols-4">
          <Campo id="pg-meses" label="Meses" error={err.meses}>
            <Input id="pg-meses" inputMode="numeric" value={f.meses} onChange={(ev) => cambiarMeses(ev.target.value)} />
          </Campo>
          <Campo id="pg-monto" label="Monto ($)" error={err.monto}>
            <Input id="pg-monto" inputMode="decimal" value={f.monto} onChange={(ev) => setF({ ...f, monto: ev.target.value })} />
          </Campo>
          <Campo id="pg-medio" label="Medio">
            <Select value={f.medio} onValueChange={(v) => setF({ ...f, medio: v })}>
              <SelectTrigger id="pg-medio">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEDIOS_COBRO.map((m) => (
                  <SelectItem key={m} value={m} className="capitalize">
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Campo>
          <Campo id="pg-fecha" label="Fecha" error={err.fecha}>
            <Input id="pg-fecha" type="date" max={hoyISO()} value={f.fecha} onChange={(ev) => setF({ ...f, fecha: ev.target.value })} />
          </Campo>
        </div>
        <div className="flex gap-3 items-end">
          <Campo id="pg-nota" label="Nota" className="flex-1">
            <Input id="pg-nota" value={f.nota} onChange={(ev) => setF({ ...f, nota: ev.target.value })} placeholder="Ej: comprobante 0012" />
          </Campo>
          <Button type="submit" disabled={registrar.isPending}>
            {registrar.isPending ? 'Registrando…' : 'Registrar'}
          </Button>
        </div>
      </form>

      {pagos.isLoading ? (
        <Cargando />
      ) : pagos.error ? (
        <ErrorCarga error={pagos.error} />
      ) : pagos.data!.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Sin pagos registrados.</p>
      ) : (
        <div className="max-h-72 overflow-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Período</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Medio</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagos.data!.map((p) => (
                <TableRow key={p.id} className={p.anulado ? 'opacity-60' : undefined}>
                  <TableCell>{formatFechaCorta(p.fecha)}</TableCell>
                  <TableCell>
                    {formatFechaCorta(p.desde)} → {formatFechaCorta(p.hasta)}
                    <span className="text-xs text-muted-foreground"> · {p.meses} {p.meses === 1 ? 'mes' : 'meses'}</span>
                    {p.nota && <p className="text-xs text-muted-foreground">{p.nota}</p>}
                    {p.anulado && <p className="text-xs text-destructive">Anulado: {p.anulado_motivo}</p>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoneda(p.monto)}</TableCell>
                  <TableCell className="capitalize">{p.medio}</TableCell>
                  <TableCell className="text-right">
                    {p.id === ultimoVigente && (
                      <Button variant="ghost" size="sm" onClick={() => setAnulando({ id: p.id, motivo: '' })}>
                        Anular
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {anulando && (
        <div className="rounded-md border border-destructive/40 p-4 space-y-3">
          <p className="text-sm">Anular el último pago devuelve el vencimiento a la fecha anterior.</p>
          <Campo id="pg-motivo" label="Motivo">
            <Input id="pg-motivo" value={anulando.motivo} onChange={(ev) => setAnulando({ ...anulando, motivo: ev.target.value })} autoFocus />
          </Campo>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAnulando(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" disabled={anulando.motivo.trim().length < 3 || anular.isPending} onClick={confirmarAnulacion}>
              Anular pago
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function EstadoTab({ e, onCerrar }: { e: EmpresaPlataforma; onCerrar: () => void }) {
  const suspender = useSuspenderEmpresa();
  const activar = useActivarEmpresa();
  const [motivo, setMotivo] = useState('');

  const hacer = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn();
      toast.success(ok);
      setMotivo('');
    } catch (er) {
      toast.error(mensajeError(er));
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-md border p-4 space-y-3">
        <h3 className="font-medium">Suspensión</h3>
        {e.suspendida ? (
          <>
            <p className="text-sm">
              Suspendida. Motivo: <strong>{e.motivo_suspension}</strong>
            </p>
            <Button onClick={() => hacer(() => suspender.mutateAsync({ id: e.id, suspender: false }), 'Empresa reactivada')}>
              Quitar suspensión
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Bloquea el acceso de todos los usuarios de la empresa (ni siquiera pueden ver datos). Para falta de pago no hace
              falta: al vencer la gracia pasa sola a solo lectura.
            </p>
            <Campo id="es-motivo" label="Motivo (lo ven los usuarios)">
              <Textarea id="es-motivo" rows={2} value={motivo} onChange={(ev) => setMotivo(ev.target.value)} />
            </Campo>
            <Button
              variant="destructive"
              disabled={motivo.trim().length < 3 || suspender.isPending}
              onClick={() => hacer(() => suspender.mutateAsync({ id: e.id, suspender: true, motivo: motivo.trim() }), 'Empresa suspendida')}
            >
              Suspender empresa
            </Button>
          </>
        )}
      </section>

      <section className="rounded-md border p-4 space-y-3">
        <h3 className="font-medium">Baja</h3>
        <p className="text-sm text-muted-foreground">
          {e.activa
            ? 'Da de baja la empresa: desaparece para sus usuarios. Los datos no se borran y se puede reactivar.'
            : 'La empresa está dada de baja. Al reactivarla sus usuarios vuelven a verla.'}
        </p>
        <Button
          variant={e.activa ? 'outline' : 'default'}
          disabled={activar.isPending}
          onClick={() =>
            hacer(async () => {
              await activar.mutateAsync({ id: e.id, activa: !e.activa });
              if (e.activa) onCerrar();
            }, e.activa ? 'Empresa dada de baja' : 'Empresa reactivada')
          }
        >
          {e.activa ? 'Dar de baja' : 'Reactivar empresa'}
        </Button>
      </section>
    </div>
  );
}

export function EmpresaDetalleDialog({ empresa, onCerrar }: { empresa: EmpresaPlataforma | null; onCerrar: () => void }) {
  return (
    <Dialog open={!!empresa} onOpenChange={(o) => !o && onCerrar()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        {empresa && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {empresa.nombre}
                <EstadoBadge estado={empresa.estado} sinVencimiento={!empresa.pagado_hasta} />
              </DialogTitle>
              <DialogDescription>
                {RUBRO_LABEL[empresa.rubro]} · {empresa.plan_nombre ?? 'Sin plan'} · alta {formatFecha(empresa.created_at)}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline">
                Usuarios {empresa.usuarios_activos}
                {empresa.max_usuarios ? ` / ${empresa.max_usuarios}` : ''}
              </Badge>
              <Badge variant="outline">
                Productos {empresa.productos_activos}
                {empresa.max_productos ? ` / ${empresa.max_productos}` : ''}
              </Badge>
              <Badge variant="outline">Ventas 30 días {formatMoneda(empresa.ventas_30d)}</Badge>
            </div>
            <Tabs defaultValue="datos">
              <TabsList>
                <TabsTrigger value="datos">Plan y datos</TabsTrigger>
                <TabsTrigger value="pagos">Pagos</TabsTrigger>
                <TabsTrigger value="estado">Suspensión y baja</TabsTrigger>
              </TabsList>
              <TabsContent value="datos" className="mt-4">
                <DatosTab e={empresa} />
              </TabsContent>
              <TabsContent value="pagos" className="mt-4">
                <PagosTab e={empresa} />
              </TabsContent>
              <TabsContent value="estado" className="mt-4">
                <EstadoTab e={empresa} onCerrar={onCerrar} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
