import type { Enums } from '@/lib/database.types';

export type MotivoAjuste = Enums<'motivo_ajuste'>;
export type TipoMovimiento = Enums<'tipo_movimiento'>;

export const MOTIVO_LABEL: Record<MotivoAjuste, string> = {
  conteo_fisico: 'Conteo físico',
  rotura: 'Rotura',
  vencimiento: 'Vencimiento',
  merma: 'Merma',
  consumo_interno: 'Consumo interno',
  produccion: 'Producción',
  error_carga: 'Error de carga',
  devolucion: 'Devolución',
  otro: 'Otro',
};

/** Motivos disponibles para un ajuste manual (el conteo físico tiene su propio modo). */
export const MOTIVOS_MANUALES: MotivoAjuste[] = [
  'rotura',
  'vencimiento',
  'merma',
  'consumo_interno',
  'produccion',
  'error_carga',
  'devolucion',
  'otro',
];

export const TIPO_MOV_LABEL: Record<TipoMovimiento, string> = {
  inicial: 'Stock inicial',
  compra: 'Compra',
  venta: 'Venta',
  ajuste: 'Ajuste',
  anulacion_venta: 'Anulación de venta',
  anulacion_compra: 'Anulación de compra',
  produccion: 'Producción',
};
