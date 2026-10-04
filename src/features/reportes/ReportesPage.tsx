import { useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { useEmpresa } from '@/auth/AuthProvider';
import { puede } from '@/auth/permisos';
import { formatMoneda, formatNumero } from '@/lib/format';
import { PRESET_LABEL, type Preset, diaConSemana, rangoDePreset } from '@/lib/fechas';
import { descargarCsv } from '@/lib/csv';
import { TIPO_PRODUCTO_LABEL } from '@/lib/rubros';
import { MEDIO_PAGO_LABEL } from '@/features/caja/api';
import { useProductos } from '@/features/productos/api';
import { PageHeader } from '@/app/components/comun/PageHeader';
import { Cargando, ErrorCarga } from '@/app/components/comun/Estados';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { ColumnasPorDia } from '@/app/components/graficos/ColumnasPorDia';
import { Ranking } from '@/app/components/graficos/Ranking';
import {
  type Rango,
  useComprasPorProveedor,
  usePorDia,
  usePorMedio,
  usePorProducto,
  usePorUsuario,
  useReposicion,
  useResumenVentas,
} from './api';

const pct = (a: number, b: number) => (b > 0 ? `${((a / b) * 100).toFixed(0)}%` : '—');
const sufijo = (r: Rango) => (r.desde === r.hasta ? r.desde : `${r.desde}_a_${r.hasta}`);

function Dato({ titulo, valor, detalle }: { titulo: string; valor: string; detalle?: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{titulo}</p>
      <p className="text-2xl mt-1 tabular-nums">{valor}</p>
      {detalle && <p className="text-xs text-muted-foreground mt-0.5">{detalle}</p>}
    </Card>
  );
}

// ---------------------------------------------------------------------------
function TabVentas({ rango, verCostos }: { rango: Rango; verCostos: boolean }) {
  const resumen = useResumenVentas(rango);
  const porDia = usePorDia(rango);
  const porMedio = usePorMedio(rango);
  const porProducto = usePorProducto(rango);
  const porUsuario = usePorUsuario(rango);

  const porCategoria = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of porProducto.data ?? []) m.set(p.categoria ?? 'Sin categoría', (m.get(p.categoria ?? 'Sin categoría') ?? 0) + Number(p.total));
    return [...m].sort((a, b) => b[1] - a[1]);
  }, [porProducto.data]);

  if (resumen.isLoading) return <Cargando />;
  if (resumen.error) return <ErrorCarga error={resumen.error} />;
  const r = resumen.data;
  const total = Number(r?.total ?? 0);

  const exportar = () =>
    descargarCsv(`ventas-por-dia-${sufijo(rango)}`, porDia.data ?? [], [
      { titulo: 'Día', valor: (d) => d.dia },
      { titulo: 'Ventas', valor: (d) => Number(d.cantidad) },
      { titulo: 'Total', valor: (d) => Number(d.total) },
    ]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Dato titulo="Total vendido" valor={formatMoneda(total)} detalle={`${r?.cantidad ?? 0} ventas`} />
        <Dato titulo="Ticket promedio" valor={formatMoneda(r?.ticket_promedio)} />
        {verCostos ? (
          <Dato
            titulo="Ganancia bruta"
            valor={formatMoneda(r?.ganancia)}
            detalle={`Margen ${pct(Number(r?.ganancia ?? 0), total)} · costo ${formatMoneda(r?.costo)}`}
          />
        ) : (
          <Dato titulo="Descuentos" valor={formatMoneda(r?.descuentos)} />
        )}
        <Dato
          titulo="Anuladas"
          valor={String(r?.anuladas ?? 0)}
          detalle={Number(r?.anuladas ?? 0) > 0 ? `${formatMoneda(r?.total_anulado)} anulados` : 'Sin anulaciones'}
        />
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">Ventas por día</h3>
          <Button variant="ghost" size="sm" onClick={exportar} disabled={!porDia.data?.length}>
            <Download className="w-4 h-4 mr-2" /> CSV
          </Button>
        </div>
        {porDia.isLoading ? (
          <Cargando />
        ) : (
          <ColumnasPorDia datos={(porDia.data ?? []).map((d) => ({ dia: d.dia, total: Number(d.total), cantidad: Number(d.cantidad) }))} />
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5">
          <h3 className="font-medium mb-4">Por medio de pago</h3>
          <Ranking
            filas={(porMedio.data ?? []).map((m) => ({
              clave: m.medio_pago,
              etiqueta: MEDIO_PAGO_LABEL[m.medio_pago],
              valor: Number(m.total),
              detalle: `${pct(Number(m.total), total)} del total`,
            }))}
            formato={formatMoneda}
          />
        </Card>
        <Card className="p-5">
          <h3 className="font-medium mb-4">Por categoría</h3>
          <Ranking
            filas={porCategoria.slice(0, 8).map(([cat, v]) => ({ clave: cat, etiqueta: cat, valor: v, detalle: `${pct(v, total)} del total` }))}
            formato={formatMoneda}
          />
          {porCategoria.length > 8 && <p className="text-xs text-muted-foreground mt-3">+{porCategoria.length - 8} categorías más</p>}
        </Card>
        <Card className="p-5">
          <h3 className="font-medium mb-4">Por vendedor</h3>
          <Ranking
            filas={(porUsuario.data ?? []).map((u) => ({
              clave: u.usuario_id ?? u.usuario,
              etiqueta: u.usuario,
              valor: Number(u.total),
              detalle: `${u.cantidad} ventas`,
            }))}
            formato={formatMoneda}
          />
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
type OrdenProd = 'total' | 'cantidad' | 'ganancia';

function TabProductos({ rango, verCostos }: { rango: Rango; verCostos: boolean }) {
  const { data, isLoading, error } = usePorProducto(rango);
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState<OrdenProd>('total');

  const filas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return (data ?? [])
      .filter((p) => !q || `${p.codigo} ${p.nombre} ${p.categoria ?? ''}`.toLowerCase().includes(q))
      .sort((a, b) => Number(b[orden]) - Number(a[orden]));
  }, [data, busqueda, orden]);

  if (isLoading) return <Cargando />;
  if (error) return <ErrorCarga error={error} />;

  const tot = filas.reduce((s, p) => ({ total: s.total + Number(p.total), ganancia: s.ganancia + Number(p.ganancia) }), { total: 0, ganancia: 0 });

  const exportar = () =>
    descargarCsv(`productos-vendidos-${sufijo(rango)}`, filas, [
      { titulo: 'Código', valor: (p) => p.codigo },
      { titulo: 'Producto', valor: (p) => p.nombre },
      { titulo: 'Categoría', valor: (p) => p.categoria },
      { titulo: 'Unidad', valor: (p) => p.unidad },
      { titulo: 'Cantidad', valor: (p) => Number(p.cantidad) },
      { titulo: 'Ventas', valor: (p) => Number(p.ventas) },
      { titulo: 'Total', valor: (p) => Number(p.total) },
      ...(verCostos
        ? [
            { titulo: 'Costo', valor: (p: (typeof filas)[number]) => Number(p.costo) },
            { titulo: 'Ganancia', valor: (p: (typeof filas)[number]) => Number(p.ganancia) },
          ]
        : []),
    ]);

  return (
    <Card className="p-0 overflow-hidden">
      <div className="p-4 flex flex-col md:flex-row gap-3 md:items-center border-b">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar producto" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} aria-label="Buscar producto" />
        </div>
        <Select value={orden} onValueChange={(v) => setOrden(v as OrdenProd)}>
          <SelectTrigger className="md:w-52" aria-label="Ordenar por">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="total">Ordenar por importe</SelectItem>
            <SelectItem value="cantidad">Ordenar por cantidad</SelectItem>
            {verCostos && <SelectItem value="ganancia">Ordenar por ganancia</SelectItem>}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportar} disabled={filas.length === 0}>
          <Download className="w-4 h-4 mr-2" /> CSV
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">#</TableHead>
            <TableHead>Producto</TableHead>
            <TableHead className="hidden md:table-cell">Categoría</TableHead>
            <TableHead className="text-right">Cantidad</TableHead>
            <TableHead className="text-right">Importe</TableHead>
            {verCostos && <TableHead className="text-right hidden sm:table-cell">Ganancia</TableHead>}
            {verCostos && <TableHead className="text-right hidden lg:table-cell">Margen</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filas.map((p, i) => (
            <TableRow key={p.producto_id}>
              <TableCell className="text-muted-foreground tabular-nums">{i + 1}</TableCell>
              <TableCell>
                <span className="font-mono text-xs text-muted-foreground mr-2">{p.codigo}</span>
                {p.nombre}
              </TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground">{p.categoria ?? '—'}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNumero(p.cantidad)} <span className="text-xs text-muted-foreground">{p.unidad}</span>
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatMoneda(p.total)}</TableCell>
              {verCostos && <TableCell className="text-right tabular-nums hidden sm:table-cell">{formatMoneda(p.ganancia)}</TableCell>}
              {verCostos && (
                <TableCell className="text-right tabular-nums hidden lg:table-cell text-muted-foreground">
                  {pct(Number(p.ganancia), Number(p.total))}
                </TableCell>
              )}
            </TableRow>
          ))}
          {filas.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                Sin ventas en el período.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        {filas.length > 0 && (
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4} className="text-right">Total</TableCell>
              <TableCell className="text-right tabular-nums">{formatMoneda(tot.total)}</TableCell>
              {verCostos && <TableCell className="text-right tabular-nums hidden sm:table-cell">{formatMoneda(tot.ganancia)}</TableCell>}
              {verCostos && <TableCell className="text-right tabular-nums hidden lg:table-cell">{pct(tot.ganancia, tot.total)}</TableCell>}
            </TableRow>
          </TableFooter>
        )}
      </Table>
      <p className="text-xs text-muted-foreground px-4 py-3 border-t">
        Importes por producto antes del descuento global de cada venta. La ganancia usa el costo vigente al momento de cada venta.
      </p>
    </Card>
  );
}

// ---------------------------------------------------------------------------
function TabCompras({ rango }: { rango: Rango }) {
  const { data, isLoading, error } = useComprasPorProveedor(rango);
  if (isLoading) return <Cargando />;
  if (error) return <ErrorCarga error={error} />;
  const total = (data ?? []).reduce((s, p) => s + Number(p.total), 0);
  const cantidad = (data ?? []).reduce((s, p) => s + Number(p.cantidad), 0);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 max-w-xl">
        <Dato titulo="Total comprado" valor={formatMoneda(total)} />
        <Dato titulo="Compras" valor={String(cantidad)} detalle={`${data?.length ?? 0} proveedores`} />
      </div>
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Compras por proveedor</h3>
          <Button
            variant="ghost"
            size="sm"
            disabled={!data?.length}
            onClick={() =>
              descargarCsv(`compras-por-proveedor-${sufijo(rango)}`, data ?? [], [
                { titulo: 'Proveedor', valor: (p) => p.proveedor },
                { titulo: 'Compras', valor: (p) => Number(p.cantidad) },
                { titulo: 'Total', valor: (p) => Number(p.total) },
              ])
            }
          >
            <Download className="w-4 h-4 mr-2" /> CSV
          </Button>
        </div>
        <Ranking
          filas={(data ?? []).map((p) => ({
            clave: p.proveedor_id,
            etiqueta: p.proveedor,
            valor: Number(p.total),
            detalle: `${p.cantidad} compras · ${pct(Number(p.total), total)}`,
          }))}
          formato={formatMoneda}
          vacio="Sin compras en el período"
        />
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
function TabStock({ verCostos }: { verCostos: boolean }) {
  const { data: productos, isLoading } = useProductos();
  const [dias, setDias] = useState(30);
  const reposicion = useReposicion(dias);

  const porCategoria = useMemo(() => {
    const m = new Map<string, { productos: number; costo: number; venta: number }>();
    for (const p of productos ?? []) {
      if (!p.activo || !p.controla_stock) continue;
      const k = p.categoria?.nombre ?? 'Sin categoría';
      const a = m.get(k) ?? { productos: 0, costo: 0, venta: 0 };
      const stock = Math.max(0, Number(p.stock_actual));
      a.productos += 1;
      a.costo += stock * Number(p.precio_costo);
      a.venta += stock * Number(p.precio_venta);
      m.set(k, a);
    }
    return [...m].sort((a, b) => b[1].costo - a[1].costo);
  }, [productos]);

  if (isLoading) return <Cargando />;
  const tot = porCategoria.reduce((s, [, v]) => ({ costo: s.costo + v.costo, venta: s.venta + v.venta }), { costo: 0, venta: 0 });
  const totalReposicion = (reposicion.data ?? []).reduce((s, r) => s + Number(r.costo_estimado), 0);

  return (
    <div className="space-y-4">
      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b">
          <h3 className="font-medium">Stock valorizado por categoría</h3>
          <p className="text-xs text-muted-foreground">Stock actual × precio (productos activos que controlan stock; los insumos no tienen precio de venta)</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Productos</TableHead>
              {verCostos && <TableHead className="text-right">A costo</TableHead>}
              <TableHead className="text-right">A precio de venta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {porCategoria.map(([cat, v]) => (
              <TableRow key={cat}>
                <TableCell>{cat}</TableCell>
                <TableCell className="text-right tabular-nums">{v.productos}</TableCell>
                {verCostos && <TableCell className="text-right tabular-nums">{formatMoneda(v.costo)}</TableCell>}
                <TableCell className="text-right tabular-nums">{formatMoneda(v.venta)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2} className="text-right">Total</TableCell>
              {verCostos && <TableCell className="text-right tabular-nums">{formatMoneda(tot.costo)}</TableCell>}
              <TableCell className="text-right tabular-nums">{formatMoneda(tot.venta)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-medium">Reposición sugerida</h3>
            <p className="text-xs text-muted-foreground">
              Para cubrir el mayor entre el stock mínimo y lo vendido en los últimos {dias} días.
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <Select value={String(dias)} onValueChange={(v) => setDias(Number(v))}>
              <SelectTrigger className="w-44" aria-label="Período de consumo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[7, 15, 30, 60].map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    Últimos {d} días
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              disabled={!reposicion.data?.length}
              onClick={() =>
                descargarCsv(`reposicion-sugerida-${dias}d`, reposicion.data ?? [], [
                  { titulo: 'Código', valor: (r) => r.codigo },
                  { titulo: 'Producto', valor: (r) => r.nombre },
                  { titulo: 'Categoría', valor: (r) => r.categoria },
                  { titulo: 'Unidad', valor: (r) => r.unidad },
                  { titulo: 'Stock', valor: (r) => Number(r.stock_actual) },
                  { titulo: 'Mínimo', valor: (r) => Number(r.stock_minimo) },
                  { titulo: `Vendido ${dias} días`, valor: (r) => Number(r.vendido) },
                  { titulo: 'A reponer', valor: (r) => Number(r.sugerido) },
                  ...(verCostos ? [{ titulo: 'Costo estimado', valor: (r: { costo_estimado: number }) => Number(r.costo_estimado) }] : []),
                ])
              }
            >
              <Download className="w-4 h-4 mr-2" /> CSV
            </Button>
          </div>
        </div>
        {reposicion.isLoading ? (
          <Cargando />
        ) : reposicion.error ? (
          <ErrorCarga error={reposicion.error} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="hidden md:table-cell">Tipo</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Mínimo</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Vendido</TableHead>
                <TableHead className="text-right">A reponer</TableHead>
                {verCostos && <TableHead className="text-right hidden lg:table-cell">Costo est.</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(reposicion.data ?? []).map((r) => (
                <TableRow key={r.producto_id}>
                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground mr-2">{r.codigo}</span>
                    {r.nombre}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{TIPO_PRODUCTO_LABEL[r.tipo]}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumero(r.stock_actual)}</TableCell>
                  <TableCell className="text-right tabular-nums hidden sm:table-cell">{formatNumero(r.stock_minimo)}</TableCell>
                  <TableCell className="text-right tabular-nums hidden sm:table-cell">{formatNumero(r.vendido)}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {formatNumero(r.sugerido)} <span className="text-xs text-muted-foreground font-normal">{r.unidad}</span>
                  </TableCell>
                  {verCostos && <TableCell className="text-right tabular-nums hidden lg:table-cell">{formatMoneda(r.costo_estimado)}</TableCell>}
                </TableRow>
              ))}
              {(reposicion.data ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                    No hace falta reponer nada por ahora.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            {verCostos && (reposicion.data ?? []).length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={6} className="text-right">Costo estimado total</TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoneda(totalReposicion)}</TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        )}
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
export default function ReportesPage() {
  const { rol } = useEmpresa();
  const verCostos = puede('verCostos', rol);
  const [preset, setPreset] = useState<Preset | 'custom'>('7d');
  const [rango, setRango] = useState<Rango>(rangoDePreset('7d'));
  const [tab, setTab] = useState('ventas');

  const elegirPreset = (p: Preset) => {
    setPreset(p);
    setRango(rangoDePreset(p));
  };

  const periodo =
    rango.desde === rango.hasta ? diaConSemana(rango.desde) : `${diaConSemana(rango.desde)} al ${diaConSemana(rango.hasta)}`;

  return (
    <div className="space-y-4">
      <PageHeader titulo="Reportes" descripcion={tab === 'stock' ? 'Situación actual del stock' : `Período: ${periodo}`} />

      {tab !== 'stock' && (
        <Card className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-end gap-3">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(PRESET_LABEL) as Preset[]).map((p) => (
                <Button key={p} size="sm" variant={preset === p ? 'default' : 'outline'} onClick={() => elegirPreset(p)}>
                  {PRESET_LABEL[p]}
                </Button>
              ))}
            </div>
            <div className="flex gap-2 items-end lg:ml-auto">
              <div className="space-y-1">
                <Label htmlFor="r-desde" className="text-xs">Desde</Label>
                <Input
                  id="r-desde"
                  type="date"
                  className="h-8"
                  value={rango.desde}
                  max={rango.hasta}
                  onChange={(e) => e.target.value && (setPreset('custom'), setRango((r) => ({ ...r, desde: e.target.value })))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="r-hasta" className="text-xs">Hasta</Label>
                <Input
                  id="r-hasta"
                  type="date"
                  className="h-8"
                  value={rango.hasta}
                  min={rango.desde}
                  onChange={(e) => e.target.value && (setPreset('custom'), setRango((r) => ({ ...r, hasta: e.target.value })))}
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="ventas">Ventas</TabsTrigger>
          <TabsTrigger value="productos">Productos</TabsTrigger>
          {verCostos && <TabsTrigger value="compras">Compras</TabsTrigger>}
          <TabsTrigger value="stock">Stock</TabsTrigger>
        </TabsList>
        <TabsContent value="ventas" className="mt-4">
          <TabVentas rango={rango} verCostos={verCostos} />
        </TabsContent>
        <TabsContent value="productos" className="mt-4">
          <TabProductos rango={rango} verCostos={verCostos} />
        </TabsContent>
        {verCostos && (
          <TabsContent value="compras" className="mt-4">
            <TabCompras rango={rango} />
          </TabsContent>
        )}
        <TabsContent value="stock" className="mt-4">
          <TabStock verCostos={verCostos} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
