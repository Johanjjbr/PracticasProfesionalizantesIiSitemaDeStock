import { useState, type FormEvent } from 'react';
import { Check, Pencil, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { mensajeError } from '@/lib/format';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Switch } from '@/app/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { useCategorias, useGuardarCategoria, useProductos } from './api';

export default function CategoriasDialog({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const { data: categorias = [] } = useCategorias();
  const { data: productos = [] } = useProductos();
  const guardar = useGuardarCategoria();
  const [nueva, setNueva] = useState('');
  const [editando, setEditando] = useState<{ id: string; nombre: string } | null>(null);

  const usoPorCategoria = productos.reduce<Record<string, number>>((acc, p) => {
    if (p.categoria_id) acc[p.categoria_id] = (acc[p.categoria_id] ?? 0) + 1;
    return acc;
  }, {});

  const ejecutar = async (accion: Parameters<typeof guardar.mutateAsync>[0], ok: string) => {
    try {
      await guardar.mutateAsync(accion);
      toast.success(ok);
      return true;
    } catch (err) {
      toast.error(mensajeError(err));
      return false;
    }
  };

  const agregar = async (e: FormEvent) => {
    e.preventDefault();
    const nombre = nueva.trim();
    if (nombre.length < 2) return;
    if (await ejecutar({ nombre }, 'Categoría creada')) setNueva('');
  };

  const renombrar = async () => {
    if (!editando) return;
    const nombre = editando.nombre.trim();
    if (nombre.length < 2) return;
    if (await ejecutar({ id: editando.id, nombre }, 'Categoría renombrada')) setEditando(null);
  };

  return (
    <Dialog open={abierto} onOpenChange={(o) => !o && onCerrar()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Categorías</DialogTitle>
          <DialogDescription>
            Las categorías no se borran: desactivalas para que no aparezcan al crear productos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={agregar} className="flex gap-2">
          <Input placeholder="Nueva categoría" value={nueva} onChange={(e) => setNueva(e.target.value)} />
          <Button type="submit" disabled={guardar.isPending || nueva.trim().length < 2}>
            <Plus className="w-4 h-4 mr-1" /> Agregar
          </Button>
        </form>

        <ul className="divide-y border rounded-md">
          {categorias.map((c) => (
            <li key={c.id} className="flex items-center gap-2 px-3 py-2">
              {editando?.id === c.id ? (
                <>
                  <Input
                    autoFocus
                    value={editando.nombre}
                    onChange={(e) => setEditando({ id: c.id, nombre: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void renombrar();
                      }
                      if (e.key === 'Escape') setEditando(null);
                    }}
                    className="h-8"
                  />
                  <Button size="icon" variant="ghost" onClick={() => void renombrar()} aria-label="Guardar">
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditando(null)} aria-label="Cancelar">
                    <X className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <span className={c.activa ? 'flex-1' : 'flex-1 text-muted-foreground line-through'}>{c.nombre}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {usoPorCategoria[c.id] ?? 0} prod.
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setEditando({ id: c.id, nombre: c.nombre })}
                    aria-label={`Renombrar ${c.nombre}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Switch
                    checked={c.activa}
                    aria-label={c.activa ? `Desactivar ${c.nombre}` : `Activar ${c.nombre}`}
                    onCheckedChange={(v) =>
                      void ejecutar({ id: c.id, nombre: c.nombre, activa: v }, v ? 'Categoría activada' : 'Categoría desactivada')
                    }
                  />
                </>
              )}
            </li>
          ))}
          {categorias.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted-foreground">Sin categorías</li>}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
