import { Loader2 } from 'lucide-react';
import { mensajeError } from '@/lib/format';

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
      <Loader2 className="w-4 h-4 animate-spin" /> {texto}
    </div>
  );
}

export function ErrorCarga({ error }: { error: unknown }) {
  return <p className="text-destructive py-8 text-center">Error al cargar datos: {mensajeError(error)}</p>;
}
