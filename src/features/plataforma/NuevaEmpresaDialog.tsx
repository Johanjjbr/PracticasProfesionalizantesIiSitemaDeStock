import { useEffect, useState, type FormEvent } from 'react';
import { Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { Database } from '@/lib/database.types';
import { formatFechaCorta, formatMoneda, hoyISO, mensajeError } from '@/lib/format';
import { sumarDias } from '@/lib/fechas';
import { RUBRO_LABEL } from '@/lib/rubros';
import { generarPasswordTemporal } from '@/features/usuarios/api';
import { Campo } from '@/app/components/comun/Campo';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { useCrearEmpresa, usePlanes } from './api';

type Rubro = Database['public']['Enums']['rubro_empresa'];
const SIN_PLAN = '__sin_plan__';

interface Form {
  nombre: string;
  rubro: Rubro;
  plan: string;
  prueba: string; // días de prueba; '' = sin vencimiento
  gracia: string;
  email: string;
  adminNombre: string;
  password: string;
}

const inicial = (): Form => ({
  nombre: '',
  rubro: 'reposteria',
  plan: SIN_PLAN,
  prueba: '15',
  gracia: '7',
  email: '',
  adminNombre: '',
  password: generarPasswordTemporal(),
});

export function NuevaEmpresaDialog({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const planes = usePlanes();
  const crear = useCrearEmpresa();
  const [f, setF] = useState<Form>(inicial);
  const [err, setErr] = useState<Partial<Record<keyof Form, string>>>({});
  const [resultado, setResultado] = useState<{ empresa: string; email: string; password?: string; aviso?: string } | null>(null);

  useEffect(() => {
    if (abierto) {
      setF(inicial());
      setErr({});
      setResultado(null);
    }
  }, [abierto]);

  const dias = f.prueba.trim() === '' ? null : Number(f.prueba);
  const pagadoHasta = dias == null ? null : sumarDias(hoyISO(), dias);
  const planesActivos = (planes.data ?? []).filter((p) => p.activo);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    const e2: typeof err = {};
    if (f.nombre.trim().length < 2) e2.nombre = 'Ingresá el nombre';
    if (dias != null && (!Number.isInteger(dias) || dias < 0 || dias > 365)) e2.prueba = 'Entre 0 y 365 días';
    const gracia = Number(f.gracia);
    if (!Number.isInteger(gracia) || gracia < 0 || gracia > 60) e2.gracia = 'Entre 0 y 60 días';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e2.email = 'Email inválido';
    if (f.password.length < 8 || !/[A-Z]/.test(f.password) || !/\d/.test(f.password))
      e2.password = '8 caracteres, una mayúscula y un número';
    setErr(e2);
    if (Object.keys(e2).length) return;

    try {
      const r = await crear.mutateAsync({
        nombre: f.nombre.trim(),
        rubro: f.rubro,
        plan_id: f.plan === SIN_PLAN ? null : f.plan,
        pagado_hasta: pagadoHasta,
        dias_gracia: gracia,
        admin: { email: f.email.trim().toLowerCase(), nombre: f.adminNombre.trim(), password: f.password },
      });
      toast.success(`Empresa ${f.nombre.trim()} creada`);
      setResultado({
        empresa: f.nombre.trim(),
        email: f.email.trim().toLowerCase(),
        password: r.accion === 'creado' ? f.password : undefined,
        aviso:
          r.errorAdmin
            ? `La empresa se creó, pero no se pudo crear el administrador: ${r.errorAdmin}. Podés agregarlo entrando a la empresa → Usuarios.`
            : r.accion === 'agregado'
              ? 'Ese email ya tenía cuenta: se lo agregó como administrador y entra con su contraseña de siempre.'
              : undefined,
      });
    } catch (e) {
      toast.error(mensajeError(e));
    }
  };

  const copiar = async () => {
    if (!resultado) return;
    const texto = `Empresa: ${resultado.empresa}\nIngreso: ${window.location.origin}\nUsuario: ${resultado.email}${
      resultado.password ? `\nContraseña temporal: ${resultado.password}` : ''
    }`;
    try {
      await navigator.clipboard.writeText(texto);
      toast.success('Datos copiados');
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  return (
    <Dialog open={abierto} onOpenChange={(o) => !o && onCerrar()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nueva empresa</DialogTitle>
          <DialogDescription>Se crea con las categorías típicas del rubro y su usuario administrador.</DialogDescription>
        </DialogHeader>

        {resultado ? (
          <div className="space-y-4">
            {resultado.aviso && <p className="text-sm rounded-md bg-amber-50 dark:bg-amber-950 p-3">{resultado.aviso}</p>}
            <div className="rounded-md border p-4 font-mono text-sm space-y-1">
              <p>Empresa: {resultado.empresa}</p>
              <p>Ingreso: {window.location.origin}</p>
              <p>Usuario: {resultado.email}</p>
              {resultado.password && <p>Contraseña temporal: {resultado.password}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={copiar}>
                <Copy className="w-4 h-4 mr-2" />
                Copiar
              </Button>
              <Button onClick={onCerrar}>Listo</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={enviar} className="space-y-5" noValidate>
            <fieldset className="grid gap-4 sm:grid-cols-2">
              <legend className="text-sm font-medium mb-2">Empresa</legend>
              <Campo id="ne-nombre" label="Nombre" requerido error={err.nombre}>
                <Input id="ne-nombre" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} maxLength={120} autoFocus />
              </Campo>
              <Campo id="ne-rubro" label="Rubro">
                <Select value={f.rubro} onValueChange={(v) => setF({ ...f, rubro: v as Rubro })}>
                  <SelectTrigger id="ne-rubro">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(RUBRO_LABEL) as Rubro[]).map((r) => (
                      <SelectItem key={r} value={r}>
                        {RUBRO_LABEL[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Campo>
              <Campo id="ne-plan" label="Plan">
                <Select value={f.plan} onValueChange={(v) => setF({ ...f, plan: v })}>
                  <SelectTrigger id="ne-plan">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SIN_PLAN}>Sin plan (sin límites)</SelectItem>
                    {planesActivos.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre} · {formatMoneda(p.precio_mensual)}/mes
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Campo>
              <div className="grid grid-cols-2 gap-3">
                <Campo
                  id="ne-prueba"
                  label="Días de prueba"
                  error={err.prueba}
                  ayuda={pagadoHasta ? `Hasta el ${formatFechaCorta(pagadoHasta)}` : 'Vacío = sin vencimiento'}
                >
                  <Input id="ne-prueba" inputMode="numeric" value={f.prueba} onChange={(e) => setF({ ...f, prueba: e.target.value })} />
                </Campo>
                <Campo id="ne-gracia" label="Días de gracia" error={err.gracia}>
                  <Input id="ne-gracia" inputMode="numeric" value={f.gracia} onChange={(e) => setF({ ...f, gracia: e.target.value })} />
                </Campo>
              </div>
            </fieldset>

            <fieldset className="grid gap-4 sm:grid-cols-2">
              <legend className="text-sm font-medium mb-2">Administrador de la empresa</legend>
              <Campo id="ne-email" label="Email" requerido error={err.email}>
                <Input id="ne-email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
              </Campo>
              <Campo id="ne-admin" label="Nombre">
                <Input id="ne-admin" value={f.adminNombre} onChange={(e) => setF({ ...f, adminNombre: e.target.value })} />
              </Campo>
              <Campo
                id="ne-pass"
                label="Contraseña temporal"
                error={err.password}
                ayuda="Si el email ya tiene cuenta, se usa su contraseña actual"
                className="sm:col-span-2"
              >
                <div className="flex gap-2">
                  <Input id="ne-pass" className="font-mono" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
                  <Button
                    type="button"
                    variant="outline"
                    aria-label="Generar otra contraseña"
                    onClick={() => setF({ ...f, password: generarPasswordTemporal() })}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </Campo>
            </fieldset>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onCerrar}>
                Cancelar
              </Button>
              <Button type="submit" disabled={crear.isPending}>
                {crear.isPending ? 'Creando…' : 'Crear empresa'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
