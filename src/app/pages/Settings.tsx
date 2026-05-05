import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Settings as SettingsIcon, Users, Warehouse, Bell, Shield } from 'lucide-react';

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Configuración del Sistema</h1>
        <p className="text-sm text-muted-foreground">Administración y configuración general</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg mb-1">Gestión de Usuarios</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Administrar roles, permisos y accesos al sistema
              </p>
              <Button variant="outline">Administrar</Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
              <Warehouse className="w-6 h-6 text-success" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg mb-1">Almacenes</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Configurar ubicaciones y espacios de almacenamiento
              </p>
              <Button variant="outline">Configurar</Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
              <Bell className="w-6 h-6 text-warning" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg mb-1">Notificaciones</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Configurar alertas y notificaciones del sistema
              </p>
              <Button variant="outline">Configurar</Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-destructive" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg mb-1">Seguridad</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Configuración de seguridad y auditoría
              </p>
              <Button variant="outline">Configurar</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
