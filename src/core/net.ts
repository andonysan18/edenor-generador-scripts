/** Utilidades IPv4. Las direcciones se manejan como enteros sin signo de 32 bits. */

export interface SubnetInfo {
  /** Máscara */
  m: number;
  /** Dirección de red */
  n: number;
  /** Broadcast */
  b: number;
}

export function parseIp(s: string): number | null {
  const p = String(s).trim().split('.');
  if (p.length !== 4) return null;
  let n = 0;
  for (const x of p) {
    if (!/^\d{1,3}$/.test(x) || +x > 255) return null;
    n = n * 256 + Number(x);
  }
  return n;
}

export function formatIp(n: number): string {
  return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
}

export function prefixToMask(p: number): number {
  return p === 0 ? 0 : (0xffffffff << (32 - p)) >>> 0;
}

export function subnetInfo(ip: number, prefix: number): SubnetInfo {
  const m = prefixToMask(prefix);
  const n = (ip & m) >>> 0;
  return { m, n, b: (n | (~m >>> 0)) >>> 0 };
}

/** Último host utilizable de la subred: el gateway por convención. */
export function lastHost(ip: number, prefix: number): number {
  return subnetInfo(ip, prefix).b - 1;
}
