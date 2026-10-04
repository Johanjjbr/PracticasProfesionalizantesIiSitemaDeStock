import { useState, type FormEvent } from 'react';
import { Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth, useEmpresa } from '@/auth/AuthProvider';
import { puede } from '@/auth/permisos';
import { formatFecha, formatMoneda, mensajeError } from '@/lib/format';
import { parseNumero } from '@/lib/validaciones';
import { PageHeader } from '@/app/components/comun/PageHeader';
import { Cargando, ErrorCarga } from '@/app/components/comun/Estados';
import { Campo } from '@/app/components/comun/Campo';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { CAJAS_POR_PAGINA, useAbrirCaja, useCajaDetalle, useHistorialCajas, useMiCaja } from './api';
import PanelCaja from './PanelCaja';

function AbrirCaja() {
  const abrir = useAbrirCaja();
  const [monto, setMonto] = useState('');
  const [obs, setObs] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const n = monto.trim() === '' ? 0 : parseNumero(monto);
    if (Number.isNaN(n) || n < 0) {
      setError('Ingresá un monto válido (puede ser 0)');
      return;
    }
    try {
      const s = await abrir.mutateAsync({ monto: n, observaciones: obs });
      toast.success(`Caja #${s.numero} abierta con ${formatMoneda(s.monto_inicial)}`);
    } catch (err) {
      toast.error(mensajeError(err));
    }
  };

  return (
    <Card className="p-8 max-w-lg mx-auto text-center space-y-5">
      <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
        <Wallet className="w-7 h-7 text-primary" />
      </div>
      <div>
        <h2 className="text-xl">No tenés una caja abierta</h2>
        <p className="text-sm text-muted-foreground">
          Abrí la caja con el efectivo que hay para dar cambio. Para vender vas a necesitar una caja abierta.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4 text-left" noValidate>
        <Campo id="monto-inicial" label="Efectivo inicial" error={error}>
          <Input
            id="monto-inicial"
            inputMode="decimal"
            placeholder="0"
            value={monto}
            onChange={(e) => {
              setMonto(e.target.value);
              setError('');
            }}
            autoFocus
          />
        </Campo>
        <Campo id="obs-apertura" label="Observaciones">
          <Input id="obs-apertura" value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ej: turno mañana" />
        </Campo>
        <Button type="submit" className="w-full" disabled={abrir.isPending}>
          {abrir.isPending ? 'Abriendo…' : 'Abrir caja'}
        </Button>
      </form>
    </Card>
  );
}

function MiCaja() {
  const { data: sesion, isLoading, error } = useMiCaja();
  if (isLoading) return <Cargando />;
  if (error) return <ErrorCarga error={error} />;
  return sesion ? <PanelCaja sesion={sesion} editable /> : <AbrirCaja />;
}

function DetalleCajaDialog({ id, onCerrar }: { id: string | null; onCerrar: () => void }) {
  const { rol } = useEmpresa();
  const { session } = useAuth();
  const { data, isLoading, error } = useCajaDetalle(id);
  // Admin/encargado pueden operar y cerrar cajas de otros (ej. si alguien se olvidó de cerrarla)
  const editable = !!data && (puede('gestionarCatalogo', rol) || data.usuario_id === session?.user.id);
  return (
    <Dialog open={!!id} onOpenChange={(o) => !o && onCerrar()}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? `Caja #${data.numero}` : 'Caja'}</DialogTitle>
          <DialogDescription>Detalle de la sesión de caja</DialogDescription>
        </DialogHeader>
        {isLoading || !data ? error ? <ErrorCarga error={error} /> : <Cargando /> : <PanelCaja sesion={data} editable={editable} />}
      </DialogContent>
    </Dialog>
  );
}

function Historial() {
  const [pagina, setPagina] = useState(0);
  const [soloAbiertas, setSoloAbiertas] = useState(false);
  const [abierta, setAbierta] = useState<string | null>(null);
  const { data, isLoading, error, isFetching } = useHistorialCajas(pagina, soloAbiertas);

  if (isLoading) return <Cargando />;
  if (error) return <ErrorCarga error={error} />;
  const total = data?.total ?? 0;
  const paginas = Math.max(1, Math.ceil(total / CAJAS_POR_PAGINA));

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button variant={soloAbiertas ? 'outline' : 'secondary'} size="sm" onClick={() => { setSoloAbiertas(false); setPagina(0); }}>
          Todas
        </Button>
        <Button variant={soloAbiertas ? 'secondary' : 'outline'} size="sm" onClick={() => { setSoloAbiertas(true); setPagina(0); }}>
          Solo abiertas
        </Button>
      </div>
      <Card className="p-0 overflow-hidden">
        <Table className={isFetching ? 'opacity-60' : ''}>
          <TableHeader>
            <TableRow>
              <TableHead>N°</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Apertura</TableHead>
              <TableHead className="hidden md:table-cell">Cierre</TableHead>
              <TableHead className="text-right hidden sm:table-cell">Inicial</TableHead>
              <TableHead className="text-right">Contado</TableHead>
              <TableHead className="text-right">Diferencia</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.filas.map((s) => {
              const d = Number(s.diferencia ?? 0);
              return (
                <TableRow key={s.id} className="cursor-pointer" onClick={() => setAbierta(s.id)}>
                  <TableCell className="tabular-nums">
                    <button type="button" className="hover:underline">#{s.numero}</button>
                  </TableCell>
                  <TableCell>{s.usuario?.nombre ?? s.usuario?.email}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm">{formatFecha(s.apertura_at)}</TableCell>
                  <TableCell className="hidden md:table-cell whitespace-nowrap text-sm">
                    {s.estado === 'abierta' ? <Badge className="bg-green-600 hover:bg-green-600">Abierta</Badge> : formatFecha(s.cierre_at)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums hidden sm:table-cell">{formatMoneda(s.monto_inicial)}</TableCell>
                  <TableCell className="text-right tabular-nums">{s.estado === 'cerrada' ? formatMoneda(s.efectivo_contado) : '—'}</TableCell>
                  <TableCell
                    className={`text-right tabular-nums ${s.estado === 'cerrada' && d !== 0 ? (d > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-destructive') : ''}`}
                  >
                    {s.estado === 'cerrada' ? (d === 0 ? 'OK' : `${d > 0 ? '+' : '−'}${formatMoneda(Math.abs(d))}`) : '—'}
                  </TableCell>
                </TableRow>
              );
            })}
            {data?.filas.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                  No hay cajas {soloAbiertas ? 'abiertas' : 'registradas'}.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {paginas > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
            <span className="text-muted-foreground">Página {pagina + 1} de {paginas}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={pagina === 0} onClick={() => setPagina(pagina - 1)}>Anterior</Button>
              <Button variant="outline" size="sm" disabled={pagina >= paginas - 1} onClick={() => setPagina(pagina + 1)}>Siguiente</Button>
            </div>
          </div>
        )}
      </Card>
      <DetalleCajaDialog id={abierta} onCerrar={() => setAbierta(null)} />
    </div>
  );
}

export default function CajaPage() {
  const [tab, setTab] = useState('mia');
  return (
    <div className="space-y-4">
      <PageHeader titulo="Caja" descripcion="Apertura, ingresos, retiros y cierre con arqueo de efectivo." />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="mia">Mi caja</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>
        <TabsContent value="mia" className="mt-4">
          <MiCaja />
        </TabsContent>
        <TabsContent value="historial" className="mt-4">
          <Historial />
        </TabsContent>
      </Tabs>
    </div>
  );
}
