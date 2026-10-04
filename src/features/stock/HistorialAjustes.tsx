import { Fragment, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatFecha, formatNumero } from '@/lib/format';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Cargando, ErrorCarga } from '@/app/components/comun/Estados';
import { MOTIVO_LABEL } from './etiquetas';
import { useAjustes } from './api';

export default function HistorialAjustes() {
  const [limite, setLimite] = useState(50);
  const { data: ajustes, isLoading, error, isFetching } = useAjustes(limite);
  const [abierto, setAbierto] = useState<string | null>(null);

  if (isLoading) return <Cargando />;
  if (error) return <ErrorCarga error={error} />;

  return (
    <Card className="p-0 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead>N°</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Motivo</TableHead>
            <TableHead className="text-right">Productos</TableHead>
            <TableHead className="hidden md:table-cell">Usuario</TableHead>
            <TableHead className="hidden lg:table-cell">Observaciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(ajustes ?? []).map((a) => {
            const expandido = abierto === a.id;
            const conCambio = a.items.filter((i) => Number(i.diferencia) !== 0).length;
            return (
              <Fragment key={a.id}>
                <TableRow className="cursor-pointer" onClick={() => setAbierto(expandido ? null : a.id)}>
                  <TableCell>
                    <button type="button" aria-label={expandido ? 'Ocultar detalle' : 'Ver detalle'} aria-expanded={expandido}>
                      {expandido ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  </TableCell>
                  <TableCell className="tabular-nums">#{a.numero}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatFecha(a.fecha)}</TableCell>
                  <TableCell>
                    <Badge variant={a.motivo === 'conteo_fisico' ? 'secondary' : 'outline'}>{MOTIVO_LABEL[a.motivo]}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {a.items.length}
                    {a.motivo === 'conteo_fisico' && (
                      <span className="text-xs text-muted-foreground"> ({conCambio} con diferencia)</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {a.usuario?.nombre ?? a.usuario?.email ?? '—'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground max-w-xs truncate">
                    {a.observaciones ?? '—'}
                  </TableCell>
                </TableRow>
                {expandido && (
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableCell />
                    <TableCell colSpan={6} className="py-3">
                      {a.observaciones && <p className="text-sm mb-2 lg:hidden">{a.observaciones}</p>}
                      <table className="w-full text-sm">
                        <thead className="text-muted-foreground text-xs">
                          <tr>
                            <th className="text-left font-normal py-1">Producto</th>
                            <th className="text-right font-normal">Stock anterior</th>
                            {a.motivo === 'conteo_fisico' && <th className="text-right font-normal">Contado</th>}
                            <th className="text-right font-normal">Diferencia</th>
                          </tr>
                        </thead>
                        <tbody>
                          {a.items.map((i) => {
                            const d = Number(i.diferencia);
                            return (
                              <tr key={i.id} className="border-t border-border/50">
                                <td className="py-1">
                                  <span className="font-mono text-xs text-muted-foreground mr-2">{i.producto?.codigo}</span>
                                  {i.producto?.nombre}
                                </td>
                                <td className="text-right tabular-nums">
                                  {formatNumero(i.stock_anterior)} {i.producto?.unidad_codigo}
                                </td>
                                {a.motivo === 'conteo_fisico' && (
                                  <td className="text-right tabular-nums">{formatNumero(i.cantidad_contada)}</td>
                                )}
                                <td
                                  className={`text-right tabular-nums ${d > 0 ? 'text-green-700 dark:text-green-400' : d < 0 ? 'text-destructive' : 'text-muted-foreground'}`}
                                >
                                  {d > 0 ? '+' : ''}
                                  {formatNumero(d)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
          {(ajustes ?? []).length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                Todavía no hay ajustes registrados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {(ajustes ?? []).length === limite && (
        <div className="border-t p-3 text-center">
          <Button variant="outline" size="sm" disabled={isFetching} onClick={() => setLimite(limite + 50)}>
            Ver más
          </Button>
        </div>
      )}
    </Card>
  );
}
