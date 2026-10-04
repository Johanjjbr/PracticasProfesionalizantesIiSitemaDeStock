import { useMemo, useState } from 'react';
import { ArrowLeftRight, Download, MoreHorizontal, Pencil, Plus, Power, Search, Tags } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useEmpresa } from '@/auth/AuthProvider';
import { puede } from '@/auth/permisos';
import { TIPO_PRODUCTO_LABEL } from '@/lib/rubros';
import { formatMoneda, formatNumero, mensajeError } from '@/lib/format';
import { descargarCsv, fechaArchivo } from '@/lib/csv';
import { PageHeader } from '@/app/components/comun/PageHeader';
import { Cargando, ErrorCarga } from '@/app/components/comun/Estados';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { type Producto, type ProductoConCategoria, useActualizarProducto, useCategorias, useProductos } from './api';
import { margenSobreCosto } from './schema';
import ProductoFormDialog from './ProductoFormDialog';
import CategoriasDialog from './CategoriasDialog';

const TODAS = '__todas__';
const POR_PAGINA = 25;

type Estado = 'activos' | 'inactivos' | 'todos';

function normalizar(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function EstadoStock({ p }: { p: ProductoConCategoria }) {
  if (!p.controla_stock) return <span className="text-muted-foreground text-xs">No controla</span>;
  const stock = Number(p.stock_actual);
  const bajo = stock < Number(p.stock_minimo);
  return (
    <span className="inline-flex items-center gap-2 justify-end">
      <span className="tabular-nums">
        {formatNumero(stock)} <span className="text-muted-foreground text-xs">{p.unidad_codigo}</span>
      </span>
      {stock <= 0 ? (
        <Badge variant="destructive" className="text-[10px]">
          Sin stock
        </Badge>
      ) : bajo ? (
        <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-700 dark:text-amber-400">
          Bajo
        </Badge>
      ) : null}
    </span>
  );
}

export default function ProductosPage() {
  const { rol } = useEmpresa();
  const gestiona = puede('gestionarCatalogo', rol);
  const verCostos = puede('verCostos', rol);
  const { data: productos, isLoading, error } = useProductos();
  const { data: categorias = [] } = useCategorias();
  const actualizar = useActualizarProducto();
  const navigate = useNavigate();

  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState(TODAS);
  const [tipo, setTipo] = useState(TODAS);
  const [estado, setEstado] = useState<Estado>('activos');
  const [soloBajoMinimo, setSoloBajoMinimo] = useState(false);
  const [pagina, setPagina] = useState(0);
  const [dialogo, setDialogo] = useState<{ abierto: boolean; producto: Producto | null }>({ abierto: false, producto: null });
  const [categoriasAbierto, setCategoriasAbierto] = useState(false);

  const filtrados = useMemo(() => {
    const q = normalizar(busqueda.trim());
    return (productos ?? []).filter((p) => {
      if (estado === 'activos' && !p.activo) return false;
      if (estado === 'inactivos' && p.activo) return false;
      if (categoria !== TODAS && p.categoria_id !== categoria) return false;
      if (tipo !== TODAS && p.tipo !== tipo) return false;
      if (soloBajoMinimo && !(p.controla_stock && Number(p.stock_actual) < Number(p.stock_minimo))) return false;
      if (q) {
        const texto = normalizar(`${p.codigo} ${p.nombre} ${p.codigo_barras ?? ''} ${p.descripcion ?? ''}`);
        if (!texto.includes(q)) return false;
      }
      return true;
    });
  }, [productos, busqueda, categoria, tipo, estado, soloBajoMinimo]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas - 1);
  const visibles = filtrados.slice(paginaActual * POR_PAGINA, (paginaActual + 1) * POR_PAGINA);

  const cambiarFiltro = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPagina(0);
  };

  const alternarActivo = async (p: Producto) => {
    try {
      await actualizar.mutateAsync({ id: p.id, cambios: { activo: !p.activo } });
      toast.success(p.activo ? `"${p.nombre}" desactivado` : `"${p.nombre}" activado`);
    } catch (err) {
      toast.error(mensajeError(err));
    }
  };

  const exportar = () => {
    descargarCsv(`productos-${fechaArchivo()}`, filtrados, [
      { titulo: 'Código', valor: (p) => p.codigo },
      { titulo: 'Código de barras', valor: (p) => p.codigo_barras },
      { titulo: 'Nombre', valor: (p) => p.nombre },
      { titulo: 'Categoría', valor: (p) => p.categoria?.nombre },
      { titulo: 'Tipo', valor: (p) => TIPO_PRODUCTO_LABEL[p.tipo] },
      { titulo: 'Unidad', valor: (p) => p.unidad_codigo },
      ...(verCostos ? [{ titulo: 'Precio costo', valor: (p: ProductoConCategoria) => Number(p.precio_costo) }] : []),
      { titulo: 'Precio venta', valor: (p) => Number(p.precio_venta) },
      { titulo: 'Stock', valor: (p) => (p.controla_stock ? Number(p.stock_actual) : '') },
      { titulo: 'Stock mínimo', valor: (p) => (p.controla_stock ? Number(p.stock_minimo) : '') },
      { titulo: 'Activo', valor: (p) => (p.activo ? 'Sí' : 'No') },
    ]);
  };

  if (isLoading) return <Cargando />;
  if (error) return <ErrorCarga error={error} />;

  return (
    <div className="space-y-4">
      <PageHeader
        titulo="Productos"
        descripcion={`${filtrados.length} de ${productos?.length ?? 0} productos`}
        acciones={
          <>
            <Button variant="outline" onClick={exportar} disabled={filtrados.length === 0}>
              <Download className="w-4 h-4 mr-2" /> Exportar CSV
            </Button>
            {gestiona && (
              <>
                <Button variant="outline" onClick={() => setCategoriasAbierto(true)}>
                  <Tags className="w-4 h-4 mr-2" /> Categorías
                </Button>
                <Button onClick={() => setDialogo({ abierto: true, producto: null })}>
                  <Plus className="w-4 h-4 mr-2" /> Nuevo producto
                </Button>
              </>
            )}
          </>
        }
      />

      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, código o código de barras"
              value={busqueda}
              onChange={(e) => cambiarFiltro(setBusqueda)(e.target.value)}
              className="pl-9"
              aria-label="Buscar productos"
            />
          </div>
          <Select value={categoria} onValueChange={cambiarFiltro(setCategoria)}>
            <SelectTrigger className="lg:w-48" aria-label="Filtrar por categoría">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODAS}>Todas las categorías</SelectItem>
              {categorias.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={tipo} onValueChange={cambiarFiltro(setTipo)}>
            <SelectTrigger className="lg:w-40" aria-label="Filtrar por tipo">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODAS}>Todos los tipos</SelectItem>
              {Object.entries(TIPO_PRODUCTO_LABEL).map(([k, l]) => (
                <SelectItem key={k} value={k}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={estado} onValueChange={(v) => cambiarFiltro(setEstado)(v as Estado)}>
            <SelectTrigger className="lg:w-36" aria-label="Filtrar por estado">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="activos">Activos</SelectItem>
              <SelectItem value="inactivos">Inactivos</SelectItem>
              <SelectItem value="todos">Todos</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Checkbox
              id="bajo-minimo"
              checked={soloBajoMinimo}
              onCheckedChange={(v) => cambiarFiltro(setSoloBajoMinimo)(v === true)}
            />
            <Label htmlFor="bajo-minimo" className="text-sm font-normal">
              Bajo mínimo
            </Label>
          </div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead className="hidden md:table-cell">Categoría</TableHead>
              <TableHead className="hidden lg:table-cell">Tipo</TableHead>
              {verCostos && <TableHead className="text-right hidden md:table-cell">Costo</TableHead>}
              <TableHead className="text-right">Venta</TableHead>
              {verCostos && <TableHead className="text-right hidden xl:table-cell">Margen</TableHead>}
              <TableHead className="text-right">Stock</TableHead>
              {gestiona && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibles.map((p) => {
              const margen = margenSobreCosto(Number(p.precio_costo), Number(p.precio_venta));
              return (
                <TableRow key={p.id} className={p.activo ? '' : 'opacity-60'}>
                  <TableCell className="font-mono text-xs">{p.codigo}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{p.nombre}</span>
                      {!p.activo && (
                        <Badge variant="secondary" className="text-[10px]">
                          Inactivo
                        </Badge>
                      )}
                    </div>
                    {p.descripcion && <p className="text-xs text-muted-foreground line-clamp-1">{p.descripcion}</p>}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{p.categoria?.nombre ?? '—'}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Badge variant="outline" className="text-[10px]">
                      {TIPO_PRODUCTO_LABEL[p.tipo]}
                    </Badge>
                  </TableCell>
                  {verCostos && (
                    <TableCell className="text-right tabular-nums hidden md:table-cell">{formatMoneda(p.precio_costo)}</TableCell>
                  )}
                  <TableCell className="text-right tabular-nums">
                    {Number(p.precio_venta) > 0 ? formatMoneda(p.precio_venta) : '—'}
                  </TableCell>
                  {verCostos && (
                    <TableCell className="text-right tabular-nums hidden xl:table-cell text-muted-foreground">
                      {margen === null ? '—' : `${margen.toFixed(0)}%`}
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <EstadoStock p={p} />
                  </TableCell>
                  {gestiona && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Acciones para ${p.nombre}`}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setDialogo({ abierto: true, producto: p })}>
                            <Pencil className="w-4 h-4 mr-2" /> Editar
                          </DropdownMenuItem>
                          {p.controla_stock && (
                            <DropdownMenuItem onClick={() => navigate(`/stock/movimientos?producto=${p.id}`)}>
                              <ArrowLeftRight className="w-4 h-4 mr-2" /> Ver movimientos
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => void alternarActivo(p)}>
                            <Power className="w-4 h-4 mr-2" /> {p.activo ? 'Desactivar' : 'Activar'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
            {visibles.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                  {productos?.length ? 'Ningún producto coincide con los filtros.' : 'Todavía no hay productos cargados.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
            <span className="text-muted-foreground">
              Página {paginaActual + 1} de {totalPaginas}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={paginaActual === 0} onClick={() => setPagina(paginaActual - 1)}>
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={paginaActual >= totalPaginas - 1}
                onClick={() => setPagina(paginaActual + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>

      {gestiona && (
        <>
          <ProductoFormDialog
            abierto={dialogo.abierto}
            producto={dialogo.producto}
            onCerrar={() => setDialogo({ abierto: false, producto: null })}
          />
          <CategoriasDialog abierto={categoriasAbierto} onCerrar={() => setCategoriasAbierto(false)} />
        </>
      )}
    </div>
  );
}
