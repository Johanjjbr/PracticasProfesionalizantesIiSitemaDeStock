import { useState } from 'react';
import { PageHeader } from '@/app/components/comun/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import NuevoAjuste from './NuevoAjuste';
import HistorialAjustes from './HistorialAjustes';

export default function AjustesPage() {
  const [tab, setTab] = useState('nuevo');
  return (
    <div className="space-y-4">
      <PageHeader
        titulo="Ajuste de inventario"
        descripcion="Corregí el stock por roturas, mermas o vencimientos, o registrá un conteo físico."
      />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="nuevo">Nuevo ajuste</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>
        <TabsContent value="nuevo" className="mt-4">
          <NuevoAjuste onRegistrado={() => setTab('historial')} />
        </TabsContent>
        <TabsContent value="historial" className="mt-4">
          <HistorialAjustes />
        </TabsContent>
      </Tabs>
    </div>
  );
}
