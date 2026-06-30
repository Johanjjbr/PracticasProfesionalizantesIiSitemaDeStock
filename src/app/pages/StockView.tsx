import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Warehouse, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../components/ui/utils';

type SortField = 'name' | 'sku' | 'category' | 'total' | 'status';
type SortDir = 'asc' | 'desc';

// One logical product = same SKU across all warehouses
interface ProductRow {
  sku: string;
  name: string;
  category: string;
  unitOfMeasure?: string;
  minStock: number;                        // max minStock across locations
  stockByWarehouse: Record<string, number>; // warehouseName → qty
  total: number;
}

export default function StockView() {
  const { products, user } = useApp();

  // Derive sorted warehouse list — user's warehouse first
  const warehouses = useMemo(() => {
    const all = Array.from(new Set(products.map(p => p.warehouse))).sort();
    if (user?.warehouse && all.includes(user.warehouse)) {
      return [user.warehouse, ...all.filter(w => w !== user.warehouse)];
    }
    return all;
  }, [products, user?.warehouse]);

  const categories = useMemo(
    () => Array.from(new Set(products.map(p => p.category))).sort(),
    [products]
  );

  // Build pivot rows: group by SKU
  const allRows = useMemo<ProductRow[]>(() => {
    const map = new Map<string, ProductRow>();

    products.filter(p => p.isActive !== false).forEach(p => {
      const existing = map.get(p.sku);
      if (existing) {
        existing.stockByWarehouse[p.warehouse] = (existing.stockByWarehouse[p.warehouse] ?? 0) + p.currentStock;
        existing.total += p.currentStock;
        existing.minStock = Math.max(existing.minStock, p.minStock);
      } else {
        map.set(p.sku, {
          sku: p.sku,
          name: p.name,
          category: p.category,
          unitOfMeasure: p.unitOfMeasure,
          minStock: p.minStock,
          stockByWarehouse: { [p.warehouse]: p.currentStock },
          total: p.currentStock,
        });
      }
    });

    return Array.from(map.values());
  }, [products]);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ok' | 'low' | 'critical'>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const getStatus = (row: ProductRow) => {
    if (row.total === 0) return 'critical';
    if (row.total < row.minStock) return 'low';
    return 'ok';
  };

  const filtered = useMemo(() => {
    let list = allRows;

    if (categoryFilter !== 'all') list = list.filter(r => r.category === categoryFilter);
    if (statusFilter !== 'all') list = list.filter(r => getStatus(r) === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.sku.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      if (sortField === 'name')     { av = a.name;     bv = b.name; }
      if (sortField === 'sku')      { av = a.sku;      bv = b.sku; }
      if (sortField === 'category') { av = a.category; bv = b.category; }
      if (sortField === 'total')    { av = a.total;    bv = b.total; }
      if (sortField === 'status')   { av = getStatus(a); bv = getStatus(b); }

      if (typeof av === 'string') {
        const cmp = av.localeCompare(bv as string, 'es');
        return sortDir === 'asc' ? cmp : -cmp;
      }
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [allRows, categoryFilter, statusFilter, search, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  // KPIs based on filtered rows
  const totalUnits  = filtered.reduce((s, r) => s + r.total, 0);
  const lowCount      = filtered.filter(r => getStatus(r) === 'low').length;
  const criticalCount = filtered.filter(r => getStatus(r) === 'critical').length;

  // Sortable header helper
  const Th = ({ field, label, className }: { field: SortField; label: string; className?: string }) => {
    const active = sortField === field;
    return (
      <th
        className={cn(
          'px-4 py-2.5 text-left text-xs font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors whitespace-nowrap',
          className
        )}
        onClick={() => toggleSort(field)}
      >
        <div className="flex items-center gap-1">
          {label}
          {active
            ? sortDir === 'asc'
              ? <ArrowUp className="w-3 h-3 text-primary" />
              : <ArrowDown className="w-3 h-3 text-primary" />
            : <ArrowUpDown className="w-3 h-3 text-muted-foreground/40" />
          }
        </div>
      </th>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl">Vista de Stock</h1>
        <p className="text-sm text-muted-foreground">
          Existencias consolidadas por producto y almacén
          {user?.warehouse && <span className="text-primary"> · Tu almacén: {user.warehouse}</span>}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Productos</p>
            <p className="text-2xl mt-0.5">{filtered.length}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Warehouse className="w-5 h-5 text-primary" />
          </div>
        </Card>
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Unidades totales</p>
            <p className="text-2xl mt-0.5">{totalUnits.toLocaleString('es-ES')}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-success" />
          </div>
        </Card>
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Bajo mínimo</p>
            <p className="text-2xl mt-0.5">{lowCount}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-warning" />
          </div>
        </Card>
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Sin stock</p>
            <p className="text-2xl mt-0.5">{criticalCount}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-destructive" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar por nombre, SKU o categoría..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-44 h-9">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={v => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-40 h-9">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="ok">Normal</SelectItem>
              <SelectItem value="low">Bajo mínimo</SelectItem>
              <SelectItem value="critical">Sin stock</SelectItem>
            </SelectContent>
          </Select>

          {(categoryFilter !== 'all' || statusFilter !== 'all' || search) && (
            <button
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 shrink-0"
              onClick={() => { setCategoryFilter('all'); setStatusFilter('all'); setSearch(''); }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </Card>

      {/* Pivot table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted/60 border-b border-border">
                {/* Fixed product columns */}
                <Th field="sku"      label="SKU"       className="w-28 border-r border-border" />
                <Th field="name"     label="Producto"  className="min-w-52 border-r border-border" />
                <Th field="category" label="Categoría" className="w-36 border-r border-border" />

                {/* One column per warehouse */}
                {warehouses.map(wh => (
                  <th
                    key={wh}
                    className={cn(
                      'px-4 py-2.5 text-right text-xs font-medium text-muted-foreground whitespace-nowrap border-r border-border last:border-r-0',
                      wh === user?.warehouse && 'text-primary'
                    )}
                  >
                    <div className="flex flex-col items-end gap-0.5">
                      <span>{wh}</span>
                      {wh === user?.warehouse && (
                        <span className="text-[9px] bg-primary/10 text-primary px-1 py-0 rounded font-medium">mi almacén</span>
                      )}
                    </div>
                  </th>
                ))}

                {/* Total + status */}
                <Th field="total"  label="Total"  className="w-24 text-right border-l border-border" />
                <Th field="status" label="Estado" className="w-28" />
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {filtered.map((row, idx) => {
                const status = getStatus(row);
                return (
                  <tr
                    key={row.sku}
                    className={cn(
                      'hover:bg-accent/40 transition-colors',
                      idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                    )}
                  >
                    <td className="px-4 py-2.5 border-r border-border">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.sku}</code>
                    </td>
                    <td className="px-4 py-2.5 border-r border-border font-medium">{row.name}</td>
                    <td className="px-4 py-2.5 border-r border-border text-muted-foreground text-xs">{row.category}</td>

                    {/* Stock per warehouse */}
                    {warehouses.map(wh => {
                      const qty = row.stockByWarehouse[wh] ?? 0;
                      const isMine = wh === user?.warehouse;
                      return (
                        <td
                          key={wh}
                          className={cn(
                            'px-4 py-2.5 text-right tabular-nums border-r border-border last:border-r-0',
                            isMine && 'bg-primary/5'
                          )}
                        >
                          {qty > 0 ? (
                            <span className={cn('font-medium', isMine && 'text-primary')}>{qty.toLocaleString('es-ES')}</span>
                          ) : (
                            <span className="text-muted-foreground/40 text-xs">—</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Total */}
                    <td className="px-4 py-2.5 text-right tabular-nums border-l border-border">
                      <span className={cn(
                        'font-semibold',
                        status === 'critical' && 'text-destructive',
                        status === 'low' && 'text-warning',
                      )}>
                        {row.total.toLocaleString('es-ES')}
                      </span>
                      <span className="text-[11px] text-muted-foreground ml-1">{row.unitOfMeasure || 'uds.'}</span>
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-2.5">
                      {status === 'ok' && (
                        <Badge variant="outline" className="border-success/40 text-success bg-success/5 text-[11px]">
                          <CheckCircle className="w-3 h-3 mr-1" />Normal
                        </Badge>
                      )}
                      {status === 'low' && (
                        <Badge variant="outline" className="border-warning/40 text-warning bg-warning/5 text-[11px]">
                          <AlertTriangle className="w-3 h-3 mr-1" />Bajo mínimo
                        </Badge>
                      )}
                      {status === 'critical' && (
                        <Badge variant="outline" className="border-destructive/40 text-destructive bg-destructive/5 text-[11px]">
                          <XCircle className="w-3 h-3 mr-1" />Sin stock
                        </Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Footer totals per warehouse */}
            {filtered.length > 0 && (
              <tfoot>
                <tr className="bg-muted/60 border-t-2 border-border font-medium text-xs">
                  <td colSpan={3} className="px-4 py-2.5 text-muted-foreground border-r border-border">
                    Totales ({filtered.length} productos)
                  </td>
                  {warehouses.map(wh => {
                    const whTotal = filtered.reduce((s, r) => s + (r.stockByWarehouse[wh] ?? 0), 0);
                    return (
                      <td
                        key={wh}
                        className={cn(
                          'px-4 py-2.5 text-right tabular-nums border-r border-border last:border-r-0',
                          wh === user?.warehouse && 'text-primary bg-primary/5'
                        )}
                      >
                        {whTotal.toLocaleString('es-ES')}
                      </td>
                    );
                  })}
                  <td className="px-4 py-2.5 text-right tabular-nums border-l border-border">
                    {totalUnits.toLocaleString('es-ES')}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>

          {filtered.length === 0 && (
            <div className="py-16 text-center text-muted-foreground">
              <Warehouse className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No se encontraron productos con los filtros aplicados</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
