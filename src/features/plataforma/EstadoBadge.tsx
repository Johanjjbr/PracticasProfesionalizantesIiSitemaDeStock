import { Badge } from '@/app/components/ui/badge';
import { cn } from '@/app/components/ui/utils';
import { ESTADO_LABEL, type EstadoSuscripcion } from '@/lib/suscripcion';

const ESTILO: Record<EstadoSuscripcion, string> = {
  activa: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-transparent',
  gracia: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border-transparent',
  vencida: 'bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-300 border-transparent',
  suspendida: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-transparent',
  baja: 'bg-muted text-muted-foreground border-transparent',
};

export function EstadoBadge({ estado, sinVencimiento }: { estado: string; sinVencimiento?: boolean }) {
  const e = (estado in ESTADO_LABEL ? estado : 'activa') as EstadoSuscripcion;
  return (
    <Badge variant="outline" className={cn('font-normal', ESTILO[e])}>
      {e === 'activa' && sinVencimiento ? 'Sin vencimiento' : ESTADO_LABEL[e]}
    </Badge>
  );
}
