import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Search, Plus, FileDown, Filter, Edit, Trash2, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { Product } from '../types';

export default function Inventory() {
  const { products, addProduct, updateProduct, deleteProduct, user } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: '',
    warehouse: '',
    currentStock: 0,
    minStock: 0,
    unitPrice: 0,
  });

  // Get unique values for filters
  const categories = Array.from(new Set(products.map(p => p.category)));
  const warehouses = Array.from(new Set(products.map(p => p.warehouse)));

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesWarehouse = warehouseFilter === 'all' || product.warehouse === warehouseFilter;
    
    const matchesStock = 
      stockFilter === 'all' ? true :
      stockFilter === 'critical' ? product.currentStock < product.minStock :
      stockFilter === 'low' ? product.currentStock < product.minStock * 1.5 && product.currentStock >= product.minStock :
      product.currentStock >= product.minStock * 1.5;

    return matchesSearch && matchesCategory && matchesWarehouse && matchesStock;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.sku || !formData.name || !formData.category || !formData.warehouse) {
      toast.error('Por favor complete todos los campos obligatorios');
      return;
    }

    if (editingProduct) {
      updateProduct(editingProduct.id, formData);
      toast.success(`Producto ${formData.name} actualizado correctamente`, {
        description: `Operador: ${user?.name}`,
      });
    } else {
      addProduct(formData);
      toast.success(`Producto ${formData.name} agregado correctamente`, {
        description: `Operador: ${user?.name}`,
      });
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku,
      name: product.name,
      category: product.category,
      warehouse: product.warehouse,
      currentStock: product.currentStock,
      minStock: product.minStock,
      unitPrice: product.unitPrice,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (product: Product) => {
    if (confirm(`¿Está seguro de eliminar el producto ${product.name}?`)) {
      deleteProduct(product.id);
      toast.success(`Producto ${product.name} eliminado`, {
        description: `Operador: ${user?.name}`,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      sku: '',
      name: '',
      category: '',
      warehouse: '',
      currentStock: 0,
      minStock: 0,
      unitPrice: 0,
    });
    setEditingProduct(null);
  };

  const exportToCSV = () => {
    const headers = ['SKU', 'Nombre', 'Categoría', 'Almacén', 'Stock Actual', 'Stock Mínimo', 'Precio Unitario'];
    const rows = filteredProducts.map(p => [
      p.sku, p.name, p.category, p.warehouse, p.currentStock, p.minStock, p.unitPrice
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventario_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast.success('Archivo CSV exportado correctamente', {
      description: `Operador: ${user?.name}`,
    });
  };

  const exportToPDF = () => {
    toast.success('Exportando a PDF...', {
      description: 'Funcionalidad en desarrollo',
    });
  };

  const exportToSheets = () => {
    toast.success('Exportando a Google Sheets...', {
      description: 'Funcionalidad en desarrollo',
    });
  };

  const canEdit = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl">Gestión de Inventario</h1>
          <p className="text-sm text-muted-foreground">Control y administración de productos</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <FileDown className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportToCSV}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Exportar CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToPDF}>
                <FileDown className="w-4 h-4 mr-2" />
                Exportar PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToSheets}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Exportar a Sheets
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {canEdit && (
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Producto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4" aria-describedby="product-form-description">
                  <span id="product-form-description" className="sr-only">
                    {editingProduct ? 'Formulario para editar los datos del producto existente' : 'Formulario para agregar un nuevo producto al inventario'}
                  </span>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sku">SKU *</Label>
                      <Input
                        id="sku"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        placeholder="SKU-001"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre del Producto *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Nombre del producto"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoría *</Label>
                      <Input
                        id="category"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="Ferretería, Electricidad, etc."
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="warehouse">Almacén *</Label>
                      <Input
                        id="warehouse"
                        value={formData.warehouse}
                        onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                        placeholder="Almacén Central, Norte, etc."
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentStock">Stock Actual</Label>
                      <Input
                        id="currentStock"
                        type="number"
                        value={formData.currentStock}
                        onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value) })}
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minStock">Stock Mínimo</Label>
                      <Input
                        id="minStock"
                        type="number"
                        value={formData.minStock}
                        onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unitPrice">Precio Unitario ($)</Label>
                      <Input
                        id="unitPrice"
                        type="number"
                        step="0.01"
                        value={formData.unitPrice}
                        onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingProduct ? 'Actualizar' : 'Crear'} Producto
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por SKU o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Almacén" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los almacenes</SelectItem>
              {warehouses.map(wh => (
                <SelectItem key={wh} value={wh}>{wh}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Estado de Stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="critical">Crítico (bajo mínimo)</SelectItem>
              <SelectItem value="low">Bajo</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Products Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left py-3 px-4 text-sm">SKU</th>
                <th className="text-left py-3 px-4 text-sm">Producto</th>
                <th className="text-left py-3 px-4 text-sm">Categoría</th>
                <th className="text-left py-3 px-4 text-sm">Almacén</th>
                <th className="text-left py-3 px-4 text-sm">Stock</th>
                <th className="text-left py-3 px-4 text-sm">Stock vs Mínimo</th>
                <th className="text-left py-3 px-4 text-sm">Precio Unit.</th>
                <th className="text-left py-3 px-4 text-sm">Valor Total</th>
                {canEdit && <th className="text-left py-3 px-4 text-sm">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const isCritical = product.currentStock < product.minStock;
                const percentage = (product.currentStock / product.minStock) * 100;
                const totalValue = product.currentStock * product.unitPrice;

                return (
                  <tr key={product.id} className="border-b border-border hover:bg-accent/50">
                    <td className="py-3 px-4">
                      <code className="text-xs bg-muted px-2 py-1 rounded">{product.sku}</code>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {isCritical && <AlertTriangle className="w-4 h-4 text-destructive" />}
                        <span className="text-sm">{product.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">{product.category}</Badge>
                    </td>
                    <td className="py-3 px-4 text-sm">{product.warehouse}</td>
                    <td className="py-3 px-4">
                      <span className={isCritical ? 'text-destructive' : 'text-sm'}>
                        {product.currentStock}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span>{product.currentStock}</span>
                          <span className="text-muted-foreground">/</span>
                          <span>{product.minStock}</span>
                        </div>
                        <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isCritical ? 'bg-destructive' : percentage < 150 ? 'bg-warning' : 'bg-success'
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">${product.unitPrice.toFixed(2)}</td>
                    <td className="py-3 px-4 text-sm">${totalValue.toFixed(2)}</td>
                    {canEdit && (
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(product)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Filter className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No se encontraron productos con los filtros seleccionados</p>
          </div>
        )}
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total de Productos</p>
          <p className="text-2xl mt-1">{filteredProducts.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Valor Total Filtrado</p>
          <p className="text-2xl mt-1">
            ${filteredProducts.reduce((sum, p) => sum + (p.currentStock * p.unitPrice), 0).toFixed(2)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Productos Críticos</p>
          <p className="text-2xl mt-1 text-destructive">
            {filteredProducts.filter(p => p.currentStock < p.minStock).length}
          </p>
        </Card>
      </div>
    </div>
  );
}