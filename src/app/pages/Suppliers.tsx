import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Edit, Trash2, Mail, Phone, MapPin, User, Search, Globe, CreditCard, Building2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Supplier } from '../types';

const VAT_CONDITIONS = [
  'Responsable Inscripto',
  'Monotributista',
  'Exento',
  'No Responsable',
  'Consumidor Final',
];

const SUPPLIER_CATEGORIES = [
  'Ferretería',
  'Electricidad',
  'Plomería',
  'Pinturas',
  'Construcción',
  'Informática',
  'Oficina',
  'Limpieza',
  'Transporte',
  'Servicios',
  'Otro',
];

const PAYMENT_TERMS = ['Contado', '15 días', '30 días', '45 días', '60 días', '90 días'];

type SupplierForm = Omit<Supplier, 'id'>;

const emptyForm = (): SupplierForm => ({
  name: '',
  fantasyName: '',
  cuit: '',
  contact: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  country: 'Argentina',
  postalCode: '',
  website: '',
  vatCondition: '',
  category: '',
  paymentTerm: '30 días',
  bankAlias: '',
  observations: '',
  status: 'active',
});

export default function Suppliers() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier, user } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<SupplierForm>(emptyForm());

  const categories = Array.from(new Set(suppliers.map(s => s.category).filter(Boolean)));

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.fantasyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.cuit || '').includes(searchTerm);

    const matchesCategory = categoryFilter === 'all' || supplier.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || supplier.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.contact || !formData.email) {
      toast.error('Por favor complete los campos obligatorios: Razón Social, Contacto y Email');
      return;
    }

    if (!formData.email.includes('@')) {
      toast.error('Email inválido');
      return;
    }

    if (formData.cuit && !/^\d{2}-\d{7,8}-\d$/.test(formData.cuit) && formData.cuit.length > 0) {
      // Allow any non-empty CUIT for now, just basic check
    }

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, formData);
      toast.success(`Proveedor ${formData.name} actualizado`, { description: `Operador: ${user?.name}` });
    } else {
      addSupplier(formData);
      toast.success(`Proveedor ${formData.name} agregado exitosamente`, { description: `Operador: ${user?.name}` });
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      fantasyName: supplier.fantasyName || '',
      cuit: supplier.cuit || '',
      contact: supplier.contact,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      city: supplier.city || '',
      country: supplier.country || 'Argentina',
      postalCode: supplier.postalCode || '',
      website: supplier.website || '',
      vatCondition: supplier.vatCondition || '',
      category: supplier.category || '',
      paymentTerm: supplier.paymentTerm || '30 días',
      bankAlias: supplier.bankAlias || '',
      observations: supplier.observations || '',
      status: supplier.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (supplier: Supplier) => {
    if (confirm(`¿Está seguro de eliminar al proveedor ${supplier.name}?`)) {
      deleteSupplier(supplier.id);
      toast.success(`Proveedor ${supplier.name} eliminado`, { description: `Operador: ${user?.name}` });
    }
  };

  const resetForm = () => {
    setFormData(emptyForm());
    setEditingSupplier(null);
  };

  const canEdit = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl">Gestión de Proveedores</h1>
          <p className="text-sm text-muted-foreground">Administración de contactos y relaciones comerciales</p>
        </div>
        {canEdit && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Proveedor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" aria-describedby="supplier-dialog-description">
              <DialogHeader>
                <DialogTitle>{editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <span id="supplier-dialog-description" className="sr-only">
                  {editingSupplier ? 'Formulario para editar los datos del proveedor' : 'Formulario para agregar un nuevo proveedor al sistema'}
                </span>

                {/* Datos Empresariales */}
                <div className="border border-border rounded-md p-4 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Datos Empresariales</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Razón Social *</Label>
                      <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Distribuidora Industrial S.A." required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fantasyName">Nombre Fantasía</Label>
                      <Input id="fantasyName" value={formData.fantasyName} onChange={(e) => setFormData({ ...formData, fantasyName: e.target.value })} placeholder="Nombre comercial" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cuit">CUIT</Label>
                      <Input id="cuit" value={formData.cuit} onChange={(e) => setFormData({ ...formData, cuit: e.target.value })} placeholder="20-12345678-9" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vatCondition">Condición IVA</Label>
                      <Select value={formData.vatCondition} onValueChange={(v) => setFormData({ ...formData, vatCondition: v })}>
                        <SelectTrigger id="vatCondition"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                        <SelectContent>
                          {VAT_CONDITIONS.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="supplierCategory">Rubro / Categoría</Label>
                      <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                        <SelectTrigger id="supplierCategory"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                        <SelectContent>
                          {SUPPLIER_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Sitio Web</Label>
                      <Input id="website" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} placeholder="www.empresa.com.ar" />
                    </div>
                  </div>
                </div>

                {/* Contacto */}
                <div className="border border-border rounded-md p-4 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contacto</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact">Nombre de Contacto *</Label>
                      <Input id="contact" value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} placeholder="Juan Pérez" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="contacto@empresa.com" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+54 9 11 1234-5678" />
                  </div>
                </div>

                {/* Ubicación */}
                <div className="border border-border rounded-md p-4 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dirección</p>
                  <div className="space-y-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Av. Corrientes 1234" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Ciudad</Label>
                      <Input id="city" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="Buenos Aires" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Código Postal</Label>
                      <Input id="postalCode" value={formData.postalCode} onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })} placeholder="C1414" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">País</Label>
                      <Input id="country" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} placeholder="Argentina" />
                    </div>
                  </div>
                </div>

                {/* Comercial */}
                <div className="border border-border rounded-md p-4 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Datos Comerciales</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="paymentTerm">Plazo de Pago</Label>
                      <Select value={formData.paymentTerm} onValueChange={(v) => setFormData({ ...formData, paymentTerm: v })}>
                        <SelectTrigger id="paymentTerm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PAYMENT_TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankAlias">CBU / Alias</Label>
                      <Input id="bankAlias" value={formData.bankAlias} onChange={(e) => setFormData({ ...formData, bankAlias: e.target.value })} placeholder="proveedor.empresa.sa" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="observations">Observaciones</Label>
                    <Textarea id="observations" value={formData.observations} onChange={(e) => setFormData({ ...formData, observations: e.target.value })} placeholder="Notas adicionales sobre el proveedor..." rows={3} />
                  </div>
                </div>

                {/* Estado */}
                <div className="border border-border rounded-md p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Estado</p>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="status" value="active" checked={formData.status === 'active'} onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })} className="w-4 h-4" />
                      <span className="text-sm">Activo</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="status" value="inactive" checked={formData.status === 'inactive'} onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })} className="w-4 h-4" />
                      <span className="text-sm">Inactivo</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit">{editingSupplier ? 'Actualizar' : 'Crear'} Proveedor</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por razón social, CUIT, contacto o email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger><SelectValue placeholder="Rubro" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los rubros</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c!}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map(supplier => (
          <Card key={supplier.id} className={`p-5 hover:shadow-lg transition-shadow ${supplier.status === 'inactive' ? 'opacity-70' : ''}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0 mr-2">
                <h3 className="text-base leading-tight mb-0.5 truncate">{supplier.name}</h3>
                {supplier.fantasyName && (
                  <p className="text-xs text-muted-foreground truncate">{supplier.fantasyName}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                    {supplier.status === 'active' ? 'Activo' : 'Inactivo'}
                  </Badge>
                  {supplier.category && (
                    <Badge variant="outline" className="text-xs">{supplier.category}</Badge>
                  )}
                </div>
              </div>
              {canEdit && (
                <div className="flex gap-1 flex-shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(supplier)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(supplier)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2 text-sm border-t border-border pt-3">
              {supplier.cuit && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-xs">CUIT: {supplier.cuit}</span>
                  {supplier.vatCondition && <span className="text-xs text-muted-foreground/70">• {supplier.vatCondition}</span>}
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-xs">{supplier.contact}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                <a href={`mailto:${supplier.email}`} className="text-xs hover:text-primary truncate">{supplier.email}</a>
              </div>
              {supplier.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                  <a href={`tel:${supplier.phone}`} className="text-xs hover:text-primary">{supplier.phone}</a>
                </div>
              )}
              {(supplier.city || supplier.address) && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span className="text-xs leading-tight">
                    {supplier.address}{supplier.city ? `, ${supplier.city}` : ''}{supplier.country && supplier.country !== 'Argentina' ? `, ${supplier.country}` : ''}
                  </span>
                </div>
              )}
              {supplier.website && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-xs truncate">{supplier.website}</span>
                </div>
              )}
              {supplier.paymentTerm && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CreditCard className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-xs">Pago: {supplier.paymentTerm}</span>
                </div>
              )}
              {supplier.observations && (
                <div className="flex items-start gap-2 text-muted-foreground border-t border-border pt-2 mt-2">
                  <FileText className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span className="text-xs leading-tight line-clamp-2">{supplier.observations}</span>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {filteredSuppliers.length === 0 && (
        <Card className="p-12 text-center text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No se encontraron proveedores con los filtros seleccionados</p>
        </Card>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total de Proveedores</p>
          <p className="text-2xl mt-1">{suppliers.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Proveedores Activos</p>
          <p className="text-2xl mt-1 text-success">{suppliers.filter(s => s.status === 'active').length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Proveedores Inactivos</p>
          <p className="text-2xl mt-1 text-muted-foreground">{suppliers.filter(s => s.status === 'inactive').length}</p>
        </Card>
      </div>
    </div>
  );
}
