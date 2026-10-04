import { hoyISO } from './format';

/** Suma días a una fecha yyyy-mm-dd (sin problemas de zona horaria). */
export function sumarDias(iso: string, dias: number): string {
  const [a, m, d] = iso.split('-').map(Number);
  const f = new Date(Date.UTC(a, m - 1, d + dias));
  return f.toISOString().slice(0, 10);
}

export function inicioDeMes(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

export function finDeMes(iso: string): string {
  const [a, m] = iso.split('-').map(Number);
  return new Date(Date.UTC(a, m, 0)).toISOString().slice(0, 10);
}

export type Preset = 'hoy' | 'ayer' | '7d' | '30d' | 'mes' | 'mes_anterior';

export const PRESET_LABEL: Record<Preset, string> = {
  hoy: 'Hoy',
  ayer: 'Ayer',
  '7d': 'Últimos 7 días',
  '30d': 'Últimos 30 días',
  mes: 'Este mes',
  mes_anterior: 'Mes anterior',
};

export function rangoDePreset(p: Preset): { desde: string; hasta: string } {
  const hoy = hoyISO();
  switch (p) {
    case 'hoy':
      return { desde: hoy, hasta: hoy };
    case 'ayer':
      return { desde: sumarDias(hoy, -1), hasta: sumarDias(hoy, -1) };
    case '7d':
      return { desde: sumarDias(hoy, -6), hasta: hoy };
    case '30d':
      return { desde: sumarDias(hoy, -29), hasta: hoy };
    case 'mes':
      return { desde: inicioDeMes(hoy), hasta: hoy };
    case 'mes_anterior': {
      const ultimoMesAnterior = sumarDias(inicioDeMes(hoy), -1);
      return { desde: inicioDeMes(ultimoMesAnterior), hasta: ultimoMesAnterior };
    }
  }
}

/** "2026-10-03" → "3/10" (eje de gráficos) */
export const diaCorto = (iso: string) => `${Number(iso.slice(8, 10))}/${Number(iso.slice(5, 7))}`;

/** "2026-10-03" → "sáb 3/10" */
export function diaConSemana(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number);
  const dia = new Date(Date.UTC(a, m - 1, d)).toLocaleDateString('es-AR', { weekday: 'short', timeZone: 'UTC' });
  return `${dia} ${d}/${m}`;
}
