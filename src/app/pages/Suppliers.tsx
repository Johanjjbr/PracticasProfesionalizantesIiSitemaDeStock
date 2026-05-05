import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Plus, Edit, Trash2, Mail, Phone, MapPin, User, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Supplier } from '../types';

export default function Suppliers() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier, user } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    email: '',
    phone: '',
    address: '',
    status: 'active' as 'active' | 'inactive',
  });

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.contact || !formData.email) {
      toast.error('Por favor complete los campos obligatorios');
      return;
    }

    if (!formData.email.includes('@')) {
      toast.error('Email inválido');
      return;
    }

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, formData);
      toast.success(`Proveedor ${formData.name} actualizado`, {
        description: `Operador: ${user?.name}`,
      });
    } else {
      addSupplier(formData);
      toast.success(`Proveedor ${formData.name} agregado exitosamente`, {
        description: `Operador: ${user?.name}`,
      });
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact: supplier.contact,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      status: supplier.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (supplier: Supplier) => {
    if (confirm(`¿Está seguro de eliminar al proveedor ${supplier.name}?`)) {
      deleteSupplier(supplier.id);
      toast.success(`Proveedor ${supplier.name} eliminado`, {
        description: `Operador: ${user?.name}`,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contact: '',
      email: '',
      phone: '',
      address: '',
      status: 'active',
    });
    setEditingSupplier(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl">Gestión de Proveedores</h1>
          <p className="text-sm text-muted-foreground">Administración de contactos y relaciones comerciales</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Proveedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" aria-describedby="supplier-dialog-description">
            <DialogHeader>
              <DialogTitle>{editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <span id="supplier-dialog-description" className="sr-only">
                {editingSupplier ? 'Formulario para editar los datos del proveedor' : 'Formulario para agregar un nuevo proveedor al sistema'}
              </span>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre de la Empresa *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Distribuidora Industrial S.A."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact">Nombre de Contacto *</Label>
                  <Input
                    id="contact"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    placeholder="Juan Pérez"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contacto@empresa.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1234567890"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Calle Principal 123, Ciudad, País"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={formData.status === 'active'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Activo</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="inactive"
                      checked={formData.status === 'inactive'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Inactivo</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingSupplier ? 'Actualizar' : 'Crear'} Proveedor
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, contacto o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map(supplier => (
          <Card key={supplier.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg mb-1">{supplier.name}</h3>
                <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'}>
                  {supplier.status === 'active' ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(supplier)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(supplier)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4" />
                <span>{supplier.contact}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <a href={`mailto:${supplier.email}`} className="hover:text-primary">
                  {supplier.email}
                </a>
              </div>
              {supplier.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <a href={`tel:${supplier.phone}`} className="hover:text-primary">
                    {supplier.phone}
                  </a>
                </div>
              )}
              {supplier.address && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="text-xs">{supplier.address}</span>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {filteredSuppliers.length === 0 && (
        <Card className="p-12 text-center text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No se encontraron proveedores</p>
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
          <p className="text-2xl mt-1 text-success">
            {suppliers.filter(s => s.status === 'active').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Proveedores Inactivos</p>
          <p className="text-2xl mt-1 text-muted-foreground">
            {suppliers.filter(s => s.status === 'inactive').length}
          </p>
        </Card>
      </div>
    </div>
  );
}
