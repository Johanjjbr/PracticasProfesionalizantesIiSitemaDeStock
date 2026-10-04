/** Descarga un CSV compatible con Excel en español (separador ';', BOM UTF-8). */
export function descargarCsv<T>(nombreArchivo: string, filas: T[], columnas: { titulo: string; valor: (f: T) => unknown }[]) {
  const escapar = (v: unknown) => {
    if (v === null || v === undefined) return '';
    const s = typeof v === 'number' ? String(v).replace('.', ',') : String(v);
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lineas = [
    columnas.map((c) => escapar(c.titulo)).join(';'),
    ...filas.map((f) => columnas.map((c) => escapar(c.valor(f))).join(';')),
  ];
  const blob = new Blob(['﻿' + lineas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo.endsWith('.csv') ? nombreArchivo : `${nombreArchivo}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export const fechaArchivo = () => new Date().toISOString().slice(0, 10);
