import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import PuntoDeVenta from './PuntoDeVenta';
import HistorialVentas from './HistorialVentas';

export default function VentasPage() {
  const [tab, setTab] = useState('pos');
  return (
    <Tabs value={tab} onValueChange={setTab} className="space-y-4">
      <TabsList>
        <TabsTrigger value="pos">Punto de venta</TabsTrigger>
        <TabsTrigger value="historial">Historial</TabsTrigger>
      </TabsList>
      <TabsContent value="pos">
        <PuntoDeVenta />
      </TabsContent>
      <TabsContent value="historial">
        <HistorialVentas />
      </TabsContent>
    </Tabs>
  );
}
