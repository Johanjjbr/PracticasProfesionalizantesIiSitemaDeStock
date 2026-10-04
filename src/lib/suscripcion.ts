import type { Tables } from './database.types';
import { hoyISO } from './format';
import { sumarDias } from './fechas';

/** Mismo criterio que private.estado_empresa() en la BD (la BD es la que hace cumplir el corte). */
export type EstadoSuscripcion = 'activa' | 'gracia' | 'vencida' | 'suspendida' | 'baja';

export interface Suscripcion {
  estado: EstadoSuscripcion;
  /** Último día pagado (null = sin vencimiento) */
  pagadoHasta: string | null;
  /** Último día de gracia (null = sin vencimiento) */
  finGracia: string | null;
  /** Días que faltan para el vencimiento (negativo si ya venció) */
  diasParaVencer: number | null;
}

export const ESTADO_LABEL: Record<EstadoSuscripcion, string> = {
  activa: 'Al día',
  gracia: 'En gracia',
  vencida: 'Vencida · solo lectura',
  suspendida: 'Suspendida',
  baja: 'Dada de baja',
};

function diferenciaDias(desde: string, hasta: string): number {
  const a = Date.UTC(+desde.slice(0, 4), +desde.slice(5, 7) - 1, +desde.slice(8, 10));
  const b = Date.UTC(+hasta.slice(0, 4), +hasta.slice(5, 7) - 1, +hasta.slice(8, 10));
  return Math.round((b - a) / 86_400_000);
}

export function suscripcionDe(
  e: Pick<Tables<'empresas'>, 'activa' | 'suspendida' | 'pagado_hasta' | 'dias_gracia'>,
  hoy = hoyISO(),
): Suscripcion {
  const pagadoHasta = e.pagado_hasta;
  const finGracia = pagadoHasta ? sumarDias(pagadoHasta, e.dias_gracia) : null;
  const diasParaVencer = pagadoHasta ? diferenciaDias(hoy, pagadoHasta) : null;
  let estado: EstadoSuscripcion;
  if (!e.activa) estado = 'baja';
  else if (e.suspendida) estado = 'suspendida';
  else if (!pagadoHasta || hoy <= pagadoHasta) estado = 'activa';
  else if (finGracia && hoy <= finGracia) estado = 'gracia';
  else estado = 'vencida';
  return { estado, pagadoHasta, finGracia, diasParaVencer };
}
