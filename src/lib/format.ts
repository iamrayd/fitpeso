function group(intPart: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** ₱1,234 — formatted by hand so it never depends on the device's Intl support. */
export function peso(n: number, decimals = false): string {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (!decimals) return `${sign}₱${group(String(Math.round(abs)))}`;
  const [i, f] = abs.toFixed(2).split('.');
  return `${sign}₱${group(i)}.${f}`;
}

export function round(n: number, step = 1): number {
  return Math.round(n / step) * step;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Parses user-typed numbers, tolerating commas, peso signs and stray spaces. */
export function parseNum(s: string): number {
  const n = parseFloat(s.replace(/[,₱\s]/g, ''));
  return Number.isFinite(n) ? n : NaN;
}
