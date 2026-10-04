import { useMemo } from 'react';
import { Link } from 'react-router';
import { AlertTriangle, ArrowRight, Receipt, ShoppingCart, TrendingUp, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth, useEmpresa } from '@/auth/AuthProvider';
import { puede, puedeVer } from '@/auth/permisos';
import { formatMoneda, formatNumero, hoyISO } from '@/lib/format';
import { sumarDias } from '@/lib/fechas';
import { useProductos } from '@/features/productos/api';
import { MEDIO_PAGO_LABEL, resumirCaja, useMiCaja } from '@/features/caja/api';
import { usePorDia, usePorMedio, usePorProducto, useResumenVentas } from '@/features/reportes/api';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Skeleton } from '@/app/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { ColumnasPorDia } from '@/app/components/graficos/ColumnasPorDia';
import { Ranking } from '@/app/components/graficos/Ranking';

function Kpi({ titulo, valor, detalle, icono: Icono, cargando }: { titulo: string; valor: string; detalle?: string; icono: LucideIcon; cargando?: boolean }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{titulo}</p>
          {cargando ? <Skeleton className="h-8 w-32 mt-2" /> : <p className="text-2xl mt-1 tabular-nums truncate">{valor}</p>}
          {detalle && <p className="text-xs text-muted-foreground mt-1">{detalle}</p>}
        </div>
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
          <Icono className="w-5 h-5 text-primary" />
        </div>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const { empresa, rol } = useEmpresa();
  const { perfil } = useAuth();
  const verCostos = puede('verCostos', rol);
  const soloPropias = rol === 'vendedor';
  const hoy = hoyISO();
  const rangoHoy = { desde: hoy, hasta: hoy };

  const resumen = useResumenVentas(rangoHoy);
  const porDia = usePorDia({ desde: sumarDias(hoy, -13), hasta: hoy });
  const porMedio = usePorMedio(rangoHoy);
  const top = usePorProducto({ desde: sumarDias(hoy, -29), hasta: hoy });
  const { data: caja } = useMiCaja();
  const { data: productos } = useProductos();

  const bajoMinimo = useMemo(
    () =>
      (productos ?? [])
        .filter((p) => p.activo && p.controla_stock && Number(p.stock_actual) < Number(p.stock_minimo))
        .sort((a, b) => Number(a.stock_actual) / (Number(a.stock_minimo) || 1) - Number(b.stock_actual) / (Number(b.stock_minimo) || 1)),
    [productos],
  );

  const r = resumen.data;
  const margen = r && Number(r.total) > 0 ? (Number(r.ganancia) / Number(r.total)) * 100 : null;
  const efectivoCaja = caja ? resumirCaja(Number(caja.monto_inicial), caja.movimientos).efectivoEsperado : 0;
  const saludo = new Date().getHours() < 12 ? 'Buen día' : new Date().getHours() < 20 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl">
            {saludo}
            {perfil?.nombre ? `, ${perfil.nombre.split(' ')[0]}` : ''}
          </h1>
          <p className="text-sm text-muted-foreground">
            {empresa.nombre} · {soloPropias ? 'tus ventas de hoy' : 'resumen de hoy'}
          </p>
        </div>
        {puedeVer('/ventas', rol) && (
          <Button asChild>
            <Link to="/ventas">
              <ShoppingCart className="w-4 h-4 mr-2" /> Nueva venta
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi
          titulo="Ventas de hoy"
          valor={formatMoneda(r?.total)}
          detalle={r ? `${r.cantidad} ${Number(r.cantidad) === 1 ? 'venta' : 'ventas'}${Number(r.anuladas) > 0 ? ` · ${r.anuladas} anuladas` : ''}` : undefined}
          icono={TrendingUp}
          cargando={resumen.isLoading}
        />
        <Kpi titulo="Ticket promedio" valor={formatMoneda(r?.ticket_promedio)} icono={Receipt} cargando={resumen.isLoading} />
        {verCostos ? (
          <Kpi
            titulo="Ganancia bruta de hoy"
            valor={formatMoneda(r?.ganancia)}
            detalle={margen !== null ? `${margen.toFixed(0)}% sobre lo vendido` : 'Venta − costo de lo vendido'}
            icono={TrendingUp}
            cargando={resumen.isLoading}
          />
        ) : (
          <Kpi titulo="Descuentos otorgados" valor={formatMoneda(r?.descuentos)} icono={Receipt} cargando={resumen.isLoading} />
        )}
        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Mi caja</p>
              {caja ? (
                <>
                  <p className="text-2xl mt-1 tabular-nums">{formatMoneda(efectivoCaja)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Efectivo en caja #{caja.numero}</p>
                </>
              ) : (
                <>
                  <p className="text-lg mt-1">Cerrada</p>
                  {puedeVer('/caja', rol) && (
                    <Link to="/caja" className="text-xs text-primary hover:underline">
                      Abrir caja
                    </Link>
                  )}
                </>
              )}
            </div>
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="p-5 xl:col-span-2">
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="font-medium">Ventas de los últimos 14 días</h3>
            {puedeVer('/reportes', rol) && (
              <Link to="/reportes" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                Reportes <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
          {porDia.isLoading ? (
            <Skeleton className="h-60 w-full" />
          ) : (
            <ColumnasPorDia datos={(porDia.data ?? []).map((d) => ({ dia: d.dia, total: Number(d.total), cantidad: Number(d.cantidad) }))} />
          )}
        </Card>
        <Card className="p-5">
          <h3 className="font-medium mb-4">Cobrado hoy por medio de pago</h3>
          <Ranking
            filas={(porMedio.data ?? []).map((m) => ({
              clave: m.medio_pago,
              etiqueta: MEDIO_PAGO_LABEL[m.medio_pago],
              valor: Number(m.total),
              detalle: `${m.cantidad} ${Number(m.cantidad) === 1 ? 'venta' : 'ventas'}`,
            }))}
            formato={formatMoneda}
            vacio="Todavía no hay cobros hoy"
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="p-5">
          <h3 className="font-medium mb-4">Más vendidos (30 días)</h3>
          <Ranking
            filas={(top.data ?? []).slice(0, 6).map((p) => ({
              clave: p.producto_id,
              etiqueta: p.nombre,
              valor: Number(p.total),
              detalle: `${formatNumero(p.cantidad)} ${p.unidad}`,
            }))}
            formato={formatMoneda}
            vacio="Sin ventas en los últimos 30 días"
          />
        </Card>
        <Card className="p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" /> Bajo stock mínimo ({bajoMinimo.length})
            </h3>
            <Link to="/productos" className="text-sm text-primary hover:underline">
              Ver productos
            </Link>
          </div>
          {bajoMinimo.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Todo el stock está por encima del mínimo.</p>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Mínimo</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bajoMinimo.slice(0, 15).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <span className="font-mono text-xs text-muted-foreground mr-2">{p.codigo}</span>
                        {p.nombre}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumero(p.stock_actual)} <span className="text-xs text-muted-foreground">{p.unidad_codigo}</span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumero(p.stock_minimo)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={Number(p.stock_actual) <= 0 ? 'destructive' : 'outline'}>
                          {Number(p.stock_actual) <= 0 ? 'Sin stock' : 'Bajo'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
