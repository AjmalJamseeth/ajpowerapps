// IPv4 helpers shared by the networking tools (SCADA connectivity assistant,
// IP register checker). Addresses are handled as unsigned 32-bit integers.

export function parseIp(s: string): number | null {
  const m = String(s ?? "").trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const o = m.slice(1).map(Number);
  if (o.some((x) => x > 255)) return null;
  return ((o[0] << 24) >>> 0) + (o[1] << 16) + (o[2] << 8) + o[3];
}

export function ipStr(n: number): string {
  return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
}

export function prefixToMask(p: number): number {
  return p <= 0 ? 0 : p >= 32 ? 0xffffffff : (0xffffffff << (32 - p)) >>> 0;
}

/** Accepts "255.255.255.0", "/24" or "24". Returns the prefix length, or null if not a valid (contiguous) mask. */
export function parseMask(s: string): number | null {
  const t = String(s ?? "").trim().replace(/^\//, "");
  if (/^\d{1,2}$/.test(t)) {
    const p = Number(t);
    return p >= 0 && p <= 32 ? p : null;
  }
  const n = parseIp(t);
  if (n == null) return null;
  const inv = ~n >>> 0;
  if (((inv + 1) & inv) !== 0) return null; // ones must be contiguous from the left
  let p = 0;
  for (let i = 31; i >= 0; i--) if ((n >>> i) & 1) p++;
  return p;
}

export interface SubnetInfo {
  prefix: number;
  mask: number;
  network: number;
  broadcast: number;
  firstHost: number;
  lastHost: number;
  hosts: number;
}

export function subnetOf(ip: number, prefix: number): SubnetInfo {
  const mask = prefixToMask(prefix);
  const network = (ip & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  if (prefix >= 31) return { prefix, mask, network, broadcast, firstHost: network, lastHost: broadcast, hosts: prefix === 32 ? 1 : 2 };
  return { prefix, mask, network, broadcast, firstHost: network + 1, lastHost: broadcast - 1, hosts: broadcast - network - 1 };
}

export const inSubnet = (ip: number, s: SubnetInfo) => ((ip & s.mask) >>> 0) === s.network;

/** Special-purpose ranges a device on a substation LAN should not use. */
export function specialRange(ip: number): string | null {
  const a = ip >>> 24, b = (ip >>> 16) & 255;
  if (ip === 0) return "0.0.0.0 is not a host address";
  if (a === 127) return "127.x.x.x is the loopback range of the device itself";
  if (a === 169 && b === 254) return "169.254.x.x is a link-local (APIPA) address — the device was set to DHCP and found no DHCP server";
  if (a >= 224 && a <= 239) return "224–239.x.x.x is the IP multicast range, not a host address";
  if (a >= 240) return "240–255.x.x.x is reserved or broadcast";
  return null;
}

export function isPrivate(ip: number): boolean {
  const a = ip >>> 24, b = (ip >>> 16) & 255;
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

export function cidr(s: SubnetInfo): string {
  return `${ipStr(s.network)}/${s.prefix}`;
}
