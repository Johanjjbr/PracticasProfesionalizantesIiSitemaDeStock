import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatMoneda } from '@/lib/format';
import { diaConSemana, diaCorto } from '@/lib/fechas';

export interface PuntoDia {
  dia: string; // yyyy-mm-dd
  total: number;
  cantidad: number;
}

const compacto = new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 });

function TooltipDia({ active, payload }: { active?: boolean; payload?: { payload: PuntoDia }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="text-sm font-semibold tabular-nums">{formatMoneda(p.total)}</p>
      <p className="text-muted-foreground">
        {diaConSemana(p.dia)} · {p.cantidad} {p.cantidad === 1 ? 'venta' : 'ventas'}
      </p>
    </div>
  );
}

/** Ventas por día: una sola serie (sin leyenda; el título la nombra). */
export function ColumnasPorDia({ datos, alto = 240 }: { datos: PuntoDia[]; alto?: number }) {
  const intervalo = datos.length > 16 ? Math.ceil(datos.length / 10) - 1 : 0;
  return (
    <div>
      <div style={{ height: alto }} role="img" aria-label="Gráfico de ventas por día">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="20%">
            <CartesianGrid vertical={false} stroke="var(--grilla)" strokeWidth={1} />
            <XAxis
              dataKey="dia"
              tickFormatter={diaCorto}
              interval={intervalo}
              tickLine={false}
              axisLine={{ stroke: 'var(--grilla)' }}
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            />
            <YAxis
              tickFormatter={(v: number) => `$${compacto.format(v)}`}
              tickLine={false}
              axisLine={false}
              width={56}
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              allowDecimals={false}
            />
            <Tooltip content={<TooltipDia />} cursor={{ fill: 'var(--muted)', opacity: 0.6 }} />
            <Bar dataKey="total" fill="var(--serie-1)" radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <details className="mt-2 text-xs text-muted-foreground">
        <summary className="cursor-pointer select-none">Ver como tabla</summary>
        <table className="mt-2 w-full text-sm">
          <thead>
            <tr className="text-muted-foreground text-xs">
              <th className="text-left font-normal py-1">Día</th>
              <th className="text-right font-normal">Ventas</th>
              <th className="text-right font-normal">Total</th>
            </tr>
          </thead>
          <tbody>
            {datos.map((d) => (
              <tr key={d.dia} className="border-t border-border/50 text-foreground">
                <td className="py-1">{diaConSemana(d.dia)}</td>
                <td className="text-right tabular-nums">{d.cantidad}</td>
                <td className="text-right tabular-nums">{formatMoneda(d.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
