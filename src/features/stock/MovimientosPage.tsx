import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { Download, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useEmpresa } from '@/auth/AuthProvider';
import { formatFecha, formatNumero, mensajeError } from '@/lib/format';
import { descargarCsv, fechaArchivo } from '@/lib/csv';
import { useProductos } from '@/features/productos/api';
import { PageHeader } from '@/app/components/comun/PageHeader';
import { Cargando, ErrorCarga } from '@/app/components/comun/Estados';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { ProductoPicker } from './ProductoPicker';
import { TIPO_MOV_LABEL, type TipoMovimiento } from './etiquetas';
import {
  type FiltrosMovimientos,
  type MovimientoConDetalle,
  MOV_POR_PAGINA,
  traerMovimientosParaExportar,
  useMovimientos,
} from './api';

const TODOS = '__todos__';

export default function MovimientosPage() {
  const { empresa } = useEmpresa();
  const [params, setParams] = useSearchParams();
  const { data: productos = [] } = useProductos();
  const [pagina, setPagina] = useState(0);
  const [exportando, setExportando] = useState(false);

  const filtros: FiltrosMovimientos = {
    desde: params.get('desde') ?? '',
    hasta: params.get('hasta') ?? '',
    tipo: (params.get('tipo') as TipoMovimiento | null) ?? '',
    productoId: params.get('producto') ?? '',
  };

  const setFiltro = (clave: string, valor: string) => {
    const nuevos = new URLSearchParams(params);
    if (valor) nuevos.set(clave, valor);
    else nuevos.delete(clave);
    setParams(nuevos, { replace: true });
    setPagina(0);
  };

  const { data, isLoading, error, isFetching } = useMovimientos(filtros, pagina);
  const total = data?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / MOV_POR_PAGINA));
  const productoFiltrado = productos.find((p) => p.id === filtros.productoId);
  const hayFiltros = !!(filtros.desde || filtros.hasta || filtros.tipo || filtros.productoId);

  const exportar = async () => {
    setExportando(true);
    try {
      const filas = await traerMovimientosParaExportar(empresa.id, filtros);
      descargarCsv<MovimientoConDetalle>(`movimientos-${fechaArchivo()}`, filas, [
        { titulo: 'Fecha', valor: (m) => formatFecha(m.fecha) },
        { titulo: 'Código', valor: (m) => m.producto?.codigo },
        { titulo: 'Producto', valor: (m) => m.producto?.nombre },
        { titulo: 'Tipo', valor: (m) => TIPO_MOV_LABEL[m.tipo] },
        { titulo: 'Cantidad', valor: (m) => Number(m.cantidad) },
        { titulo: 'Stock resultante', valor: (m) => Number(m.stock_resultante) },
        { titulo: 'Unidad', valor: (m) => m.producto?.unidad_codigo },
        { titulo: 'Usuario', valor: (m) => m.usuario?.nombre ?? m.usuario?.email },
        { titulo: 'Observaciones', valor: (m) => m.observaciones },
      ]);
      if (filas.length >= 5000) toast.info('Se exportaron los primeros 5000 movimientos. Acotá las fechas para ver el resto.');
    } catch (err) {
      toast.error(mensajeError(err));
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        titulo="Movimientos de stock"
        descripcion="Historial de todo lo que entró y salió. Los movimientos no se pueden editar ni borrar."
        acciones={
          <Button variant="outline" onClick={() => void exportar()} disabled={exportando || total === 0}>
            {exportando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Exportar CSV
          </Button>
        }
      />

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto] gap-3 items-end">
          <div className="space-y-1.5">
            <Label>Producto</Label>
            <div className="flex gap-1">
              <ProductoPicker
                productos={productos}
                valor={filtros.productoId || undefined}
                onSeleccionar={(p) => setFiltro('producto', p.id)}
                placeholder="Todos los productos"
                className="flex-1 min-w-0"
              />
              {filtros.productoId && (
                <Button variant="ghost" size="icon" onClick={() => setFiltro('producto', '')} aria-label="Quitar filtro de producto">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tipo">Tipo</Label>
            <Select value={filtros.tipo || TODOS} onValueChange={(v) => setFiltro('tipo', v === TODOS ? '' : v)}>
              <SelectTrigger id="tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos los tipos</SelectItem>
                {Object.entries(TIPO_MOV_LABEL).map(([k, l]) => (
                  <SelectItem key={k} value={k}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="desde">Desde</Label>
            <Input id="desde" type="date" value={filtros.desde} max={filtros.hasta || undefined} onChange={(e) => setFiltro('desde', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hasta">Hasta</Label>
            <Input id="hasta" type="date" value={filtros.hasta} min={filtros.desde || undefined} onChange={(e) => setFiltro('hasta', e.target.value)} />
          </div>
          <Button variant="ghost" disabled={!hayFiltros} onClick={() => { setParams(new URLSearchParams(), { replace: true }); setPagina(0); }}>
            Limpiar
          </Button>
        </div>
      </Card>

      {productoFiltrado && productoFiltrado.controla_stock && (
        <Card className="p-4 flex flex-wrap gap-x-8 gap-y-1 text-sm">
          <span>
            <span className="text-muted-foreground">Producto: </span>
            {productoFiltrado.codigo} · {productoFiltrado.nombre}
          </span>
          <span>
            <span className="text-muted-foreground">Stock actual: </span>
            <strong className="tabular-nums">
              {formatNumero(productoFiltrado.stock_actual)} {productoFiltrado.unidad_codigo}
            </strong>
          </span>
          <span>
            <span className="text-muted-foreground">Stock mínimo: </span>
            <span className="tabular-nums">{formatNumero(productoFiltrado.stock_minimo)}</span>
          </span>
        </Card>
      )}

      {isLoading ? (
        <Cargando />
      ) : error ? (
        <ErrorCarga error={error} />
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table className={isFetching ? 'opacity-60 transition-opacity' : ''}>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Stock resultante</TableHead>
                <TableHead className="hidden md:table-cell">Usuario</TableHead>
                <TableHead className="hidden lg:table-cell">Detalle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.filas.map((m) => {
                const c = Number(m.cantidad);
                return (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-nowrap text-sm">{formatFecha(m.fecha)}</TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="text-left text-sm font-normal hover:underline"
                        onClick={() => setFiltro('producto', m.producto_id)}
                        title="Ver solo este producto"
                      >
                        <span className="font-mono text-xs text-muted-foreground mr-2">{m.producto?.codigo}</span>
                        {m.producto?.nombre}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] whitespace-nowrap">
                        {TIPO_MOV_LABEL[m.tipo]}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right tabular-nums ${c > 0 ? 'text-green-700 dark:text-green-400' : 'text-destructive'}`}>
                      {c > 0 ? '+' : ''}
                      {formatNumero(c)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumero(m.stock_resultante)}{' '}
                      <span className="text-xs text-muted-foreground">{m.producto?.unidad_codigo}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {m.usuario?.nombre ?? m.usuario?.email ?? 'Sistema'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground text-sm max-w-xs truncate">
                      {m.observaciones ?? '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
              {data?.filas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                    {hayFiltros ? 'No hay movimientos con esos filtros.' : 'Todavía no hay movimientos.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
            <span className="text-muted-foreground">
              {total} movimientos · página {pagina + 1} de {totalPaginas}
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
    </div>
  );
}
