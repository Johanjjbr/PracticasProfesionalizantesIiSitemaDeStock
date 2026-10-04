import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { AlertTriangle, ArrowLeft, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEmpresa } from '@/auth/AuthProvider';
import { configDe } from '@/lib/rubros';
import { formatMoneda, formatNumero, hoyISO, mensajeError } from '@/lib/format';
import { parseNumero } from '@/lib/validaciones';
import { type ProductoConCategoria, useProductos, useUnidades } from '@/features/productos/api';
import { useProveedores } from '@/features/proveedores/api';
import { ProductoPicker } from '@/features/stock/ProductoPicker';
import { PageHeader } from '@/app/components/comun/PageHeader';
import { Cargando, ErrorCarga } from '@/app/components/comun/Estados';
import { Campo } from '@/app/components/comun/Campo';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';
import { type ItemCompraInput, TIPOS_COMPROBANTE, useRegistrarCompra } from './api';
import { resumirCaja, useMiCaja } from '@/features/caja/api';

const SIN_TIPO = '__sin__';
/** Variación de costo a partir de la cual se resalta la fila (posible error de tipeo). */
const VARIACION_ALERTA = 30;

interface Fila {
  producto: ProductoConCategoria;
  cantidad: string;
  costo: string;
  lote: string;
  vencimiento: string;
}

export default function NuevaCompraPage() {
  const navigate = useNavigate();
  const { empresa } = useEmpresa();
  const usaVencimientos = configDe(empresa).usa_vencimientos;
  const { data: productos, isLoading, error } = useProductos();
  const { data: proveedores = [] } = useProveedores();
  const { data: unidades = [] } = useUnidades();
  const registrar = useRegistrarCompra();
  const hoy = hoyISO();

  const [proveedorId, setProveedorId] = useState('');
  const [tipoComprobante, setTipoComprobante] = useState('');
  const [nroComprobante, setNroComprobante] = useState('');
  const [fechaComprobante, setFechaComprobante] = useState(hoy);
  const [filas, setFilas] = useState<Fila[]>([]);
  const [observaciones, setObservaciones] = useState('');
  const [actualizarCostos, setActualizarCostos] = useState(true);
  const [pagadaDesdeCaja, setPagadaDesdeCaja] = useState(false);
  const { data: miCaja } = useMiCaja();
  const efectivoCaja = miCaja ? resumirCaja(Number(miCaja.monto_inicial), miCaja.movimientos).efectivoEsperado : 0;
  const [confirmando, setConfirmando] = useState(false);
  const [intentoEnviar, setIntentoEnviar] = useState(false);

  const comprables = useMemo(() => (productos ?? []).filter((p) => p.activo), [productos]);
  const proveedoresActivos = proveedores.filter((p) => p.activo);
  const decimales = useMemo(() => new Map(unidades.map((u) => [u.codigo, u.permite_decimales])), [unidades]);
  const agregados = useMemo(() => new Set(filas.map((f) => f.producto.id)), [filas]);

  const calculadas = filas.map((f) => {
    const cant = parseNumero(f.cantidad);
    const costo = f.costo.trim() === '' ? NaN : parseNumero(f.costo);
    let error: string | undefined;
    if (f.cantidad.trim() === '' || Number.isNaN(cant) || cant <= 0) error = 'Cantidad inválida';
    else if (!decimales.get(f.producto.unidad_codigo) && !Number.isInteger(cant)) error = 'No admite decimales';
    else if (Number.isNaN(costo) || costo < 0) error = 'Costo inválido';
    else if (f.vencimiento && f.vencimiento < hoy) error = 'El vencimiento ya pasó';
    const costoRedondo = Number.isNaN(costo) ? 0 : Math.round(costo * 100) / 100;
    const subtotal = error ? 0 : Math.round(cant * costoRedondo * 100) / 100;
    const anterior = Number(f.producto.precio_costo);
    const variacion = !error && anterior > 0 ? ((costoRedondo - anterior) / anterior) * 100 : null;
    return { ...f, cant, costoRedondo, subtotal, variacion, error };
  });

  const total = calculadas.reduce((s, f) => s + f.subtotal, 0);
  const errores: string[] = [];
  if (!proveedorId) errores.push('Elegí un proveedor');
  if (filas.length === 0) errores.push('Agregá al menos un producto');
  if (calculadas.some((f) => f.error)) errores.push('Corregí los productos marcados en rojo');
  if (fechaComprobante && fechaComprobante > hoy) errores.push('La fecha del comprobante no puede ser futura');
  if (pagadaDesdeCaja && total > efectivoCaja) errores.push(`No hay suficiente efectivo en tu caja (${formatMoneda(efectivoCaja)})`);
  const grandesVariaciones = calculadas.filter((f) => f.variacion !== null && Math.abs(f.variacion) >= VARIACION_ALERTA);

  const agregar = (p: ProductoConCategoria) => {
    if (agregados.has(p.id)) return;
    setFilas((fs) => [
      ...fs,
      {
        producto: p,
        cantidad: '',
        costo: Number(p.precio_costo) > 0 ? String(Number(p.precio_costo)).replace('.', ',') : '',
        lote: '',
        vencimiento: '',
      },
    ]);
  };

  const actualizar = (id: string, cambios: Partial<Fila>) =>
    setFilas((fs) => fs.map((f) => (f.producto.id === id ? { ...f, ...cambios } : f)));

  const revisar = () => {
    setIntentoEnviar(true);
    if (errores.length > 0) {
      toast.error(errores[0]);
      return;
    }
    setConfirmando(true);
  };

  const confirmar = async () => {
    const items: ItemCompraInput[] = calculadas.map((f) => ({
      producto_id: f.producto.id,
      cantidad: f.cant,
      costo_unitario: f.costoRedondo,
      ...(f.lote.trim() ? { lote: f.lote.trim() } : {}),
      ...(f.vencimiento ? { vencimiento: f.vencimiento } : {}),
    }));
    try {
      const compra = await registrar.mutateAsync({
        proveedorId,
        items,
        tipoComprobante,
        nroComprobante,
        fechaComprobante,
        observaciones,
        actualizarCostos,
        pagadaDesdeCaja,
      });
      toast.success(`Compra #${compra.numero} registrada por ${formatMoneda(compra.total)}`);
      navigate('/compras');
    } catch (err) {
      setConfirmando(false);
      toast.error(mensajeError(err));
    }
  };

  if (isLoading) return <Cargando />;
  if (error) return <ErrorCarga error={error} />;

  const proveedor = proveedores.find((p) => p.id === proveedorId);

  return (
    <div className="space-y-4">
      <PageHeader
        titulo="Nueva compra"
        descripcion="Registrá la mercadería recibida. El stock se suma al confirmar."
        acciones={
          <Button variant="outline" asChild>
            <Link to="/compras">
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver
            </Link>
          </Button>
        }
      />

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Campo
            id="proveedor"
            label="Proveedor"
            requerido
            error={intentoEnviar && !proveedorId ? 'Elegí un proveedor' : undefined}
            ayuda={
              proveedoresActivos.length === 0 ? (
                <Link to="/proveedores" className="text-primary hover:underline">
                  Primero cargá un proveedor
                </Link>
              ) : proveedor?.condicion_pago ? (
                `Condición de pago: ${proveedor.condicion_pago}`
              ) : undefined
            }
          >
            <Select value={proveedorId} onValueChange={setProveedorId}>
              <SelectTrigger id="proveedor">
                <SelectValue placeholder="Elegí un proveedor" />
              </SelectTrigger>
              <SelectContent>
                {proveedoresActivos.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.razon_social}
                    {p.nombre_fantasia ? ` (${p.nombre_fantasia})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Campo>
          <Campo id="tipo_comprobante" label="Comprobante">
            <Select value={tipoComprobante || SIN_TIPO} onValueChange={(v) => setTipoComprobante(v === SIN_TIPO ? '' : v)}>
              <SelectTrigger id="tipo_comprobante">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SIN_TIPO}>Sin comprobante</SelectItem>
                {TIPOS_COMPROBANTE.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Campo>
          <Campo id="nro_comprobante" label="N° de comprobante">
            <Input
              id="nro_comprobante"
              value={nroComprobante}
              onChange={(e) => setNroComprobante(e.target.value)}
              placeholder="0001-00001234"
            />
          </Campo>
          <Campo
            id="fecha_comprobante"
            label="Fecha del comprobante"
            error={fechaComprobante > hoy ? 'No puede ser futura' : undefined}
          >
            <Input
              id="fecha_comprobante"
              type="date"
              max={hoy}
              value={fechaComprobante}
              onChange={(e) => setFechaComprobante(e.target.value)}
            />
          </Campo>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <ProductoPicker
            productos={comprables}
            onSeleccionar={agregar}
            deshabilitados={agregados}
            placeholder="Agregar producto…"
            className="md:w-96"
          />
          <p className="text-xs text-muted-foreground">
            El costo se completa con el último costo registrado; modificalo si cambió.
          </p>
        </div>
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="w-28">Cantidad</TableHead>
                <TableHead className="w-36">Costo unitario</TableHead>
                {usaVencimientos && <TableHead className="w-32">Lote</TableHead>}
                {usaVencimientos && <TableHead className="w-40">Vencimiento</TableHead>}
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {calculadas.map((f) => (
                <TableRow key={f.producto.id}>
                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground mr-2">{f.producto.codigo}</span>
                    {f.producto.nombre}
                    <span className="text-xs text-muted-foreground"> ({f.producto.unidad_codigo})</span>
                    {f.error && (intentoEnviar || f.cantidad !== '') && (
                      <p className="text-xs text-destructive">{f.error}</p>
                    )}
                    {f.variacion !== null && Math.abs(f.variacion) >= 0.5 && (
                      <p
                        className={`text-xs flex items-center gap-1 ${Math.abs(f.variacion) >= VARIACION_ALERTA ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground'}`}
                      >
                        {Math.abs(f.variacion) >= VARIACION_ALERTA && <AlertTriangle className="w-3 h-3" />}
                        {f.variacion > 0 ? 'Sube' : 'Baja'} {Math.abs(f.variacion).toFixed(0)}% vs. costo actual (
                        {formatMoneda(f.producto.precio_costo)})
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Input
                      className="h-8 text-right"
                      inputMode="decimal"
                      value={f.cantidad}
                      onChange={(e) => actualizar(f.producto.id, { cantidad: e.target.value })}
                      aria-label={`Cantidad de ${f.producto.nombre}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="h-8 text-right"
                      inputMode="decimal"
                      value={f.costo}
                      onChange={(e) => actualizar(f.producto.id, { costo: e.target.value })}
                      aria-label={`Costo unitario de ${f.producto.nombre}`}
                    />
                  </TableCell>
                  {usaVencimientos && (
                    <TableCell>
                      <Input
                        className="h-8"
                        value={f.lote}
                        onChange={(e) => actualizar(f.producto.id, { lote: e.target.value })}
                        aria-label={`Lote de ${f.producto.nombre}`}
                      />
                    </TableCell>
                  )}
                  {usaVencimientos && (
                    <TableCell>
                      <Input
                        className="h-8"
                        type="date"
                        min={hoy}
                        value={f.vencimiento}
                        onChange={(e) => actualizar(f.producto.id, { vencimiento: e.target.value })}
                        aria-label={`Vencimiento de ${f.producto.nombre}`}
                      />
                    </TableCell>
                  )}
                  <TableCell className="text-right tabular-nums">{f.error ? '—' : formatMoneda(f.subtotal)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setFilas((fs) => fs.filter((x) => x.producto.id !== f.producto.id))}
                      aria-label={`Quitar ${f.producto.nombre}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                    Agregá los productos recibidos con el buscador.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            {filas.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={usaVencimientos ? 5 : 3} className="text-right">
                    Total
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-base">{formatMoneda(total)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="observaciones">Observaciones</Label>
          <Textarea id="observaciones" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
        </div>
        <div className="flex items-start gap-2">
          <Checkbox
            id="actualizar_costos"
            checked={actualizarCostos}
            onCheckedChange={(v) => setActualizarCostos(v === true)}
          />
          <div>
            <Label htmlFor="actualizar_costos" className="font-normal">
              Actualizar el precio de costo de los productos con los costos de esta compra
            </Label>
            <p className="text-xs text-muted-foreground">Los precios de venta no se modifican.</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Checkbox
            id="pagada_caja"
            checked={pagadaDesdeCaja}
            disabled={!miCaja}
            onCheckedChange={(v) => setPagadaDesdeCaja(v === true)}
          />
          <div>
            <Label htmlFor="pagada_caja" className={`font-normal ${!miCaja ? 'text-muted-foreground' : ''}`}>
              Pagada en efectivo desde mi caja
            </Label>
            <p className="text-xs text-muted-foreground">
              {miCaja
                ? `Se registra un egreso en la caja #${miCaja.numero} (efectivo disponible: ${formatMoneda(efectivoCaja)}).`
                : 'Para usar esta opción abrí una caja en Finanzas → Caja.'}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t">
          <p className="text-sm text-muted-foreground">
            {filas.length} productos · Total <strong className="text-foreground">{formatMoneda(total)}</strong>
          </p>
          <Button onClick={revisar} disabled={registrar.isPending}>
            Revisar y confirmar
          </Button>
        </div>
      </Card>

      <AlertDialog open={confirmando} onOpenChange={(o) => !registrar.isPending && setConfirmando(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Registrar la compra?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>{proveedor?.razon_social}</strong>
                  {tipoComprobante && ` · ${tipoComprobante}`}
                  {nroComprobante && ` ${nroComprobante}`}
                </p>
                <p>
                  {filas.length} productos por <strong>{formatMoneda(total)}</strong>. Se suma el stock
                  {actualizarCostos ? ' y se actualizan los costos' : ''}
                  {pagadaDesdeCaja ? '. Se descuenta el efectivo de tu caja' : ''}.
                </p>
                {grandesVariaciones.length > 0 && (
                  <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-2 text-amber-800 dark:text-amber-300">
                    <p className="flex items-center gap-1 font-medium">
                      <AlertTriangle className="w-4 h-4" /> Revisá estos costos:
                    </p>
                    <ul className="list-disc pl-5">
                      {grandesVariaciones.map((f) => (
                        <li key={f.producto.id}>
                          {f.producto.nombre}: {formatMoneda(f.producto.precio_costo)} → {formatMoneda(f.costoRedondo)} (
                          {f.variacion! > 0 ? '+' : ''}
                          {f.variacion!.toFixed(0)}%)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-xs">
                  Cantidades: {calculadas.map((f) => `${formatNumero(f.cant)} ${f.producto.unidad_codigo} ${f.producto.nombre}`).join(' · ')}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={registrar.isPending}>Volver</AlertDialogCancel>
            <AlertDialogAction
              disabled={registrar.isPending}
              onClick={(e) => {
                e.preventDefault();
                void confirmar();
              }}
            >
              {registrar.isPending ? 'Registrando…' : 'Registrar compra'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
