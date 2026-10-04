import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Download, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useEmpresa } from '@/auth/AuthProvider';
import { puede } from '@/auth/permisos';
import { formatFecha, formatFechaCorta, formatMoneda, mensajeError } from '@/lib/format';
import { descargarCsv, fechaArchivo } from '@/lib/csv';
import { useProveedores } from '@/features/proveedores/api';
import { PageHeader } from '@/app/components/comun/PageHeader';
import { Cargando, ErrorCarga } from '@/app/components/comun/Estados';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import {
  COMPRAS_POR_PAGINA,
  type CompraListado,
  type EstadoCompra,
  type FiltrosCompras,
  traerComprasParaExportar,
  useCompras,
} from './api';
import CompraDetalleDialog from './CompraDetalleDialog';

const TODOS = '__todos__';
const cantidadItems = (c: CompraListado) => (c.items as unknown as { count: number }[])[0]?.count ?? 0;

export default function ComprasPage() {
  const { empresa, rol } = useEmpresa();
  const gestiona = puede('gestionarCatalogo', rol);
  const [params, setParams] = useSearchParams();
  const { data: proveedores = [] } = useProveedores();
  const [pagina, setPagina] = useState(0);
  const [exportando, setExportando] = useState(false);

  const filtros: FiltrosCompras = {
    proveedorId: params.get('proveedor') ?? '',
    estado: (params.get('estado') as EstadoCompra | null) ?? '',
    desde: params.get('desde') ?? '',
    hasta: params.get('hasta') ?? '',
  };
  const compraAbierta = params.get('ver');

  const setParam = (clave: string, valor: string, resetPagina = true) => {
    const p = new URLSearchParams(params);
    if (valor) p.set(clave, valor);
    else p.delete(clave);
    setParams(p, { replace: true });
    if (resetPagina) setPagina(0);
  };

  const { data, isLoading, error, isFetching } = useCompras(filtros, pagina);
  const total = data?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / COMPRAS_POR_PAGINA));
  const sumaPagina = (data?.filas ?? []).filter((c) => c.estado === 'confirmada').reduce((s, c) => s + Number(c.total), 0);

  const exportar = async () => {
    setExportando(true);
    try {
      const filas = await traerComprasParaExportar(empresa.id, filtros);
      descargarCsv<CompraListado>(`compras-${fechaArchivo()}`, filas, [
        { titulo: 'N°', valor: (c) => c.numero },
        { titulo: 'Fecha', valor: (c) => formatFecha(c.fecha) },
        { titulo: 'Proveedor', valor: (c) => c.proveedor?.razon_social },
        { titulo: 'Tipo comprobante', valor: (c) => c.tipo_comprobante },
        { titulo: 'N° comprobante', valor: (c) => c.nro_comprobante },
        { titulo: 'Fecha comprobante', valor: (c) => formatFechaCorta(c.fecha_comprobante) },
        { titulo: 'Productos', valor: (c) => cantidadItems(c) },
        { titulo: 'Total', valor: (c) => Number(c.total) },
        { titulo: 'Estado', valor: (c) => (c.estado === 'anulada' ? 'Anulada' : 'Confirmada') },
        { titulo: 'Usuario', valor: (c) => c.usuario?.nombre ?? c.usuario?.email },
      ]);
    } catch (err) {
      toast.error(mensajeError(err));
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        titulo="Compras"
        descripcion="Mercadería recibida de proveedores."
        acciones={
          <>
            <Button variant="outline" onClick={() => void exportar()} disabled={exportando || total === 0}>
              {exportando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Exportar CSV
            </Button>
            {gestiona && (
              <Button asChild>
                <Link to="/compras/nueva">
                  <Plus className="w-4 h-4 mr-2" /> Nueva compra
                </Link>
              </Button>
            )}
          </>
        }
      />

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto] gap-3 items-end">
          <div className="space-y-1.5">
            <Label htmlFor="f-proveedor">Proveedor</Label>
            <Select value={filtros.proveedorId || TODOS} onValueChange={(v) => setParam('proveedor', v === TODOS ? '' : v)}>
              <SelectTrigger id="f-proveedor">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos los proveedores</SelectItem>
                {proveedores.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.razon_social}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-estado">Estado</Label>
            <Select value={filtros.estado || TODOS} onValueChange={(v) => setParam('estado', v === TODOS ? '' : v)}>
              <SelectTrigger id="f-estado">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todas</SelectItem>
                <SelectItem value="confirmada">Confirmadas</SelectItem>
                <SelectItem value="anulada">Anuladas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-desde">Desde</Label>
            <Input id="f-desde" type="date" value={filtros.desde} onChange={(e) => setParam('desde', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-hasta">Hasta</Label>
            <Input id="f-hasta" type="date" value={filtros.hasta} onChange={(e) => setParam('hasta', e.target.value)} />
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              setParams(new URLSearchParams(), { replace: true });
              setPagina(0);
            }}
          >
            Limpiar
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <Cargando />
      ) : error ? (
        <ErrorCarga error={error} />
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table className={isFetching ? 'opacity-60 transition-opacity' : ''}>
            <TableHeader>
              <TableRow>
                <TableHead>N°</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead className="hidden md:table-cell">Comprobante</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Productos</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.filas.map((c) => (
                <TableRow
                  key={c.id}
                  className={`cursor-pointer ${c.estado === 'anulada' ? 'opacity-60' : ''}`}
                  onClick={() => setParam('ver', c.id, false)}
                >
                  <TableCell className="tabular-nums">
                    <button type="button" className="hover:underline" aria-label={`Ver compra ${c.numero}`}>
                      #{c.numero}
                    </button>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">{formatFecha(c.fecha)}</TableCell>
                  <TableCell>{c.proveedor?.razon_social}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {[c.tipo_comprobante, c.nro_comprobante].filter(Boolean).join(' ') || '—'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums hidden sm:table-cell">{cantidadItems(c)}</TableCell>
                  <TableCell className={`text-right tabular-nums ${c.estado === 'anulada' ? 'line-through' : ''}`}>
                    {formatMoneda(c.total)}
                  </TableCell>
                  <TableCell>
                    {c.estado === 'anulada' ? (
                      <Badge variant="destructive" className="text-[10px]">
                        Anulada
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">
                        Confirmada
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {data?.filas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                    No hay compras {filtros.proveedorId || filtros.estado || filtros.desde || filtros.hasta ? 'con esos filtros' : 'registradas'}.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 border-t text-sm">
            <span className="text-muted-foreground">
              {total} compras · página {pagina + 1} de {totalPaginas} · total de la página (sin anuladas):{' '}
              <strong className="text-foreground">{formatMoneda(sumaPagina)}</strong>
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={pagina === 0} onClick={() => setPagina(pagina - 1)}>
                Anterior
              </Button>
              <Button variant="outline" size="sm" disabled={pagina >= totalPaginas - 1} onClick={() => setPagina(pagina + 1)}>
                Siguiente
              </Button>
            </div>
          </div>
        </Card>
      )}

      <CompraDetalleDialog compraId={compraAbierta} onCerrar={() => setParam('ver', '', false)} />
    </div>
  );
}
