/** Valida un CUIT/CUIL argentino (11 dígitos con dígito verificador). Acepta guiones. */
export function cuitValido(valor: string): boolean {
  const d = valor.replace(/\D/g, '');
  if (d.length !== 11) return false;
  const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const suma = pesos.reduce((s, p, i) => s + p * Number(d[i]), 0);
  let dv = 11 - (suma % 11);
  if (dv === 11) dv = 0;
  if (dv === 10) dv = 9;
  return dv === Number(d[10]);
}

/** Normaliza un CUIT al formato XX-XXXXXXXX-X. */
export function formatearCuit(valor: string): string {
  const d = valor.replace(/\D/g, '');
  if (d.length !== 11) return valor.trim();
  return `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}`;
}

/** Convierte "" o espacios en null (para columnas opcionales). */
export const vacioANull = (v: string | null | undefined) => {
  const t = (v ?? '').trim();
  return t === '' ? null : t;
};

/** Parsea números escritos con coma o punto decimal. Devuelve NaN si no es válido. */
export function parseNumero(v: string | number): number {
  if (typeof v === 'number') return v;
  const t = v.trim().replace(/\s/g, '').replace(/^\$/, '');
  if (t === '') return NaN;
  // Formato es-AR: "1.234,56" → 1234.56 ; "12,5" → 12.5
  if (t.includes(',')) return Number(t.replace(/\./g, '').replace(',', '.'));
  // Sin coma: "10.000" / "1.250.000" son separadores de miles; "10.5" o "0.75" son decimales
  if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) return Number(t.replace(/\./g, ''));
  return Number(t);
}
