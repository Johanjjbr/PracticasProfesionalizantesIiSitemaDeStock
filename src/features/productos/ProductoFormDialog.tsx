import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { useEmpresa } from '@/auth/AuthProvider';
import { ATRIBUTOS_POR_RUBRO, TIPO_PRODUCTO_LABEL, configDe } from '@/lib/rubros';
import { formatMoneda, formatNumero, mensajeError } from '@/lib/format';
import { parseNumero } from '@/lib/validaciones';
import { Campo } from '@/app/components/comun/Campo';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Switch } from '@/app/components/ui/switch';
import { Label } from '@/app/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import {
  type Producto,
  useActualizarProducto,
  useCategorias,
  useCrearProducto,
  useUnidades,
} from './api';
import {
  type ErroresForm,
  type ProductoForm,
  formDesdeProducto,
  formVacio,
  margenSobreCosto,
  validarProducto,
} from './schema';

const SIN_CATEGORIA = '__ninguna__';

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  /** null = alta */
  producto: Producto | null;
}

export default function ProductoFormDialog({ abierto, onCerrar, producto }: Props) {
  const { empresa } = useEmpresa();
  const config = configDe(empresa);
  const atributosRubro = ATRIBUTOS_POR_RUBRO[empresa.rubro];
  const { data: categorias = [] } = useCategorias();
  const { data: unidades = [] } = useUnidades();
  const crear = useCrearProducto();
  const actualizar = useActualizarProducto();

  const [form, setForm] = useState<ProductoForm>(formVacio);
  const [errores, setErrores] = useState<ErroresForm>({});
  const [margen, setMargen] = useState('');

  useEffect(() => {
    if (!abierto) return;
    const f = producto ? formDesdeProducto(producto) : formVacio();
    setForm(f);
    setErrores({});
    const m = margenSobreCosto(parseNumero(f.precio_costo), parseNumero(f.precio_venta));
    setMargen(m === null ? '' : m.toFixed(0));
  }, [abierto, producto]);

  const set = <K extends keyof ProductoForm>(campo: K, valor: ProductoForm[K]) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErrores((e) => ({ ...e, [campo]: undefined }));
  };

  // Mantener margen y precio de venta sincronizados
  const onCambioCosto = (v: string) => {
    set('precio_costo', v);
    const costo = parseNumero(v);
    const m = parseNumero(margen);
    if (costo > 0 && !Number.isNaN(m) && margen !== '') {
      set('precio_venta', (Math.round(costo * (1 + m / 100) * 100) / 100).toString().replace('.', ','));
    }
  };
  const onCambioVenta = (v: string) => {
    set('precio_venta', v);
    const m = margenSobreCosto(parseNumero(form.precio_costo), parseNumero(v));
    setMargen(m === null ? '' : m.toFixed(0));
  };
  const onCambioMargen = (v: string) => {
    setMargen(v);
    const costo = parseNumero(form.precio_costo);
    const m = parseNumero(v);
    if (costo > 0 && !Number.isNaN(m)) {
      set('precio_venta', (Math.round(costo * (1 + m / 100) * 100) / 100).toString().replace('.', ','));
    }
  };

  const unidad = useMemo(() => unidades.find((u) => u.codigo === form.unidad_codigo), [unidades, form.unidad_codigo]);
  const categoriasVisibles = categorias.filter((c) => c.activa || c.id === form.categoria_id);
  const guardando = crear.isPending || actualizar.isPending;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const r = validarProducto(form, unidad);
    if (!r.ok) {
      setErrores(r.errores);
      return;
    }
    try {
      if (producto) {
        await actualizar.mutateAsync({ id: producto.id, cambios: r.valor.datos });
        toast.success('Producto actualizado');
      } else {
        const res = await crear.mutateAsync(r.valor);
        if (res.errorStock) {
          toast.warning(`Producto creado, pero no se pudo cargar el stock inicial: ${mensajeError(res.errorStock)}`);
        } else {
          toast.success('Producto creado');
        }
      }
      onCerrar();
    } catch (err) {
      toast.error(mensajeError(err));
    }
  };

  return (
    <Dialog open={abierto} onOpenChange={(o) => !o && !guardando && onCerrar()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{producto ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
          <DialogDescription>
            {producto
              ? `Stock actual: ${formatNumero(producto.stock_actual)} ${producto.unidad_codigo}. El stock se modifica con compras, ventas o ajustes.`
              : 'Los campos con * son obligatorios.'}
          </DialogDescription>
        </DialogHeader>

        <form id="form-producto" onSubmit={onSubmit} className="space-y-5" noValidate>
          {/* Identificación */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Campo id="codigo" label="Código" requerido error={errores.codigo}>
              <Input
                id="codigo"
                value={form.codigo}
                onChange={(e) => set('codigo', e.target.value)}
                placeholder="TOR-004"
                className="uppercase"
              />
            </Campo>
            <Campo id="nombre" label="Nombre" requerido error={errores.nombre} className="sm:col-span-2">
              <Input id="nombre" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} />
            </Campo>
            {config.usa_codigo_barras || form.codigo_barras ? (
              <Campo id="codigo_barras" label="Código de barras" error={errores.codigo_barras}>
                <Input
                  id="codigo_barras"
                  value={form.codigo_barras}
                  onChange={(e) => set('codigo_barras', e.target.value)}
                  inputMode="numeric"
                />
              </Campo>
            ) : null}
            <Campo
              id="descripcion"
              label="Descripción"
              className={config.usa_codigo_barras || form.codigo_barras ? 'sm:col-span-2' : 'sm:col-span-3'}
            >
              <Input id="descripcion" value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} />
            </Campo>
          </div>

          {/* Clasificación */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Campo id="categoria" label="Categoría">
              <Select
                value={form.categoria_id || SIN_CATEGORIA}
                onValueChange={(v) => set('categoria_id', v === SIN_CATEGORIA ? '' : v)}
              >
                <SelectTrigger id="categoria">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SIN_CATEGORIA}>Sin categoría</SelectItem>
                  {categoriasVisibles.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
                      {!c.activa && ' (inactiva)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Campo>
            <Campo id="tipo" label="Tipo" ayuda="Insumo: se compra para elaborar. Reventa: se compra y se vende. Elaborado: se produce.">
              <Select value={form.tipo} onValueChange={(v) => set('tipo', v as ProductoForm['tipo'])}>
                <SelectTrigger id="tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_PRODUCTO_LABEL).map(([k, l]) => (
                    <SelectItem key={k} value={k}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Campo>
            <Campo id="unidad" label="Unidad de medida" requerido error={errores.unidad_codigo}>
              <Select value={form.unidad_codigo} onValueChange={(v) => set('unidad_codigo', v)}>
                <SelectTrigger id="unidad">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {unidades.map((u) => (
                    <SelectItem key={u.codigo} value={u.codigo}>
                      {u.nombre} ({u.codigo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Campo>
          </div>

          {/* Precios */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Campo id="precio_costo" label="Precio de costo" error={errores.precio_costo}>
              <Input
                id="precio_costo"
                inputMode="decimal"
                value={form.precio_costo}
                onChange={(e) => onCambioCosto(e.target.value)}
                placeholder="0,00"
              />
            </Campo>
            <Campo id="margen" label="Margen sobre costo (%)" ayuda="Al cambiarlo se recalcula el precio de venta">
              <Input id="margen" inputMode="decimal" value={margen} onChange={(e) => onCambioMargen(e.target.value)} />
            </Campo>
            <Campo
              id="precio_venta"
              label="Precio de venta"
              error={errores.precio_venta}
              ayuda={form.tipo === 'insumo' ? 'Los insumos pueden quedar en 0' : undefined}
            >
              <Input
                id="precio_venta"
                inputMode="decimal"
                value={form.precio_venta}
                onChange={(e) => onCambioVenta(e.target.value)}
                placeholder="0,00"
              />
            </Campo>
          </div>

          {/* Stock */}
          <div className="rounded-md border p-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="controla_stock">Controla stock</Label>
                <p className="text-xs text-muted-foreground">
                  Desactivalo para productos que se preparan al momento (ej. café) o servicios.
                </p>
              </div>
              <Switch
                id="controla_stock"
                checked={form.controla_stock}
                onCheckedChange={(v) => set('controla_stock', v)}
                disabled={!!producto && producto.stock_actual !== 0 && producto.controla_stock}
              />
            </div>
            {form.controla_stock && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Campo
                  id="stock_minimo"
                  label={`Stock mínimo (${form.unidad_codigo})`}
                  error={errores.stock_minimo}
                  ayuda="Debajo de este valor aparece en alertas"
                >
                  <Input
                    id="stock_minimo"
                    inputMode="decimal"
                    value={form.stock_minimo}
                    onChange={(e) => set('stock_minimo', e.target.value)}
                  />
                </Campo>
                {!producto && (
                  <Campo
                    id="stock_inicial"
                    label={`Stock inicial (${form.unidad_codigo})`}
                    error={errores.stock_inicial}
                    ayuda="Opcional. Queda registrado como movimiento de stock inicial"
                  >
                    <Input
                      id="stock_inicial"
                      inputMode="decimal"
                      value={form.stock_inicial}
                      onChange={(e) => set('stock_inicial', e.target.value)}
                      placeholder="0"
                    />
                  </Campo>
                )}
              </div>
            )}
          </div>

          {/* Atributos del rubro */}
          {atributosRubro.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {atributosRubro.map((a) => (
                <Campo key={a.clave} id={`attr-${a.clave}`} label={a.label} className={a.multilinea ? 'sm:col-span-2' : ''}>
                  {a.multilinea ? (
                    <Textarea
                      id={`attr-${a.clave}`}
                      value={form.atributos[a.clave] ?? ''}
                      placeholder={a.placeholder}
                      onChange={(e) => set('atributos', { ...form.atributos, [a.clave]: e.target.value })}
                    />
                  ) : (
                    <Input
                      id={`attr-${a.clave}`}
                      value={form.atributos[a.clave] ?? ''}
                      placeholder={a.placeholder}
                      onChange={(e) => set('atributos', { ...form.atributos, [a.clave]: e.target.value })}
                    />
                  )}
                </Campo>
              ))}
            </div>
          )}

          {producto && (
            <div className="flex items-center justify-between rounded-md border p-4">
              <div>
                <Label htmlFor="activo">Producto activo</Label>
                <p className="text-xs text-muted-foreground">Los inactivos no aparecen para vender ni comprar.</p>
              </div>
              <Switch id="activo" checked={form.activo} onCheckedChange={(v) => set('activo', v)} />
            </div>
          )}
        </form>

        <DialogFooter className="items-center gap-2">
          {parseNumero(form.precio_venta) > 0 && (
            <p className="text-xs text-muted-foreground mr-auto">
              Precio de venta: {formatMoneda(parseNumero(form.precio_venta))}
            </p>
          )}
          <Button type="button" variant="outline" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" form="form-producto" disabled={guardando}>
            {guardando ? 'Guardando…' : producto ? 'Guardar cambios' : 'Crear producto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
