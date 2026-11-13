// Small IPv4 helpers for the command explainer (unsigned arithmetic).
export function ip2n(s: string): number | null {
  const p = String(s || "").trim().split(".");
  if (p.length !== 4 || p.some((x) => !/^\d{1,3}$/.test(x) || +x > 255)) return null;
  return p.reduce((a, x) => a * 256 + Number(x), 0);
}
export const n2ip = (n: number) => [Math.floor(n / 16777216) % 256, Math.floor(n / 65536) % 256, Math.floor(n / 256) % 256, n % 256].join(".");
export function maskToPrefix(m: string): number | null {
  const n = ip2n(m);
  if (n == null) return null;
  for (let p = 0; p <= 32; p++) if (n === (p ? 2 ** 32 - 2 ** (32 - p) : 0)) return p;
  return null;
}
export function sameSubnet(a: number, b: number, prefix: number): boolean {
  const size = 2 ** (32 - prefix);
  return Math.floor(a / size) === Math.floor(b / size);
}
export const isApipa = (ip: string) => /^169\.254\./.test(ip);
