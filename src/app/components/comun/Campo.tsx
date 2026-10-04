import type { ReactNode } from 'react';
import { Label } from '../ui/label';
import { cn } from '../ui/utils';

/** Label + control + mensaje de error/ayuda. */
export function Campo({
  id,
  label,
  error,
  ayuda,
  requerido,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  ayuda?: ReactNode;
  requerido?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id}>
        {label}
        {requerido && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : ayuda ? (
        <p className="text-xs text-muted-foreground">{ayuda}</p>
      ) : null}
    </div>
  );
}
