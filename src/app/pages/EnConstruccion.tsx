import { Construction } from 'lucide-react';
import { Card } from '../components/ui/card';

export default function EnConstruccion({ titulo, fase }: { titulo: string; fase?: number }) {
  return (
    <Card className="p-12 flex flex-col items-center text-center gap-3 text-muted-foreground">
      <Construction className="w-10 h-10" />
      <h1 className="text-xl text-foreground">{titulo}</h1>
      <p className="text-sm">
        Este módulo todavía no está implementado{fase ? ` (Fase ${fase} del plan)` : ''}.
      </p>
    </Card>
  );
}
