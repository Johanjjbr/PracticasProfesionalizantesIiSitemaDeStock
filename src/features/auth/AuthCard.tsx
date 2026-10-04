import type { ReactNode } from 'react';
import { Store } from 'lucide-react';
import { Card } from '@/app/components/ui/card';

export function AuthCard({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent p-4">
      <Card className="w-full max-w-md p-8 shadow-xl">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mb-4">
            <Store className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl text-foreground">{titulo}</h1>
          {subtitulo && <p className="text-sm text-muted-foreground mt-1">{subtitulo}</p>}
        </div>
        {children}
      </Card>
    </div>
  );
}

export function MensajeError({ texto }: { texto: string }) {
  return (
    <div role="alert" className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-sm">
      {texto}
    </div>
  );
}
