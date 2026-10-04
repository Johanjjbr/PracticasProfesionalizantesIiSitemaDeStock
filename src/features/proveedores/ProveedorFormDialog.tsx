import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { mensajeError } from '@/lib/format';
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
import { type Proveedor, useGuardarProveedor } from './api';
import {
  CONDICIONES_IVA,
  CONDICIONES_PAGO,
  type ErroresProveedor,
  type ProveedorForm,
  formDesdeProveedor,
  formVacio,
  validarProveedor,
} from './schema';

const NINGUNA = '__ninguna__';

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  proveedor: Proveedor | null;
}

/** Select con opciones fijas que además conserva un valor previo que no esté en la lista. */
function SelectOpciones({
  id,
  valor,
  opciones,
  onChange,
}: {
  id: string;
  valor: string;
  opciones: readonly string[];
  onChange: (v: string) => void;
}) {
  const lista = valor && !opciones.includes(valor) ? [...opciones, valor] : opciones;
  return (
    <Select value={valor || NINGUNA} onValueChange={(v) => onChange(v === NINGUNA ? '' : v)}>
      <SelectTrigger id={id}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NINGUNA}>Sin especificar</SelectItem>
        {lista.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function ProveedorFormDialog({ abierto, onCerrar, proveedor }: Props) {
  const guardar = useGuardarProveedor();
  const [form, setForm] = useState<ProveedorForm>(formVacio);
  const [errores, setErrores] = useState<ErroresProveedor>({});

  useEffect(() => {
    if (!abierto) return;
    setForm(proveedor ? formDesdeProveedor(proveedor) : formVacio());
    setErrores({});
  }, [abierto, proveedor]);

  const set = <K extends keyof ProveedorForm>(campo: K, valor: ProveedorForm[K]) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErrores((e) => ({ ...e, [campo]: undefined }));
  };

  const texto = (campo: keyof ProveedorForm, props: React.ComponentProps<typeof Input> = {}) => (
    <Input
      id={campo}
      value={form[campo] as string}
      onChange={(e) => set(campo, e.target.value as never)}
      aria-invalid={!!errores[campo]}
      {...props}
    />
  );

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const r = validarProveedor(form);
    if (!r.ok) {
      setErrores(r.errores);
      return;
    }
    try {
      await guardar.mutateAsync({ id: proveedor?.id, datos: r.datos });
      toast.success(proveedor ? 'Proveedor actualizado' : 'Proveedor creado');
      onCerrar();
    } catch (err) {
      toast.error(mensajeError(err));
    }
  };

  return (
    <Dialog open={abierto} onOpenChange={(o) => !o && !guardar.isPending && onCerrar()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{proveedor ? 'Editar proveedor' : 'Nuevo proveedor'}</DialogTitle>
          <DialogDescription>Solo la razón social es obligatoria.</DialogDescription>
        </DialogHeader>

        <form id="form-proveedor" onSubmit={onSubmit} className="space-y-5" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo id="razon_social" label="Razón social" requerido error={errores.razon_social}>
              {texto('razon_social')}
            </Campo>
            <Campo id="nombre_fantasia" label="Nombre de fantasía">
              {texto('nombre_fantasia')}
            </Campo>
            <Campo id="cuit" label="CUIT" error={errores.cuit} ayuda="Con o sin guiones">
              {texto('cuit', { inputMode: 'numeric', placeholder: '30-12345678-9' })}
            </Campo>
            <Campo id="condicion_iva" label="Condición frente al IVA">
              <SelectOpciones
                id="condicion_iva"
                valor={form.condicion_iva}
                opciones={CONDICIONES_IVA}
                onChange={(v) => set('condicion_iva', v)}
              />
            </Campo>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Campo id="contacto" label="Persona de contacto">
              {texto('contacto')}
            </Campo>
            <Campo id="telefono" label="Teléfono" error={errores.telefono}>
              {texto('telefono', { type: 'tel' })}
            </Campo>
            <Campo id="email" label="Email" error={errores.email}>
              {texto('email', { type: 'email' })}
            </Campo>
            <Campo id="direccion" label="Dirección" className="sm:col-span-2">
              {texto('direccion')}
            </Campo>
            <Campo id="ciudad" label="Ciudad">
              {texto('ciudad')}
            </Campo>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo id="condicion_pago" label="Condición de pago">
              <SelectOpciones
                id="condicion_pago"
                valor={form.condicion_pago}
                opciones={CONDICIONES_PAGO}
                onChange={(v) => set('condicion_pago', v)}
              />
            </Campo>
            <Campo id="alias_cbu" label="Alias / CBU" error={errores.alias_cbu}>
              {texto('alias_cbu')}
            </Campo>
            <Campo id="observaciones" label="Observaciones" className="sm:col-span-2">
              <Textarea
                id="observaciones"
                value={form.observaciones}
                onChange={(e) => set('observaciones', e.target.value)}
              />
            </Campo>
          </div>

          {proveedor && (
            <div className="flex items-center justify-between rounded-md border p-4">
              <div>
                <Label htmlFor="activo">Proveedor activo</Label>
                <p className="text-xs text-muted-foreground">Los inactivos no aparecen al registrar compras.</p>
              </div>
              <Switch id="activo" checked={form.activo} onCheckedChange={(v) => set('activo', v)} />
            </div>
          )}
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCerrar} disabled={guardar.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="form-proveedor" disabled={guardar.isPending}>
            {guardar.isPending ? 'Guardando…' : proveedor ? 'Guardar cambios' : 'Crear proveedor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
