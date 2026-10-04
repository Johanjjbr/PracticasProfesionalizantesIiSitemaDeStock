export interface FilaRanking {
  clave: string;
  etiqueta: string;
  valor: number;
  detalle?: string;
}

/**
 * Barras horizontales para rankings (una sola serie). El texto usa tokens de
 * texto; solo la barra lleva el color de la serie.
 */
export function Ranking({
  filas,
  formato,
  vacio = 'Sin datos en el período',
  max,
}: {
  filas: FilaRanking[];
  formato: (n: number) => string;
  vacio?: string;
  max?: number;
}) {
  if (filas.length === 0) return <p className="text-sm text-muted-foreground py-6 text-center">{vacio}</p>;
  const tope = max ?? Math.max(...filas.map((f) => f.valor), 0);
  return (
    <ul className="space-y-3">
      {filas.map((f) => {
        const pct = tope > 0 ? Math.max(1, (f.valor / tope) * 100) : 0;
        return (
          <li key={f.clave} title={`${f.etiqueta}: ${formato(f.valor)}${f.detalle ? ` · ${f.detalle}` : ''}`}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate">{f.etiqueta}</span>
              <span className="tabular-nums font-medium whitespace-nowrap">{formato(f.valor)}</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-2.5 flex-1 rounded-r bg-transparent">
                <div className="h-full rounded-r-[4px]" style={{ width: `${pct}%`, background: 'var(--serie-1)' }} />
              </div>
            </div>
            {f.detalle && <p className="text-xs text-muted-foreground mt-0.5">{f.detalle}</p>}
          </li>
        );
      })}
    </ul>
  );
}
