import { useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Lock, Wallet } from 'lucide-react';
import { formatFecha, formatMoneda } from '@/lib/format';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { MEDIO_PAGO_LABEL, ORIGEN_LABEL, type SesionCaja, type TipoMovCaja, resumirCaja } from './api';
import { CerrarCajaDialog, MovimientoCajaDialog } from './dialogos';

function Dato({ titulo, valor, detalle, destacado }: { titulo: string; valor: string; detalle?: string; destacado?: boolean }) {
  return (
    <Card className={`p-4 ${destacado ? 'border-primary/50 bg-primary/5' : ''}`}>
      <p className="text-xs text-muted-foreground">{titulo}</p>
      <p className="text-2xl mt-1 tabular-nums">{valor}</p>
      {detalle && <p className="text-xs text-muted-foreground mt-0.5">{detalle}</p>}
    </Card>
  );
}

/** Muestra una sesión de caja. Si `editable`, permite movimientos y cierre. */
export default function PanelCaja({ sesion, editable }: { sesion: SesionCaja; editable: boolean }) {
  const [movimiento, setMovimiento] = useState<TipoMovCaja | null>(null);
  const [cerrando, setCerrando] = useState(false);
  const r = resumirCaja(Number(sesion.monto_inicial), sesion.movimientos);
  const abierta = sesion.estado === 'abierta';

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium flex items-center gap-2">
              Caja #{sesion.numero}
              {abierta ? <Badge className="bg-green-600 hover:bg-green-600">Abierta</Badge> : <Badge variant="secondary">Cerrada</Badge>}
            </p>
            <p className="text-sm text-muted-foreground">
              {sesion.usuario?.nombre ?? sesion.usuario?.email} · abierta {formatFecha(sesion.apertura_at)}
              {sesion.cierre_at && ` · cerrada ${formatFecha(sesion.cierre_at)}`}
            </p>
          </div>
        </div>
        {editable && abierta && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setMovimiento('ingreso')}>
              <ArrowDownCircle className="w-4 h-4 mr-2 text-green-600" /> Ingreso
            </Button>
            <Button variant="outline" onClick={() => setMovimiento('egreso')}>
              <ArrowUpCircle className="w-4 h-4 mr-2 text-destructive" /> Egreso / retiro
            </Button>
            <Button onClick={() => setCerrando(true)}>
              <Lock className="w-4 h-4 mr-2" /> Cerrar caja
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Dato titulo="Monto inicial" valor={formatMoneda(sesion.monto_inicial)} detalle={sesion.obs_apertura ?? undefined} />
        <Dato titulo="Ingresos en efectivo" valor={formatMoneda(r.ingresosEfectivo)} />
        <Dato titulo="Egresos en efectivo" valor={formatMoneda(r.egresosEfectivo)} />
        {abierta ? (
          <Dato titulo="Efectivo que debería haber" valor={formatMoneda(r.efectivoEsperado)} destacado />
        ) : (
          <Dato
            titulo="Arqueo"
            valor={formatMoneda(sesion.efectivo_contado)}
            detalle={`Esperado ${formatMoneda(sesion.efectivo_esperado)} · ${
              Number(sesion.diferencia) === 0
                ? 'sin diferencias'
                : `${Number(sesion.diferencia) > 0 ? 'sobrante' : 'faltante'} ${formatMoneda(Math.abs(Number(sesion.diferencia)))}`
            }`}
            destacado
          />
        )}
      </div>

      {!abierta && sesion.obs_cierre && (
        <p className="text-sm">
          <span className="text-muted-foreground">Observaciones del cierre: </span>
          {sesion.obs_cierre}
          {sesion.cerrador && <span className="text-muted-foreground"> — {sesion.cerrador.nombre ?? sesion.cerrador.email}</span>}
        </p>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="p-0 overflow-hidden">
          <div className="px-4 py-3 border-b font-medium text-sm">Totales por medio de pago</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medio</TableHead>
                <TableHead className="text-right">Ingresos</TableHead>
                <TableHead className="text-right">Egresos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {r.porMedio.map((m) => (
                <TableRow key={m.medio}>
                  <TableCell>{MEDIO_PAGO_LABEL[m.medio]}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoneda(m.ingresos)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoneda(m.egresos)}</TableCell>
                </TableRow>
              ))}
              {r.porMedio.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-6 text-sm">
                    Sin movimientos todavía
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        <Card className="p-0 overflow-hidden xl:col-span-2">
          <div className="px-4 py-3 border-b font-medium text-sm">Movimientos ({sesion.movimientos.length})</div>
          <div className="max-h-[420px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hora</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead className="hidden md:table-cell">Medio</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sesion.movimientos.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{formatFecha(m.fecha)}</TableCell>
                    <TableCell>
                      {m.concepto}
                      <span className="text-xs text-muted-foreground"> · {ORIGEN_LABEL[m.origen]}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{MEDIO_PAGO_LABEL[m.medio_pago]}</TableCell>
                    <TableCell
                      className={`text-right tabular-nums ${m.tipo === 'ingreso' ? 'text-green-700 dark:text-green-400' : 'text-destructive'}`}
                    >
                      {m.tipo === 'ingreso' ? '+' : '−'}
                      {formatMoneda(m.monto)}
                    </TableCell>
                  </TableRow>
                ))}
                {sesion.movimientos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6 text-sm">
                      Las ventas, compras pagadas en efectivo y movimientos manuales aparecen acá.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {editable && abierta && (
        <>
          <MovimientoCajaDialog
            sesionId={sesion.id}
            tipo={movimiento}
            efectivoDisponible={r.efectivoEsperado}
            onCerrar={() => setMovimiento(null)}
          />
          <CerrarCajaDialog
            sesion={sesion}
            efectivoEsperado={r.efectivoEsperado}
            abierto={cerrando}
            onCerrar={() => setCerrando(false)}
          />
        </>
      )}
    </div>
  );
}
