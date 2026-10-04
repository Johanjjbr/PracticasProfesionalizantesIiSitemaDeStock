import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { LogIn, Plus, Search, Settings2 } from 'lucide-react';
import { useAuth } from '@/auth/AuthProvider';
import { formatFecha, formatFechaCorta, formatMoneda } from '@/lib/format';
import { RUBRO_LABEL } from '@/lib/rubros';
import { PageHeader } from '@/app/components/comun/PageHeader';
import { Cargando, ErrorCarga } from '@/app/components/comun/Estados';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { useEmpresasPlataforma } from './api';
import { EstadoBadge } from './EstadoBadge';
import { NuevaEmpresaDialog } from './NuevaEmpresaDialog';
import { EmpresaDetalleDialog } from './EmpresaDetalleDialog';

const FILTROS = {
  todas: 'Todas (sin bajas)',
  atencion: 'Requieren atención',
  activa: 'Al día',
  gracia: 'En gracia',
  vencida: 'Vencidas',
  suspendida: 'Suspendidas',
  baja: 'Dadas de baja',
} as const;
type Filtro = keyof typeof FILTROS;

function Kpi({ titulo, valor, detalle }: { titulo: string; valor: string; detalle?: string }) {
  return (
    <Card className="p-4 gap-1">
      <p className="text-sm text-muted-foreground">{titulo}</p>
      <p className="text-2xl tabular-nums">{valor}</p>
      {detalle && <p className="text-xs text-muted-foreground">{detalle}</p>}
    </Card>
  );
}

export default function EmpresasPlataformaPage() {
  const empresas = useEmpresasPlataforma();
  const { seleccionarEmpresa, recargar } = useAuth();
  const navigate = useNavigate();
  const [texto, setTexto] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [nueva, setNueva] = useState(false);
  const [detalleId, setDetalleId] = useState<string | null>(null);

  const lista = empresas.data ?? [];
  const detalle = lista.find((e) => e.id === detalleId) ?? null;

  const kpis = useMemo(() => {
    const vigentes = lista.filter((e) => e.estado !== 'baja');
    const cobrando = vigentes.filter((e) => e.estado !== 'suspendida' && e.pagado_hasta);
    return {
      activas: vigentes.length,
      atencion: vigentes.filter((e) => ['gracia', 'vencida', 'suspendida'].includes(e.estado)).length,
      mensual: cobrando.reduce((s, e) => s + Number(e.precio_mensual ?? 0), 0),
      cobrando: cobrando.length,
    };
  }, [lista]);

  const filtradas = useMemo(() => {
    const q = texto.trim().toLowerCase();
    return lista.filter((e) => {
      if (q && !e.nombre.toLowerCase().includes(q)) return false;
      if (filtro === 'todas') return e.estado !== 'baja';
      if (filtro === 'atencion') return ['gracia', 'vencida', 'suspendida'].includes(e.estado);
      return e.estado === filtro;
    });
  }, [lista, texto, filtro]);

  const entrar = (id: string) => {
    seleccionarEmpresa(id);
    navigate('/dashboard');
    void recargar(); // por si la empresa es nueva y todavía no está en la lista del selector
  };

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Empresas"
        descripcion="Alta de clientes, planes, pagos y corte de servicio"
        acciones={
          <Button onClick={() => setNueva(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva empresa
          </Button>
        }
      />

      {empresas.isLoading ? (
        <Cargando />
      ) : empresas.error ? (
        <ErrorCarga error={empresas.error} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Kpi titulo="Empresas activas" valor={String(kpis.activas)} />
            <Kpi titulo="Requieren atención" valor={String(kpis.atencion)} detalle="En gracia, vencidas o suspendidas" />
            <Kpi
              titulo="Ingreso mensual estimado"
              valor={formatMoneda(kpis.mensual)}
              detalle={`Según el plan de ${kpis.cobrando} empresa${kpis.cobrando === 1 ? '' : 's'} con vencimiento`}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Buscar empresa"
                placeholder="Buscar empresa…"
                className="pl-9"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
              />
            </div>
            <Select value={filtro} onValueChange={(v) => setFiltro(v as Filtro)}>
              <SelectTrigger className="sm:w-56" aria-label="Filtrar por estado">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(FILTROS) as Filtro[]).map((f) => (
                  <SelectItem key={f} value={f}>
                    {FILTROS[f]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Pagado hasta</TableHead>
                    <TableHead className="text-right">Usuarios</TableHead>
                    <TableHead className="text-right">Productos</TableHead>
                    <TableHead>Última venta</TableHead>
                    <TableHead className="w-28" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtradas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        {lista.length === 0 ? 'Todavía no hay empresas. Creá la primera.' : 'Ninguna empresa coincide con el filtro.'}
                      </TableCell>
                    </TableRow>
                  )}
                  {filtradas.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>
                        <button className="text-left hover:underline" onClick={() => setDetalleId(e.id)}>
                          {e.nombre}
                        </button>
                        <p className="text-xs text-muted-foreground">{RUBRO_LABEL[e.rubro]}</p>
                      </TableCell>
                      <TableCell>
                        {e.plan_nombre ?? <span className="text-muted-foreground">Sin plan</span>}
                        {e.precio_mensual != null && (
                          <p className="text-xs text-muted-foreground">{formatMoneda(e.precio_mensual)}/mes</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <EstadoBadge estado={e.estado} sinVencimiento={!e.pagado_hasta} />
                      </TableCell>
                      <TableCell className="tabular-nums">{formatFechaCorta(e.pagado_hasta)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {e.usuarios_activos}
                        {e.max_usuarios ? <span className="text-muted-foreground"> / {e.max_usuarios}</span> : ''}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {e.productos_activos}
                        {e.max_productos ? <span className="text-muted-foreground"> / {e.max_productos}</span> : ''}
                      </TableCell>
                      <TableCell className="text-sm">{e.ultima_venta ? formatFecha(e.ultima_venta) : '—'}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" aria-label={`Gestionar ${e.nombre}`} onClick={() => setDetalleId(e.id)}>
                            <Settings2 className="w-4 h-4" />
                          </Button>
                          {e.estado !== 'baja' && (
                            <Button variant="ghost" size="sm" aria-label={`Entrar a ${e.nombre}`} onClick={() => entrar(e.id)}>
                              <LogIn className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}

      <NuevaEmpresaDialog abierto={nueva} onCerrar={() => setNueva(false)} />
      <EmpresaDetalleDialog empresa={detalle} onCerrar={() => setDetalleId(null)} />
    </div>
  );
}
