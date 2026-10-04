import { useState, type FormEvent } from 'react';
import { Copy, RefreshCw, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/auth/AuthProvider';
import { ROL_LABEL, type Rol } from '@/auth/permisos';
import { mensajeError } from '@/lib/format';
import { PageHeader } from '@/app/components/comun/PageHeader';
import { Cargando, ErrorCarga } from '@/app/components/comun/Estados';
import { Campo } from '@/app/components/comun/Campo';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Switch } from '@/app/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
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
import {
  type AltaUsuario,
  type Miembro,
  generarPasswordTemporal,
  useActualizarMiembro,
  useAgregarUsuario,
  useMiembros,
  useQuitarMiembro,
} from './api';

const DESCRIPCION_ROL: Record<Rol, string> = {
  admin: 'Todo, incluidos usuarios y configuración',
  encargado: 'Productos, compras, stock, ventas, caja y reportes',
  vendedor: 'Vender y manejar su propia caja',
  consulta: 'Solo mirar: productos, movimientos y reportes',
};

function AgregarUsuarioDialog({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const agregar = useAgregarUsuario();
  const [form, setForm] = useState<AltaUsuario>({ email: '', nombre: '', rol: 'vendedor', modo: 'password', password: generarPasswordTemporal() });
  const [error, setError] = useState<{ email?: string; password?: string }>({});
  const [resultado, setResultado] = useState<{ texto: string; password?: string } | null>(null);

  const cerrar = () => {
    if (agregar.isPending) return;
    setForm({ email: '', nombre: '', rol: 'vendedor', modo: 'password', password: generarPasswordTemporal() });
    setError({});
    setResultado(null);
    onCerrar();
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errores: typeof error = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errores.email = 'Email inválido';
    if (form.modo === 'password' && !/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.password ?? ''))
      errores.password = 'Mínimo 8 caracteres, una mayúscula y un número';
    setError(errores);
    if (Object.keys(errores).length) return;
    try {
      const r = await agregar.mutateAsync({ ...form, email: form.email.trim().toLowerCase(), nombre: form.nombre.trim() });
      if (r.accion === 'creado') {
        setResultado({ texto: `Usuario creado. Pasale estos datos para que ingrese (después puede cambiar la contraseña desde "Mi cuenta"):`, password: form.password });
      } else if (r.accion === 'invitado') {
        setResultado({ texto: `Le enviamos una invitación a ${form.email}. Al abrir el link va a poder crear su contraseña.` });
      } else {
        setResultado({ texto: `${form.email} ya tenía cuenta: lo agregamos a la empresa como ${ROL_LABEL[form.rol]}. Ingresa con su contraseña de siempre.` });
      }
    } catch (err) {
      toast.error(mensajeError(err));
    }
  };

  return (
    <Dialog open={abierto} onOpenChange={(o) => !o && cerrar()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Agregar usuario</DialogTitle>
          <DialogDescription>La persona va a poder ingresar a esta empresa con el rol que elijas.</DialogDescription>
        </DialogHeader>
        {resultado ? (
          <div className="space-y-3 text-sm">
            <p>{resultado.texto}</p>
            {resultado.password && (
              <div className="rounded-md bg-muted p-3 font-mono text-sm space-y-1">
                <div>Email: {form.email.trim().toLowerCase()}</div>
                <div className="flex items-center justify-between gap-2">
                  <span>Contraseña: {resultado.password}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      void navigator.clipboard?.writeText(`Email: ${form.email.trim().toLowerCase()}\nContraseña: ${resultado.password}`);
                      toast.success('Copiado');
                    }}
                  >
                    <Copy className="w-4 h-4 mr-1" /> Copiar
                  </Button>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={cerrar}>Listo</Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <form id="form-usuario" onSubmit={onSubmit} className="space-y-4" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Campo id="u-email" label="Email" requerido error={error.email}>
                  <Input id="u-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoFocus />
                </Campo>
                <Campo id="u-nombre" label="Nombre">
                  <Input id="u-nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
                </Campo>
              </div>
              <Campo id="u-rol" label="Rol" ayuda={DESCRIPCION_ROL[form.rol]}>
                <Select value={form.rol} onValueChange={(v) => setForm({ ...form, rol: v as Rol })}>
                  <SelectTrigger id="u-rol">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ROL_LABEL) as Rol[]).map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROL_LABEL[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Campo>
              <div className="space-y-2">
                <Label>Cómo ingresa</Label>
                <RadioGroup value={form.modo} onValueChange={(v) => setForm({ ...form, modo: v as AltaUsuario['modo'] })}>
                  <div className="flex items-start gap-2">
                    <RadioGroupItem value="password" id="modo-password" className="mt-0.5" />
                    <Label htmlFor="modo-password" className="font-normal leading-snug">
                      Crear con contraseña temporal
                      <span className="block text-xs text-muted-foreground">Se la pasás vos. Funciona aunque no esté configurado el envío de emails.</span>
                    </Label>
                  </div>
                  <div className="flex items-start gap-2">
                    <RadioGroupItem value="invitar" id="modo-invitar" className="mt-0.5" />
                    <Label htmlFor="modo-invitar" className="font-normal leading-snug">
                      Enviar invitación por email
                      <span className="block text-xs text-muted-foreground">Recibe un link para crear su contraseña.</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              {form.modo === 'password' && (
                <Campo id="u-password" label="Contraseña temporal" error={error.password}>
                  <div className="flex gap-2">
                    <Input id="u-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="font-mono" />
                    <Button type="button" variant="outline" size="icon" onClick={() => setForm({ ...form, password: generarPasswordTemporal() })} aria-label="Generar otra">
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </Campo>
              )}
              <p className="text-xs text-muted-foreground">Si el email ya tiene cuenta (por ejemplo, en otra empresa), solo se lo agrega a esta.</p>
            </form>
            <DialogFooter>
              <Button variant="outline" onClick={cerrar} disabled={agregar.isPending}>
                Cancelar
              </Button>
              <Button type="submit" form="form-usuario" disabled={agregar.isPending}>
                {agregar.isPending ? 'Agregando…' : 'Agregar usuario'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function UsuariosPage() {
  const { session } = useAuth();
  const { data: miembros, isLoading, error } = useMiembros();
  const actualizar = useActualizarMiembro();
  const quitar = useQuitarMiembro();
  const [agregando, setAgregando] = useState(false);
  const [aQuitar, setAQuitar] = useState<Miembro | null>(null);
  const yo = session?.user.id;

  const cambiar = async (m: Miembro, cambios: { rol?: Rol; activo?: boolean }, ok: string) => {
    try {
      await actualizar.mutateAsync({ usuarioId: m.usuario_id, cambios });
      toast.success(ok);
    } catch (err) {
      toast.error(mensajeError(err));
    }
  };

  if (isLoading) return <Cargando />;
  if (error) return <ErrorCarga error={error} />;

  const activos = (miembros ?? []).filter((m) => m.activo).length;

  return (
    <div className="space-y-4">
      <PageHeader
        titulo="Usuarios"
        descripcion={`${activos} activos de ${miembros?.length ?? 0}`}
        acciones={
          <Button onClick={() => setAgregando(true)}>
            <UserPlus className="w-4 h-4 mr-2" /> Agregar usuario
          </Button>
        }
      />
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead className="w-56">Rol</TableHead>
              <TableHead className="w-28">Activo</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(miembros ?? []).map((m) => {
              const esYo = m.usuario_id === yo;
              const nombre = m.perfil?.nombre || m.perfil?.email || 'Usuario';
              return (
                <TableRow key={m.usuario_id} className={m.activo ? '' : 'opacity-60'}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{nombre}</span>
                      {esYo && <Badge variant="secondary" className="text-[10px]">Vos</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{m.perfil?.email}</p>
                  </TableCell>
                  <TableCell>
                    <Select value={m.rol} onValueChange={(v) => void cambiar(m, { rol: v as Rol }, `${nombre} ahora es ${ROL_LABEL[v as Rol]}`)}>
                      <SelectTrigger className="h-8" aria-label={`Rol de ${nombre}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(ROL_LABEL) as Rol[]).map((r) => (
                          <SelectItem key={r} value={r}>
                            {ROL_LABEL[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={m.activo}
                      aria-label={m.activo ? `Desactivar a ${nombre}` : `Activar a ${nombre}`}
                      onCheckedChange={(v) => void cambiar(m, { activo: v }, v ? `${nombre} activado` : `${nombre} desactivado: ya no puede ingresar a la empresa`)}
                    />
                  </TableCell>
                  <TableCell>
                    {!esYo && (
                      <Button variant="ghost" size="icon" onClick={() => setAQuitar(m)} aria-label={`Quitar a ${nombre}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
      <Card className="p-4 text-sm text-muted-foreground gap-1">
        {(Object.keys(DESCRIPCION_ROL) as Rol[]).map((r) => (
          <p key={r}>
            <strong className="text-foreground">{ROL_LABEL[r]}:</strong> {DESCRIPCION_ROL[r]}.
          </p>
        ))}
        <p className="pt-1">La empresa siempre tiene que tener al menos un administrador activo.</p>
      </Card>

      <AgregarUsuarioDialog abierto={agregando} onCerrar={() => setAgregando(false)} />

      <AlertDialog open={!!aQuitar} onOpenChange={(o) => !o && setAQuitar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Quitar a {aQuitar?.perfil?.nombre || aQuitar?.perfil?.email} de la empresa?</AlertDialogTitle>
            <AlertDialogDescription>
              Ya no va a poder ingresar a esta empresa. Su historial (ventas, cajas, movimientos) se conserva. Si solo querés suspenderlo,
              desactivalo en lugar de quitarlo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!aQuitar) return;
                try {
                  await quitar.mutateAsync(aQuitar.usuario_id);
                  toast.success('Usuario quitado de la empresa');
                } catch (err) {
                  toast.error(mensajeError(err));
                }
                setAQuitar(null);
              }}
            >
              Quitar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
