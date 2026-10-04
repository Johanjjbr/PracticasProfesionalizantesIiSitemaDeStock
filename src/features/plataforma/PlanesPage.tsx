import { useEffect, useState, type FormEvent } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { formatMoneda, mensajeError } from '@/lib/format';
import { parseNumero } from '@/lib/validaciones';
import { PageHeader } from '@/app/components/comun/PageHeader';
import { Campo } from '@/app/components/comun/Campo';
import { Cargando, ErrorCarga } from '@/app/components/comun/Estados';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Switch } from '@/app/components/ui/switch';
import { Label } from '@/app/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { type Plan, useGuardarPlan, usePlanes } from './api';

const limite = (n: number | null) => (n == null ? 'Ilimitado' : String(n));

function PlanDialog({ plan, abierto, onCerrar }: { plan: Plan | null; abierto: boolean; onCerrar: () => void }) {
  const guardar = useGuardarPlan();
  const [f, setF] = useState({ nombre: '', descripcion: '', precio: '', maxU: '', maxP: '', activo: true });
  const [err, setErr] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!abierto) return;
    setErr({});
    setF({
      nombre: plan?.nombre ?? '',
      descripcion: plan?.descripcion ?? '',
      precio: plan ? String(plan.precio_mensual) : '',
      maxU: plan?.max_usuarios != null ? String(plan.max_usuarios) : '',
      maxP: plan?.max_productos != null ? String(plan.max_productos) : '',
      activo: plan?.activo ?? true,
    });
  }, [abierto, plan]);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    const e2: Record<string, string> = {};
    const precio = parseNumero(f.precio);
    const maxU = f.maxU.trim() ? parseNumero(f.maxU) : null;
    const maxP = f.maxP.trim() ? parseNumero(f.maxP) : null;
    if (f.nombre.trim().length < 2) e2.nombre = 'Ingresá un nombre';
    if (!Number.isFinite(precio) || precio < 0) e2.precio = 'Precio inválido';
    if (maxU != null && (!Number.isInteger(maxU) || maxU < 1)) e2.maxU = 'Número entero mayor a 0';
    if (maxP != null && (!Number.isInteger(maxP) || maxP < 1)) e2.maxP = 'Número entero mayor a 0';
    setErr(e2);
    if (Object.keys(e2).length) return;
    try {
      await guardar.mutateAsync({
        id: plan?.id,
        datos: {
          nombre: f.nombre.trim(),
          descripcion: f.descripcion.trim() || null,
          precio_mensual: precio,
          max_usuarios: maxU,
          max_productos: maxP,
          activo: f.activo,
        },
      });
      toast.success(plan ? 'Plan actualizado' : 'Plan creado');
      onCerrar();
    } catch (e) {
      toast.error(mensajeError(e));
    }
  };

  return (
    <Dialog open={abierto} onOpenChange={(o) => !o && onCerrar()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{plan ? `Editar plan ${plan.nombre}` : 'Nuevo plan'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={enviar} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="pl-nombre" label="Nombre" requerido error={err.nombre}>
              <Input id="pl-nombre" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} maxLength={60} />
            </Campo>
            <Campo id="pl-precio" label="Precio mensual ($)" requerido error={err.precio}>
              <Input id="pl-precio" inputMode="decimal" value={f.precio} onChange={(e) => setF({ ...f, precio: e.target.value })} />
            </Campo>
            <Campo id="pl-desc" label="Descripción" className="sm:col-span-2">
              <Input id="pl-desc" value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} maxLength={200} />
            </Campo>
            <Campo id="pl-maxu" label="Máx. usuarios activos" error={err.maxU} ayuda="Vacío = ilimitado">
              <Input id="pl-maxu" inputMode="numeric" value={f.maxU} onChange={(e) => setF({ ...f, maxU: e.target.value })} />
            </Campo>
            <Campo id="pl-maxp" label="Máx. productos activos" error={err.maxP} ayuda="Vacío = ilimitado">
              <Input id="pl-maxp" inputMode="numeric" value={f.maxP} onChange={(e) => setF({ ...f, maxP: e.target.value })} />
            </Campo>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="pl-activo" checked={f.activo} onCheckedChange={(v) => setF({ ...f, activo: v })} />
            <Label htmlFor="pl-activo">Disponible para asignar a empresas nuevas</Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Bajar un límite no desactiva nada: solo impide agregar usuarios o productos nuevos por encima del máximo.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCerrar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={guardar.isPending}>
              {guardar.isPending ? 'Guardando…' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function PlanesPage() {
  const planes = usePlanes();
  const [editando, setEditando] = useState<Plan | null>(null);
  const [abierto, setAbierto] = useState(false);

  const abrir = (p: Plan | null) => {
    setEditando(p);
    setAbierto(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Planes"
        descripcion="Precio mensual y límites de cada plan"
        acciones={
          <Button onClick={() => abrir(null)}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo plan
          </Button>
        }
      />
      {planes.isLoading ? (
        <Cargando />
      ) : planes.error ? (
        <ErrorCarga error={planes.error} />
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Precio mensual</TableHead>
                <TableHead className="text-right">Usuarios</TableHead>
                <TableHead className="text-right">Productos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {planes.data!.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Todavía no hay planes.
                  </TableCell>
                </TableRow>
              )}
              {planes.data!.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <p>{p.nombre}</p>
                    {p.descripcion && <p className="text-xs text-muted-foreground">{p.descripcion}</p>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoneda(p.precio_mensual)}</TableCell>
                  <TableCell className="text-right tabular-nums">{limite(p.max_usuarios)}</TableCell>
                  <TableCell className="text-right tabular-nums">{limite(p.max_productos)}</TableCell>
                  <TableCell>
                    {p.activo ? <Badge variant="secondary">Disponible</Badge> : <Badge variant="outline">Retirado</Badge>}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" aria-label={`Editar ${p.nombre}`} onClick={() => abrir(p)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
      <PlanDialog plan={editando} abierto={abierto} onCerrar={() => setAbierto(false)} />
    </div>
  );
}
