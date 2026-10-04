import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Minus, Plus, Search, ShoppingCart, Trash2, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { useEmpresa } from '@/auth/AuthProvider';
import { puede } from '@/auth/permisos';
import { configDe } from '@/lib/rubros';
import { formatMoneda, formatNumero } from '@/lib/format';
import { parseNumero } from '@/lib/validaciones';
import { type ProductoConCategoria, useCategorias, useProductos, useUnidades } from '@/features/productos/api';
import { useMiCaja } from '@/features/caja/api';
import { Cargando, ErrorCarga } from '@/app/components/comun/Estados';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { cn } from '@/app/components/ui/utils';
import CobrarDialog, { type LineaCarrito } from './CobrarDialog';

const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const TODAS = '__todas__';

export default function PuntoDeVenta() {
  const { empresa, rol } = useEmpresa();
  const permiteNegativo = configDe(empresa).permite_stock_negativo;
  const puedeCambiarPrecio = puede('gestionarCatalogo', rol);
  const { data: caja, isLoading: cargandoCaja } = useMiCaja();
  const { data: productos, isLoading, error } = useProductos();
  const { data: categorias = [] } = useCategorias();
  const { data: unidades = [] } = useUnidades();

  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState(TODAS);
  const [carrito, setCarrito] = useState<LineaCarrito[]>([]);
  const [descuentoTxt, setDescuentoTxt] = useState('');
  const [descuentoModo, setDescuentoModo] = useState<'$' | '%'>('%');
  const [cliente, setCliente] = useState('');
  const [cobrando, setCobrando] = useState(false);
  const buscador = useRef<HTMLInputElement>(null);

  const decimales = useMemo(() => new Map(unidades.map((u) => [u.codigo, u.permite_decimales])), [unidades]);
  const vendibles = useMemo(
    () => (productos ?? []).filter((p) => p.activo && p.tipo !== 'insumo' && Number(p.precio_venta) > 0),
    [productos],
  );
  const categoriasConProductos = useMemo(() => {
    const ids = new Set(vendibles.map((p) => p.categoria_id));
    return categorias.filter((c) => ids.has(c.id));
  }, [categorias, vendibles]);

  const resultados = useMemo(() => {
    const q = normalizar(busqueda.trim());
    return vendibles.filter((p) => {
      if (categoria !== TODAS && p.categoria_id !== categoria) return false;
      if (!q) return true;
      return normalizar(`${p.codigo} ${p.nombre} ${p.codigo_barras ?? ''}`).includes(q);
    });
  }, [vendibles, busqueda, categoria]);

  const agregar = useCallback((p: ProductoConCategoria, cantidad = 1) => {
    setCarrito((c) => {
      const i = c.findIndex((l) => l.producto.id === p.id);
      if (i >= 0) {
        const copia = [...c];
        const actual = parseNumero(copia[i].cantidad) || 0;
        copia[i] = { ...copia[i], cantidad: String(actual + cantidad).replace('.', ',') };
        return copia;
      }
      return [...c, { producto: p, cantidad: String(cantidad), precio: String(Number(p.precio_venta)).replace('.', ',') }];
    });
  }, []);

  // Enter en el buscador: código exacto / código de barras (lector) o único resultado
  const onEnterBuscador = () => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return;
    const exacto = vendibles.find((p) => p.codigo.toLowerCase() === q || (p.codigo_barras ?? '').toLowerCase() === q);
    const elegido = exacto ?? (resultados.length === 1 ? resultados[0] : undefined);
    if (elegido) {
      agregar(elegido);
      setBusqueda('');
    } else if (resultados.length === 0) {
      toast.error(`No se encontró "${busqueda.trim()}"`);
    } else {
      toast.info(`${resultados.length} coincidencias: elegí una de la lista`);
    }
  };

  const lineas = carrito.map((l) => {
    const cant = parseNumero(l.cantidad);
    const precio = parseNumero(l.precio);
    let error: string | undefined;
    if (Number.isNaN(cant) || cant <= 0) error = 'Cantidad inválida';
    else if (!decimales.get(l.producto.unidad_codigo) && !Number.isInteger(cant)) error = 'No admite decimales';
    else if (Number.isNaN(precio) || precio < 0) error = 'Precio inválido';
    else if (l.producto.controla_stock && !permiteNegativo && cant > Number(l.producto.stock_actual))
      error = `Stock disponible: ${formatNumero(l.producto.stock_actual)}`;
    const subtotal = error ? 0 : Math.round(cant * Math.round(precio * 100)) / 100;
    return { ...l, cant, precioN: Math.round(precio * 100) / 100, subtotal, error };
  });

  const subtotal = Math.round(lineas.reduce((s, l) => s + l.subtotal, 0) * 100) / 100;
  const descuentoN = descuentoTxt.trim() === '' ? 0 : parseNumero(descuentoTxt);
  const descuento = Number.isNaN(descuentoN) || descuentoN < 0
    ? NaN
    : Math.round((descuentoModo === '%' ? (subtotal * Math.min(descuentoN, 100)) / 100 : descuentoN) * 100) / 100;
  const errorDescuento = Number.isNaN(descuento) ? 'Descuento inválido' : descuento > subtotal ? 'Supera el subtotal' : undefined;
  const total = errorDescuento ? subtotal : Math.round((subtotal - descuento) * 100) / 100;
  const hayErrores = lineas.some((l) => l.error) || !!errorDescuento;
  const puedeCobrar = carrito.length > 0 && !hayErrores && !!caja;

  const actualizar = (id: string, cambios: Partial<LineaCarrito>) =>
    setCarrito((c) => c.map((l) => (l.producto.id === id ? { ...l, ...cambios } : l)));

  const sumar = (l: (typeof lineas)[number], delta: number) => {
    const nueva = Math.max(0, (Number.isNaN(l.cant) ? 0 : l.cant) + delta);
    if (nueva === 0) setCarrito((c) => c.filter((x) => x.producto.id !== l.producto.id));
    else actualizar(l.producto.id, { cantidad: String(Math.round(nueva * 1000) / 1000).replace('.', ',') });
  };

  const vaciar = () => {
    setCarrito([]);
    setDescuentoTxt('');
    setCliente('');
    buscador.current?.focus();
  };

  // F2 = cobrar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        if (puedeCobrar) setCobrando(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [puedeCobrar]);

  if (isLoading || cargandoCaja) return <Cargando />;
  if (error) return <ErrorCarga error={error} />;

  if (!caja) {
    return (
      <Card className="p-8 max-w-lg mx-auto text-center space-y-4">
        <Wallet className="w-10 h-10 mx-auto text-muted-foreground" />
        <h2 className="text-xl">Necesitás una caja abierta para vender</h2>
        <p className="text-sm text-muted-foreground">Abrí tu caja con el efectivo para dar cambio y volvé a esta pantalla.</p>
        <Button asChild>
          <Link to="/caja">Ir a Caja</Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-4 items-start">
      {/* Catálogo */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={buscador}
            autoFocus
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onEnterBuscador();
              }
            }}
            placeholder="Buscar o escanear código… (Enter agrega)"
            className="pl-10 h-12 text-base"
            aria-label="Buscar producto"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={categoria === TODAS ? 'default' : 'outline'} onClick={() => setCategoria(TODAS)}>
            Todo
          </Button>
          {categoriasConProductos.map((c) => (
            <Button key={c.id} size="sm" variant={categoria === c.id ? 'default' : 'outline'} onClick={() => setCategoria(c.id)}>
              {c.nombre}
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {resultados.map((p) => {
            const sinStock = p.controla_stock && Number(p.stock_actual) <= 0 && !permiteNegativo;
            return (
              <button
                key={p.id}
                type="button"
                disabled={sinStock}
                onClick={() => {
                  agregar(p);
                  buscador.current?.focus();
                }}
                className={cn(
                  'text-left rounded-lg border bg-card p-3 transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  sinStock && 'opacity-50 cursor-not-allowed hover:border-border hover:bg-card',
                )}
              >
                <p className="text-sm font-medium leading-tight line-clamp-2 min-h-[2.5rem]">{p.nombre}</p>
                <p className="text-base mt-1 tabular-nums">{formatMoneda(p.precio_venta)}</p>
                <p className="text-xs text-muted-foreground">
                  {p.controla_stock ? `${sinStock ? 'Sin stock' : `Stock ${formatNumero(p.stock_actual)}`} ${sinStock ? '' : p.unidad_codigo}` : `por ${p.unidad_codigo}`}
                </p>
              </button>
            );
          })}
          {resultados.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground py-10">
              {vendibles.length === 0 ? 'No hay productos a la venta (con precio de venta cargado).' : 'Sin resultados.'}
            </p>
          )}
        </div>
      </div>

      {/* Carrito */}
      <Card className="p-0 xl:sticky xl:top-0 flex flex-col max-h-[calc(100vh-8rem)]">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <span className="font-medium flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" /> Venta actual
          </span>
          <span className="text-xs text-muted-foreground">Caja #{caja.numero}</span>
        </div>
        <div className="flex-1 overflow-y-auto divide-y min-h-[120px]">
          {lineas.map((l) => (
            <div key={l.producto.id} className="px-4 py-2 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm leading-tight">{l.producto.nombre}</span>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => setCarrito((c) => c.filter((x) => x.producto.id !== l.producto.id))}
                  aria-label={`Quitar ${l.producto.nombre}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => sumar(l, -1)} aria-label="Restar uno">
                  <Minus className="w-3 h-3" />
                </Button>
                <Input
                  className="h-7 w-16 text-center px-1"
                  inputMode="decimal"
                  value={l.cantidad}
                  onChange={(e) => actualizar(l.producto.id, { cantidad: e.target.value })}
                  aria-label={`Cantidad de ${l.producto.nombre}`}
                />
                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => sumar(l, 1)} aria-label="Sumar uno">
                  <Plus className="w-3 h-3" />
                </Button>
                <span className="text-xs text-muted-foreground">{l.producto.unidad_codigo} ×</span>
                {puedeCambiarPrecio ? (
                  <Input
                    className="h-7 w-24 text-right px-1"
                    inputMode="decimal"
                    value={l.precio}
                    onChange={(e) => actualizar(l.producto.id, { precio: e.target.value })}
                    aria-label={`Precio de ${l.producto.nombre}`}
                  />
                ) : (
                  <span className="text-xs tabular-nums">{formatMoneda(l.precioN)}</span>
                )}
                <span className="ml-auto text-sm tabular-nums">{l.error ? '—' : formatMoneda(l.subtotal)}</span>
              </div>
              {l.error && <p className="text-xs text-destructive">{l.error}</p>}
            </div>
          ))}
          {carrito.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-10 px-4">
              Tocá un producto o escaneá un código para agregarlo.
            </p>
          )}
        </div>
        <div className="border-t p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Input
              className="h-8"
              placeholder="Cliente (opcional)"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              aria-label="Cliente"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground w-20">Descuento</span>
            <Input
              className="h-8 text-right"
              inputMode="decimal"
              placeholder="0"
              value={descuentoTxt}
              onChange={(e) => setDescuentoTxt(e.target.value)}
              aria-label="Descuento"
              aria-invalid={!!errorDescuento}
            />
            <div className="flex rounded-md border overflow-hidden shrink-0">
              {(['%', '$'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  className={cn('px-2.5 h-8 text-sm', descuentoModo === m ? 'bg-primary text-primary-foreground' : 'bg-background')}
                  onClick={() => setDescuentoModo(m)}
                  aria-pressed={descuentoModo === m}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          {errorDescuento && <p className="text-xs text-destructive">{errorDescuento}</p>}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatMoneda(subtotal)}</span>
            </div>
            {!errorDescuento && descuento > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Descuento</span>
                <span className="tabular-nums">−{formatMoneda(descuento)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-1">
              <span className="text-base">Total</span>
              <span className="text-3xl tabular-nums font-semibold">{formatMoneda(total)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={vaciar} disabled={carrito.length === 0}>
              Vaciar
            </Button>
            <Button className="flex-1 h-11 text-base" disabled={!puedeCobrar} onClick={() => setCobrando(true)}>
              Cobrar <Badge variant="secondary" className="ml-2 text-[10px]">F2</Badge>
            </Button>
          </div>
        </div>
      </Card>

      <CobrarDialog
        abierto={cobrando}
        onCerrar={() => setCobrando(false)}
        lineas={lineas}
        subtotal={subtotal}
        descuento={errorDescuento ? 0 : descuento}
        total={total}
        cliente={cliente}
        onVentaRegistrada={vaciar}
      />
    </div>
  );
}
