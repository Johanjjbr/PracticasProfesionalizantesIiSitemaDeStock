import { formatFecha, formatMoneda, formatNumero } from '@/lib/format';
import { MEDIO_PAGO_LABEL, type MedioPago } from '@/features/caja/api';

export interface DatosTicket {
  empresa: { nombre: string; cuit?: string | null; direccion?: string | null; telefono?: string | null };
  numero: number;
  fecha: string;
  vendedor?: string | null;
  cliente?: string | null;
  items: { nombre: string; cantidad: number; unidad: string; precio: number; subtotal: number }[];
  subtotal: number;
  descuento: number;
  total: number;
  pagos: { medio: MedioPago; monto: number }[];
  recibido: number;
  vuelto: number;
  anulada?: boolean;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function htmlTicket(t: DatosTicket): string {
  const filas = t.items
    .map(
      (i) => `<tr><td colspan="2">${esc(i.nombre)}</td></tr>
      <tr><td class="det">${formatNumero(i.cantidad)} ${esc(i.unidad)} x ${formatMoneda(i.precio)}</td><td class="r">${formatMoneda(i.subtotal)}</td></tr>`,
    )
    .join('');
  const pagos = t.pagos.map((p) => `<tr><td>${MEDIO_PAGO_LABEL[p.medio]}</td><td class="r">${formatMoneda(p.monto)}</td></tr>`).join('');
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Ticket ${t.numero}</title>
<style>
  @page { size: 80mm auto; margin: 4mm; }
  * { box-sizing: border-box; }
  body { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 12px; width: 72mm; margin: 0 auto; color: #000; }
  h1 { font-size: 15px; text-align: center; margin: 0 0 2px; }
  .c { text-align: center; } .r { text-align: right; white-space: nowrap; }
  .det { padding-left: 6px; color: #333; }
  table { width: 100%; border-collapse: collapse; }
  hr { border: 0; border-top: 1px dashed #000; margin: 6px 0; }
  .tot td { font-size: 15px; font-weight: bold; }
  .anulada { border: 2px solid #000; text-align: center; font-weight: bold; padding: 2px; margin: 4px 0; }
</style></head><body>
<h1>${esc(t.empresa.nombre)}</h1>
${t.empresa.cuit ? `<div class="c">CUIT ${esc(t.empresa.cuit)}</div>` : ''}
${t.empresa.direccion ? `<div class="c">${esc(t.empresa.direccion)}</div>` : ''}
${t.empresa.telefono ? `<div class="c">Tel. ${esc(t.empresa.telefono)}</div>` : ''}
<hr>
<div>Venta N° ${t.numero}</div>
<div>${formatFecha(t.fecha)}</div>
${t.vendedor ? `<div>Atendió: ${esc(t.vendedor)}</div>` : ''}
${t.cliente ? `<div>Cliente: ${esc(t.cliente)}</div>` : ''}
${t.anulada ? '<div class="anulada">ANULADA</div>' : ''}
<hr>
<table>${filas}</table>
<hr>
<table>
  ${t.descuento > 0 ? `<tr><td>Subtotal</td><td class="r">${formatMoneda(t.subtotal)}</td></tr><tr><td>Descuento</td><td class="r">-${formatMoneda(t.descuento)}</td></tr>` : ''}
  <tr class="tot"><td>TOTAL</td><td class="r">${formatMoneda(t.total)}</td></tr>
</table>
<hr>
<table>${pagos}
  ${t.vuelto > 0 ? `<tr><td>Recibido</td><td class="r">${formatMoneda(t.recibido)}</td></tr><tr><td>Vuelto</td><td class="r">${formatMoneda(t.vuelto)}</td></tr>` : ''}
</table>
<hr>
<div class="c">¡Gracias por su compra!</div>
<div class="c" style="font-size:10px;margin-top:4px">Comprobante no válido como factura</div>
<script>window.onload = () => { window.print(); setTimeout(() => window.close(), 300); };</script>
</body></html>`;
}

/** Abre una ventana con el ticket y lanza la impresión. */
export function imprimirTicket(t: DatosTicket): boolean {
  const w = window.open('', '_blank', 'width=380,height=640');
  if (!w) return false;
  w.document.open();
  w.document.write(htmlTicket(t));
  w.document.close();
  return true;
}
