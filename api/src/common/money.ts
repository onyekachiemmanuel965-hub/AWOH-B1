/**
 * Money helpers — authoritative amounts use integer minor units (e.g. kobo).
 * Avoid IEEE floating-point for commerce math.
 */

export function toMinorUnits(amount: string | number): bigint {
  const raw = typeof amount === 'number' ? amount.toFixed(2) : String(amount).trim();
  const match = raw.match(/^(-?)(\d+)(?:\.(\d{0,2}))?$/);
  if (!match) {
    throw new Error('Invalid monetary amount');
  }
  const sign = match[1] === '-' ? -1n : 1n;
  const whole = BigInt(match[2]);
  const frac = (match[3] ?? '').padEnd(2, '0').slice(0, 2);
  const minor = whole * 100n + BigInt(frac);
  return sign * minor;
}

export function fromMinorUnits(minor: bigint): string {
  const sign = minor < 0n ? '-' : '';
  const abs = minor < 0n ? -minor : minor;
  const whole = abs / 100n;
  const frac = (abs % 100n).toString().padStart(2, '0');
  return `${sign}${whole.toString()}.${frac}`;
}

export function multiplyMinor(unitMinor: bigint, quantity: number): bigint {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error('Invalid quantity');
  }
  return unitMinor * BigInt(quantity);
}

export function addMinor(...parts: bigint[]): bigint {
  return parts.reduce((a, b) => a + b, 0n);
}

export function amountsEqual(a: string, b: string): boolean {
  return toMinorUnits(a) === toMinorUnits(b);
}
