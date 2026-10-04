import { useMemo, useState } from 'react';
import { Download, Mail, MoreHorizontal, Pencil, Phone, Plus, Power, Search, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { mensajeError } from '@/lib/format';
import { descargarCsv, fechaArchivo } from '@/lib/csv';
import { PageHeader } from '@/app/components/comun/PageHeader';
import { Cargando, ErrorCarga } from '@/app/components/comun/Estados';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { type Proveedor, useGuardarProveedor, useProveedores } from './api';
import ProveedorFormDialog from './ProveedorFormDialog';

type Estado = 'activos' | 'inactivos' | 'todos';

const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function ProveedoresPage() {
  const { data: proveedores, isLoading, error } = useProveedores();
  const guardar = useGuardarProveedor();
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState<Estado>('activos');
  const [dialogo, setDialogo] = useState<{ abierto: boolean; proveedor: Proveedor | null }>({
    abierto: false,
    proveedor: null,
  });

  const filtrados = useMemo(() => {
    const q = normalizar(busqueda.trim());
    const qDigitos = busqueda.replace(/\D/g, '');
    return (proveedores ?? []).filter((p) => {
      if (estado === 'activos' && !p.activo) return false;
      if (estado === 'inactivos' && p.activo) return false;
      if (!q) return true;
      const texto = normalizar(`${p.razon_social} ${p.nombre_fantasia ?? ''} ${p.contacto ?? ''} ${p.email ?? ''} ${p.ciudad ?? ''}`);
      return texto.includes(q) || (qDigitos.length >= 3 && (p.cuit ?? '').replace(/\D/g, '').includes(qDigitos));
    });
  }, [proveedores, busqueda, estado]);

  const alternarActivo = async (p: Proveedor) => {
    try {
      await guardar.mutateAsync({ id: p.id, datos: { razon_social: p.razon_social, activo: !p.activo } });
      toast.success(p.activo ? `"${p.razon_social}" desactivado` : `"${p.razon_social}" activado`);
    } catch (err) {
      toast.error(mensajeError(err));
    }
  };

  const exportar = () =>
    descargarCsv(`proveedores-${fechaArchivo()}`, filtrados, [
      { titulo: 'Razón social', valor: (p) => p.razon_social },
      { titulo: 'Nombre de fantasía', valor: (p) => p.nombre_fantasia },
      { titulo: 'CUIT', valor: (p) => p.cuit },
      { titulo: 'Condición IVA', valor: (p) => p.condicion_iva },
      { titulo: 'Contacto', valor: (p) => p.contacto },
      { titulo: 'Teléfono', valor: (p) => p.telefono },
      { titulo: 'Email', valor: (p) => p.email },
      { titulo: 'Dirección', valor: (p) => p.direccion },
      { titulo: 'Ciudad', valor: (p) => p.ciudad },
      { titulo: 'Condición de pago', valor: (p) => p.condicion_pago },
      { titulo: 'Alias/CBU', valor: (p) => p.alias_cbu },
      { titulo: 'Activo', valor: (p) => (p.activo ? 'Sí' : 'No') },
    ]);

  if (isLoading) return <Cargando />;
  if (error) return <ErrorCarga error={error} />;

  return (
    <div className="space-y-4">
      <PageHeader
        titulo="Proveedores"
        descripcion={`${filtrados.length} de ${proveedores?.length ?? 0} proveedores`}
        acciones={
          <>
            <Button variant="outline" onClick={exportar} disabled={filtrados.length === 0}>
              <Download className="w-4 h-4 mr-2" /> Exportar CSV
            </Button>
            <Button onClick={() => setDialogo({ abierto: true, proveedor: null })}>
              <Plus className="w-4 h-4 mr-2" /> Nuevo proveedor
            </Button>
          </>
        }
      />

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, CUIT, contacto, email o ciudad"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9"
              aria-label="Buscar proveedores"
            />
          </div>
          <Select value={estado} onValueChange={(v) => setEstado(v as Estado)}>
            <SelectTrigger className="md:w-40" aria-label="Filtrar por estado">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="activos">Activos</SelectItem>
              <SelectItem value="inactivos">Inactivos</SelectItem>
              <SelectItem value="todos">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proveedor</TableHead>
              <TableHead className="hidden md:table-cell">CUIT</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead className="hidden lg:table-cell">Ciudad</TableHead>
              <TableHead className="hidden lg:table-cell">Pago</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.map((p) => (
              <TableRow key={p.id} className={p.activo ? '' : 'opacity-60'}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>{p.razon_social}</span>
                    {!p.activo && (
                      <Badge variant="secondary" className="text-[10px]">
                        Inactivo
                      </Badge>
                    )}
                  </div>
                  {p.nombre_fantasia && <p className="text-xs text-muted-foreground">{p.nombre_fantasia}</p>}
                </TableCell>
                <TableCell className="hidden md:table-cell font-mono text-xs">
                  {p.cuit ?? '—'}
                  {p.condicion_iva && <p className="font-sans text-muted-foreground">{p.condicion_iva}</p>}
                </TableCell>
                <TableCell className="text-sm">
                  {p.contacto && <p>{p.contacto}</p>}
                  <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    {p.telefono && (
                      <a href={`tel:${p.telefono.replace(/\s/g, '')}`} className="inline-flex items-center gap-1 hover:underline">
                        <Phone className="w-3 h-3" /> {p.telefono}
                      </a>
                    )}
                    {p.email && (
                      <a href={`mailto:${p.email}`} className="inline-flex items-center gap-1 hover:underline">
                        <Mail className="w-3 h-3" /> {p.email}
                      </a>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">{p.ciudad ?? '—'}</TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">{p.condicion_pago ?? '—'}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label={`Acciones para ${p.razon_social}`}>
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setDialogo({ abierto: true, proveedor: p })}>
                        <Pencil className="w-4 h-4 mr-2" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/compras?proveedor=${p.id}`)}>
                        <ShoppingBag className="w-4 h-4 mr-2" /> Ver compras
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => void alternarActivo(p)}>
                        <Power className="w-4 h-4 mr-2" /> {p.activo ? 'Desactivar' : 'Activar'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filtrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                  {proveedores?.length ? 'Ningún proveedor coincide con la búsqueda.' : 'Todavía no hay proveedores cargados.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <ProveedorFormDialog
        abierto={dialogo.abierto}
        proveedor={dialogo.proveedor}
        onCerrar={() => setDialogo({ abierto: false, proveedor: null })}
      />
    </div>
  );
}
