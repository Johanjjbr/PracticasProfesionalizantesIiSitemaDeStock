import { useMemo, useState } from 'react';
import { ClipboardList, Layers, Minus, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEmpresa } from '@/auth/AuthProvider';
import { configDe } from '@/lib/rubros';
import { formatNumero, mensajeError } from '@/lib/format';
import { parseNumero } from '@/lib/validaciones';
import { type ProductoConCategoria, useCategorias, useProductos, useUnidades } from '@/features/productos/api';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/app/components/ui/toggle-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
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
import { Cargando, ErrorCarga } from '@/app/components/comun/Estados';
import { ProductoPicker } from './ProductoPicker';
import { MOTIVO_LABEL, MOTIVOS_MANUALES, type MotivoAjuste } from './etiquetas';
import { type ItemAjusteInput, useRegistrarAjuste } from './api';

type Modo = 'manual' | 'conteo';

interface Fila {
  producto: ProductoConCategoria;
  sentido: 'entrada' | 'salida'; // solo modo manual
  cantidad: string;
}

interface FilaCalculada extends Fila {
  diferencia: number | null; // null = cantidad inválida o vacía
  nuevoStock: number | null;
  error?: string;
}

export default function NuevoAjuste({ onRegistrado }: { onRegistrado: () => void }) {
  const { empresa } = useEmpresa();
  const permiteNegativo = configDe(empresa).permite_stock_negativo;
  const { data: productos, isLoading, error } = useProductos();
  const { data: categorias = [] } = useCategorias();
  const { data: unidades = [] } = useUnidades();
  const registrar = useRegistrarAjuste();

  const [modo, setModo] = useState<Modo>('manual');
  const [motivo, setMotivo] = useState<MotivoAjuste>('merma');
  const [filas, setFilas] = useState<Fila[]>([]);
  const [observaciones, setObservaciones] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [categoriaConteo, setCategoriaConteo] = useState('');

  const ajustables = useMemo(() => (productos ?? []).filter((p) => p.activo && p.controla_stock), [productos]);
  const decimalesPorUnidad = useMemo(
    () => new Map(unidades.map((u) => [u.codigo, u.permite_decimales])),
    [unidades],
  );
  const yaAgregados = useMemo(() => new Set(filas.map((f) => f.producto.id)), [filas]);

  const calculadas: FilaCalculada[] = filas.map((f) => {
    const stock = Number(f.producto.stock_actual);
    if (f.cantidad.trim() === '') return { ...f, diferencia: null, nuevoStock: null };
    const n = parseNumero(f.cantidad);
    if (Number.isNaN(n) || n < 0) return { ...f, diferencia: null, nuevoStock: null, error: 'Cantidad inválida' };
    if (!decimalesPorUnidad.get(f.producto.unidad_codigo) && !Number.isInteger(n)) {
      return { ...f, diferencia: null, nuevoStock: null, error: 'No admite decimales' };
    }
    const diferencia = modo === 'conteo' ? n - stock : f.sentido === 'entrada' ? n : -n;
    if (modo === 'manual' && n === 0) return { ...f, diferencia: null, nuevoStock: null, error: 'Debe ser mayor a 0' };
    const nuevoStock = stock + diferencia;
    if (nuevoStock < 0 && !permiteNegativo) {
      return { ...f, diferencia, nuevoStock, error: `Stock insuficiente (hay ${formatNumero(stock)})` };
    }
    return { ...f, diferencia, nuevoStock };
  });

  const completas = calculadas.filter((f) => f.diferencia !== null && !f.error);
  const conErrores = calculadas.filter((f) => f.error);
  const pendientes = calculadas.filter((f) => f.diferencia === null && !f.error);
  const conCambio = completas.filter((f) => f.diferencia !== 0);
  const faltaObs = motivo === 'otro' && modo === 'manual' && observaciones.trim() === '';
  const puedeConfirmar =
    filas.length > 0 &&
    conErrores.length === 0 &&
    pendientes.length === 0 &&
    !faltaObs &&
    (modo === 'conteo' || conCambio.length > 0);

  const cambiarModo = (m: string) => {
    if (!m || m === modo) return;
    if (filas.length > 0 && !window.confirm('Al cambiar de modo se descartan los productos cargados. ¿Continuar?')) return;
    setModo(m as Modo);
    setFilas([]);
  };

  const agregar = (p: ProductoConCategoria) => {
    if (yaAgregados.has(p.id)) return;
    setFilas((fs) => [...fs, { producto: p, sentido: 'salida', cantidad: '' }]);
  };

  const agregarCategoria = () => {
    const nuevos = ajustables.filter(
      (p) => (categoriaConteo === '__sin__' ? !p.categoria_id : p.categoria_id === categoriaConteo) && !yaAgregados.has(p.id),
    );
    if (nuevos.length === 0) {
      toast.info('No hay productos nuevos para agregar de esa categoría');
      return;
    }
    setFilas((fs) => [...fs, ...nuevos.map((p) => ({ producto: p, sentido: 'salida' as const, cantidad: '' }))]);
    toast.success(`${nuevos.length} productos agregados`);
  };

  const actualizar = (id: string, cambios: Partial<Fila>) =>
    setFilas((fs) => fs.map((f) => (f.producto.id === id ? { ...f, ...cambios } : f)));

  const quitar = (id: string) => setFilas((fs) => fs.filter((f) => f.producto.id !== id));

  const confirmar = async () => {
    const items: ItemAjusteInput[] = completas.map((f) =>
      modo === 'conteo'
        ? { producto_id: f.producto.id, modo: 'conteo', cantidad: parseNumero(f.cantidad) }
        : { producto_id: f.producto.id, modo: 'diferencia', cantidad: f.diferencia! },
    );
    try {
      const ajuste = await registrar.mutateAsync({
        motivo: modo === 'conteo' ? 'conteo_fisico' : motivo,
        items,
        observaciones,
      });
      toast.success(`Ajuste #${ajuste.numero} registrado`);
      setFilas([]);
      setObservaciones('');
      setConfirmando(false);
      onRegistrado();
    } catch (err) {
      setConfirmando(false);
      toast.error(mensajeError(err));
    }
  };

  if (isLoading) return <Cargando />;
  if (error) return <ErrorCarga error={error} />;

  const entradas = conCambio.filter((f) => f.diferencia! > 0).length;
  const salidas = conCambio.filter((f) => f.diferencia! < 0).length;

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="space-y-1.5">
            <Label>Tipo de ajuste</Label>
            <ToggleGroup type="single" value={modo} onValueChange={cambiarModo} variant="outline">
              <ToggleGroupItem value="manual" className="px-4">
                <Plus className="w-4 h-4 mr-1" />
                <Minus className="w-4 h-4 mr-2 -ml-1" /> Entrada / salida
              </ToggleGroupItem>
              <ToggleGroupItem value="conteo" className="px-4">
                <ClipboardList className="w-4 h-4 mr-2" /> Conteo físico
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          {modo === 'manual' && (
            <div className="space-y-1.5 md:w-56">
              <Label htmlFor="motivo">Motivo</Label>
              <Select value={motivo} onValueChange={(v) => setMotivo(v as MotivoAjuste)}>
                <SelectTrigger id="motivo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOTIVOS_MANUALES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {MOTIVO_LABEL[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {modo === 'manual'
            ? 'Indicá cuánto entra o sale de cada producto (por ejemplo, 2 tortas rotas = salida de 2).'
            : 'Cargá la cantidad que contaste de cada producto. El sistema calcula la diferencia contra el stock registrado. Los productos que coinciden quedan registrados como verificados.'}
        </p>

        <div className="flex flex-col md:flex-row gap-3">
          <ProductoPicker
            productos={ajustables}
            onSeleccionar={agregar}
            deshabilitados={yaAgregados}
            placeholder="Agregar producto…"
            className="md:w-96"
          />
          {modo === 'conteo' && (
            <div className="flex gap-2">
              <Select value={categoriaConteo} onValueChange={setCategoriaConteo}>
                <SelectTrigger className="md:w-56" aria-label="Categoría a contar">
                  <SelectValue placeholder="Categoría completa…" />
                </SelectTrigger>
                <SelectContent>
                  {categorias
                    .filter((c) => c.activa)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  <SelectItem value="__sin__">Sin categoría</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={agregarCategoria} disabled={!categoriaConteo}>
                <Layers className="w-4 h-4 mr-2" /> Agregar
              </Button>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead className="text-right">Stock actual</TableHead>
              {modo === 'manual' && <TableHead className="w-36">Movimiento</TableHead>}
              <TableHead className="w-36">{modo === 'conteo' ? 'Contado' : 'Cantidad'}</TableHead>
              <TableHead className="text-right">Diferencia</TableHead>
              <TableHead className="text-right">Nuevo stock</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {calculadas.map((f) => (
              <TableRow key={f.producto.id}>
                <TableCell>
                  <span className="font-mono text-xs text-muted-foreground mr-2">{f.producto.codigo}</span>
                  {f.producto.nombre}
                  {f.error && <p className="text-xs text-destructive">{f.error}</p>}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumero(f.producto.stock_actual)} <span className="text-xs text-muted-foreground">{f.producto.unidad_codigo}</span>
                </TableCell>
                {modo === 'manual' && (
                  <TableCell>
                    <Select
                      value={f.sentido}
                      onValueChange={(v) => actualizar(f.producto.id, { sentido: v as Fila['sentido'] })}
                    >
                      <SelectTrigger className="h-8" aria-label={`Movimiento de ${f.producto.nombre}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="salida">Salida (−)</SelectItem>
                        <SelectItem value="entrada">Entrada (+)</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                )}
                <TableCell>
                  <Input
                    className="h-8 text-right"
                    inputMode="decimal"
                    value={f.cantidad}
                    onChange={(e) => actualizar(f.producto.id, { cantidad: e.target.value })}
                    aria-label={`${modo === 'conteo' ? 'Cantidad contada' : 'Cantidad'} de ${f.producto.nombre}`}
                    aria-invalid={!!f.error}
                  />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {f.diferencia === null ? (
                    <span className="text-muted-foreground">—</span>
                  ) : f.diferencia === 0 ? (
                    <Badge variant="outline" className="text-[10px]">
                      Coincide
                    </Badge>
                  ) : (
                    <span className={f.diferencia > 0 ? 'text-green-700 dark:text-green-400' : 'text-destructive'}>
                      {f.diferencia > 0 ? '+' : ''}
                      {formatNumero(f.diferencia)}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {f.nuevoStock === null ? '—' : formatNumero(f.nuevoStock)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => quitar(f.producto.id)}
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
                  Agregá productos con el buscador
                  {modo === 'conteo' ? ' o cargá una categoría completa' : ''}.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Card className="p-4 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="observaciones">
            Observaciones{motivo === 'otro' && modo === 'manual' && <span className="text-destructive"> *</span>}
          </Label>
          <Textarea
            id="observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder={modo === 'conteo' ? 'Ej: conteo mensual de heladera' : 'Ej: 2 tortas se cayeron al exhibirlas'}
          />
          {faltaObs && <p className="text-xs text-destructive">Con motivo “Otro” las observaciones son obligatorias.</p>}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {filas.length} productos · {entradas} con entrada · {salidas} con salida
            {pendientes.length > 0 && ` · ${pendientes.length} sin cantidad`}
          </p>
          <Button disabled={!puedeConfirmar || registrar.isPending} onClick={() => setConfirmando(true)}>
            Revisar y confirmar
          </Button>
        </div>
      </Card>

      <AlertDialog open={confirmando} onOpenChange={(o) => !registrar.isPending && setConfirmando(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Registrar el ajuste?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  Motivo: <strong>{MOTIVO_LABEL[modo === 'conteo' ? 'conteo_fisico' : motivo]}</strong>
                </p>
                <ul className="max-h-60 overflow-y-auto border rounded-md divide-y">
                  {conCambio.map((f) => (
                    <li key={f.producto.id} className="flex justify-between px-3 py-1.5">
                      <span className="truncate">{f.producto.nombre}</span>
                      <span className="tabular-nums whitespace-nowrap">
                        {formatNumero(f.producto.stock_actual)} → {formatNumero(f.nuevoStock)}
                      </span>
                    </li>
                  ))}
                  {conCambio.length === 0 && <li className="px-3 py-2">Todos los productos coinciden con el sistema.</li>}
                </ul>
                <p>Una vez registrado no se puede editar; para corregirlo hay que hacer otro ajuste.</p>
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
              {registrar.isPending ? 'Registrando…' : 'Registrar ajuste'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
