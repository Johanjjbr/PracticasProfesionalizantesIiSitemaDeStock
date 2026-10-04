import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { useAuth, useEmpresa } from '@/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import type { Json } from '@/lib/database.types';
import { mensajeError } from '@/lib/format';
import { cuitValido, formatearCuit, vacioANull } from '@/lib/validaciones';
import { configDe, RUBRO_LABEL, type ConfigEmpresa } from '@/lib/rubros';
import { MEDIO_PAGO_LABEL } from '@/features/caja/api';
import { PageHeader } from '@/app/components/comun/PageHeader';
import { Campo } from '@/app/components/comun/Campo';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Switch } from '@/app/components/ui/switch';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Label } from '@/app/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';

type MedioPago = keyof typeof MEDIO_PAGO_LABEL;

interface DatosEmpresa {
  nombre: string;
  cuit: string;
  direccion: string;
  telefono: string;
  email: string;
}

function DatosTab() {
  const { empresa } = useEmpresa();
  const { recargar } = useAuth();
  const [form, setForm] = useState<DatosEmpresa>({ nombre: '', cuit: '', direccion: '', telefono: '', email: '' });
  const [errores, setErrores] = useState<Partial<Record<keyof DatosEmpresa, string>>>({});
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    setForm({
      nombre: empresa.nombre,
      cuit: empresa.cuit ?? '',
      direccion: empresa.direccion ?? '',
      telefono: empresa.telefono ?? '',
      email: empresa.email ?? '',
    });
    setErrores({});
  }, [empresa]);

  const set = (k: keyof DatosEmpresa) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    const err: typeof errores = {};
    if (form.nombre.trim().length < 2) err.nombre = 'Ingresá el nombre del negocio';
    if (form.cuit.trim() && !cuitValido(form.cuit)) err.cuit = 'CUIT inválido (revisá el dígito verificador)';
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) err.email = 'Email inválido';
    setErrores(err);
    if (Object.keys(err).length) return;

    setGuardando(true);
    const cuit = vacioANull(form.cuit);
    const { error, count } = await supabase
      .from('empresas')
      .update(
        {
          nombre: form.nombre.trim(),
          cuit: cuit ? formatearCuit(cuit) : null,
          direccion: vacioANull(form.direccion),
          telefono: vacioANull(form.telefono),
          email: vacioANull(form.email)?.toLowerCase() ?? null,
        },
        { count: 'exact' },
      )
      .eq('id', empresa.id);
    setGuardando(false);
    if (error) return toast.error(mensajeError(error));
    if (!count) return toast.error('No tenés permiso para modificar la empresa');
    toast.success('Datos guardados');
    await recargar();
  };

  return (
    <Card className="p-6 max-w-2xl">
      <form onSubmit={guardar} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="emp-nombre" label="Nombre del negocio" requerido error={errores.nombre} className="sm:col-span-2">
            <Input id="emp-nombre" value={form.nombre} onChange={set('nombre')} maxLength={120} />
          </Campo>
          <Campo id="emp-cuit" label="CUIT" error={errores.cuit} ayuda="Aparece en el ticket. Ej: 30-71234567-1">
            <Input
              id="emp-cuit"
              value={form.cuit}
              onChange={set('cuit')}
              onBlur={() => setForm((f) => ({ ...f, cuit: formatearCuit(f.cuit) }))}
              inputMode="numeric"
              maxLength={13}
            />
          </Campo>
          <Campo id="emp-rubro" label="Rubro" ayuda="Lo define el administrador de la plataforma">
            <div id="emp-rubro" className="h-9 flex items-center">
              <Badge variant="secondary">{RUBRO_LABEL[empresa.rubro]}</Badge>
            </div>
          </Campo>
          <Campo id="emp-direccion" label="Dirección" className="sm:col-span-2">
            <Input id="emp-direccion" value={form.direccion} onChange={set('direccion')} maxLength={200} />
          </Campo>
          <Campo id="emp-telefono" label="Teléfono">
            <Input id="emp-telefono" value={form.telefono} onChange={set('telefono')} maxLength={40} />
          </Campo>
          <Campo id="emp-email" label="Email" error={errores.email}>
            <Input id="emp-email" type="email" value={form.email} onChange={set('email')} maxLength={120} />
          </Campo>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function OpcionSwitch({
  id,
  titulo,
  descripcion,
  checked,
  onChange,
  disabled,
  extra,
}: {
  id: string;
  titulo: string;
  descripcion: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="space-y-1">
        <Label htmlFor={id} className="flex items-center gap-2">
          {titulo}
          {extra}
        </Label>
        <p className="text-sm text-muted-foreground">{descripcion}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}

function OpcionesTab() {
  const { empresa } = useEmpresa();
  const { recargar } = useAuth();
  const [cfg, setCfg] = useState<ConfigEmpresa>(() => configDe(empresa));
  const [guardando, setGuardando] = useState(false);

  useEffect(() => setCfg(configDe(empresa)), [empresa]);

  const original = configDe(empresa);
  const cambiado = JSON.stringify(original) !== JSON.stringify(cfg);

  const toggleMedio = (m: MedioPago, on: boolean) =>
    setCfg((c) => {
      const set = new Set(c.medios_pago);
      if (on) set.add(m);
      else set.delete(m);
      // Se respeta el orden canónico de los medios
      return { ...c, medios_pago: (Object.keys(MEDIO_PAGO_LABEL) as MedioPago[]).filter((x) => set.has(x)) };
    });

  const guardar = async () => {
    setGuardando(true);
    // Se conservan claves desconocidas del jsonb (otras fases / rubros)
    const base = (empresa.config && typeof empresa.config === 'object' && !Array.isArray(empresa.config) ? empresa.config : {}) as Record<string, Json>;
    const nueva: Record<string, Json> = { ...base, ...cfg, medios_pago: Array.from(new Set(['efectivo', ...cfg.medios_pago])) };
    const { error, count } = await supabase.from('empresas').update({ config: nueva }, { count: 'exact' }).eq('id', empresa.id);
    setGuardando(false);
    if (error) return toast.error(mensajeError(error));
    if (!count) return toast.error('No tenés permiso para modificar la empresa');
    toast.success('Opciones guardadas');
    await recargar();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card className="px-6 py-2 gap-0 divide-y">
        <OpcionSwitch
          id="opt-negativo"
          titulo="Permitir vender sin stock"
          descripcion="Si está apagado, no se puede vender más de lo que hay. Útil encenderlo si cargás el stock después de vender."
          checked={cfg.permite_stock_negativo}
          onChange={(v) => setCfg((c) => ({ ...c, permite_stock_negativo: v }))}
        />
        <OpcionSwitch
          id="opt-barras"
          titulo="Usar código de barras"
          descripcion="Muestra el campo de código de barras en productos y permite buscar con lector en el punto de venta."
          checked={cfg.usa_codigo_barras}
          onChange={(v) => setCfg((c) => ({ ...c, usa_codigo_barras: v }))}
        />
        <OpcionSwitch
          id="opt-vencimientos"
          titulo="Controlar vencimientos"
          descripcion="Pide la fecha de vencimiento al cargar compras de productos perecederos."
          checked={cfg.usa_vencimientos}
          onChange={(v) => setCfg((c) => ({ ...c, usa_vencimientos: v }))}
        />
        <OpcionSwitch
          id="opt-recetas"
          titulo="Recetas y producción"
          descripcion="Descontar insumos al producir elaborados según su receta."
          checked={cfg.usa_recetas}
          onChange={(v) => setCfg((c) => ({ ...c, usa_recetas: v }))}
          disabled
          extra={<Badge variant="outline" className="text-[10px]">Próximamente</Badge>}
        />
      </Card>

      <Card className="p-6 gap-3">
        <div>
          <h3 className="font-medium">Medios de pago</h3>
          <p className="text-sm text-muted-foreground">Los que aparecen al cobrar en el punto de venta. El efectivo siempre está habilitado.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(MEDIO_PAGO_LABEL) as MedioPago[]).map((m) => (
            <label key={m} htmlFor={`medio-${m}`} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                id={`medio-${m}`}
                checked={m === 'efectivo' || cfg.medios_pago.includes(m)}
                disabled={m === 'efectivo'}
                onCheckedChange={(v) => toggleMedio(m, v === true)}
              />
              {MEDIO_PAGO_LABEL[m]}
            </label>
          ))}
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" disabled={!cambiado || guardando} onClick={() => setCfg(original)}>
          Descartar
        </Button>
        <Button disabled={!cambiado || guardando} onClick={guardar}>
          {guardando ? 'Guardando…' : 'Guardar opciones'}
        </Button>
      </div>
    </div>
  );
}

export default function ConfiguracionPage() {
  return (
    <div className="space-y-6">
      <PageHeader titulo="Configuración" descripcion="Datos del negocio y opciones de funcionamiento" />
      <Tabs defaultValue="datos">
        <TabsList>
          <TabsTrigger value="datos">Datos de la empresa</TabsTrigger>
          <TabsTrigger value="opciones">Opciones</TabsTrigger>
        </TabsList>
        <TabsContent value="datos" className="mt-4">
          <DatosTab />
        </TabsContent>
        <TabsContent value="opciones" className="mt-4">
          <OpcionesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
