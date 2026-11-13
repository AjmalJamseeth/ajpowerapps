// X.509 certificate inspector: parses PEM or DER certificates in the browser
// (ASN.1 DER), shows subject, issuer, validity, key, signature and extensions,
// and checks expiry, weak algorithms, names and OPC UA / TLS usage.

interface Node {
  tag: number;
  cls: number;
  constructed: boolean;
  start: number; // header start
  hdr: number; // header length
  len: number;
  b: Uint8Array;
}
const content = (n: Node) => n.b.subarray(n.start + n.hdr, n.start + n.hdr + n.len);

function read(b: Uint8Array, pos: number): Node {
  const t = b[pos];
  let len = b[pos + 1], hdr = 2;
  if (len & 0x80) {
    const n = len & 0x7f;
    if (n === 0 || n > 4) throw new Error("unsupported length");
    len = 0;
    for (let i = 0; i < n; i++) len = len * 256 + b[pos + 2 + i];
    hdr = 2 + n;
  }
  if (pos + hdr + len > b.length) throw new Error("truncated");
  return { tag: t & 0x1f, cls: t >> 6, constructed: !!(t & 0x20), start: pos, hdr, len, b };
}
function children(n: Node): Node[] {
  const out: Node[] = [];
  let p = n.start + n.hdr;
  const end = p + n.len;
  while (p < end) {
    const c = read(n.b, p);
    out.push(c);
    p = c.start + c.hdr + c.len;
  }
  return out;
}
function oid(n: Node): string {
  const v = content(n);
  const parts = [Math.floor(v[0] / 40), v[0] % 40];
  let x = 0;
  for (let i = 1; i < v.length; i++) {
    x = x * 128 + (v[i] & 0x7f);
    if (!(v[i] & 0x80)) (parts.push(x), (x = 0));
  }
  return parts.join(".");
}
const hex = (u: Uint8Array, sep = ":") => [...u].map((x) => x.toString(16).toUpperCase().padStart(2, "0")).join(sep);
function str(n: Node): string {
  const v = content(n);
  if (n.tag === 30) {
    let s = "";
    for (let i = 0; i + 1 < v.length; i += 2) s += String.fromCharCode((v[i] << 8) | v[i + 1]);
    return s;
  }
  try {
    return new TextDecoder("utf-8").decode(v);
  } catch {
    return String.fromCharCode(...v);
  }
}
function time(n: Node): Date {
  const s = str(n);
  const m = n.tag === 23 ? s.match(/^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?Z$/) : s.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?/);
  if (!m) return new Date(NaN);
  let y = +m[1];
  if (n.tag === 23) y += y < 50 ? 2000 : 1900;
  return new Date(Date.UTC(y, +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0)));
}

export const OID_NAMES: Record<string, string> = {
  "2.5.4.3": "CN", "2.5.4.6": "C", "2.5.4.7": "L", "2.5.4.8": "ST", "2.5.4.10": "O", "2.5.4.11": "OU", "2.5.4.5": "serialNumber", "0.9.2342.19200300.100.1.25": "DC", "1.2.840.113549.1.9.1": "E", "0.9.2342.19200300.100.1.1": "UID",
  "1.2.840.113549.1.1.1": "RSA", "1.2.840.10045.2.1": "EC", "1.3.101.112": "Ed25519", "1.3.101.113": "Ed448",
  "1.2.840.113549.1.1.4": "md5WithRSAEncryption", "1.2.840.113549.1.1.5": "sha1WithRSAEncryption", "1.2.840.113549.1.1.11": "sha256WithRSAEncryption", "1.2.840.113549.1.1.12": "sha384WithRSAEncryption", "1.2.840.113549.1.1.13": "sha512WithRSAEncryption", "1.2.840.113549.1.1.10": "RSASSA-PSS",
  "1.2.840.10045.4.1": "ecdsa-with-SHA1", "1.2.840.10045.4.3.2": "ecdsa-with-SHA256", "1.2.840.10045.4.3.3": "ecdsa-with-SHA384", "1.2.840.10045.4.3.4": "ecdsa-with-SHA512",
  "1.2.840.10045.3.1.7": "P-256", "1.3.132.0.34": "P-384", "1.3.132.0.35": "P-521", "1.3.36.3.3.2.8.1.1.7": "brainpoolP256r1", "1.3.36.3.3.2.8.1.1.11": "brainpoolP384r1",
  "1.3.6.1.5.5.7.3.1": "serverAuth", "1.3.6.1.5.5.7.3.2": "clientAuth", "1.3.6.1.5.5.7.3.3": "codeSigning", "1.3.6.1.5.5.7.3.4": "emailProtection", "1.3.6.1.5.5.7.3.8": "timeStamping", "1.3.6.1.5.5.7.3.9": "OCSPSigning",
};
const KU = ["digitalSignature", "nonRepudiation", "keyEncipherment", "dataEncipherment", "keyAgreement", "keyCertSign", "cRLSign", "encipherOnly", "decipherOnly"];

export interface CertInfo {
  subject: string;
  issuer: string;
  subjectCN: string;
  serial: string;
  version: number;
  notBefore: Date;
  notAfter: Date;
  sigAlg: string;
  keyAlg: string;
  keySize: string;
  selfSigned: boolean;
  ca: boolean | null;
  pathLen: number | null;
  keyUsage: string[];
  eku: string[];
  san: { type: string; value: string }[];
  ski: string;
  aki: string;
  crl: string[];
  der: Uint8Array;
}

function name(n: Node): { text: string; cn: string } {
  const parts: string[] = [];
  let cn = "";
  for (const set of children(n))
    for (const atv of children(set)) {
      const [o, v] = children(atv);
      const k = OID_NAMES[oid(o)] ?? oid(o);
      const val = str(v);
      if (k === "CN") cn = val;
      parts.push(`${k}=${val}`);
    }
  return { text: parts.join(", "), cn };
}

export function parseCert(der: Uint8Array): CertInfo {
  const cert = read(der, 0);
  const [tbs, sigAlgN] = children(cert);
  const f = children(tbs);
  let i = 0, version = 1;
  if (f[0].cls === 2 && f[0].tag === 0) (version = content(children(f[0])[0])[0] + 1), (i = 1);
  const serial = hex(content(f[i]));
  const sigAlg = OID_NAMES[oid(children(sigAlgN)[0])] ?? oid(children(sigAlgN)[0]);
  const issuer = name(f[i + 2]), subject = name(f[i + 4]);
  const [nb, na] = children(f[i + 3]);
  const spki = children(f[i + 5]);
  const algSeq = children(spki[0]);
  const keyAlgOid = oid(algSeq[0]);
  const keyAlg = OID_NAMES[keyAlgOid] ?? keyAlgOid;
  let keySize = "";
  if (keyAlg === "RSA") {
    const bits = content(spki[1]).subarray(1);
    const rsa = children(read(bits, 0));
    const mod = content(rsa[0]);
    let off = 0;
    while (off < mod.length && mod[off] === 0) off++;
    let bl = (mod.length - off) * 8;
    if (off < mod.length) for (let b = 0x80; b && !(mod[off] & b); b >>= 1) bl--;
    keySize = `${bl} bit`;
  } else if (keyAlg === "EC" && algSeq[1]) keySize = OID_NAMES[oid(algSeq[1])] ?? oid(algSeq[1]);
  else if (keyAlg === "Ed25519") keySize = "256 bit";
  const info: CertInfo = { subject: subject.text, issuer: issuer.text, subjectCN: subject.cn, serial, version, notBefore: time(nb), notAfter: time(na), sigAlg, keyAlg, keySize, selfSigned: subject.text === issuer.text, ca: null, pathLen: null, keyUsage: [], eku: [], san: [], ski: "", aki: "", crl: [], der };
  const extWrap = f.slice(i + 6).find((x) => x.cls === 2 && x.tag === 3);
  if (extWrap) {
    for (const ext of children(children(extWrap)[0])) {
      const parts = children(ext);
      const id = oid(parts[0]);
      const val = read(content(parts[parts.length - 1]), 0);
      try {
        if (id === "2.5.29.19") {
          const c = children(val);
          info.ca = c.length > 0 && c[0].tag === 1 ? content(c[0])[0] !== 0 : false;
          const pl = c.find((x) => x.tag === 2);
          if (pl) info.pathLen = content(pl).reduce((a, x) => a * 256 + x, 0);
        } else if (id === "2.5.29.15") {
          const v = content(val), unused = v[0];
          const bits: number[] = [];
          for (let k = 1; k < v.length; k++) for (let b = 0; b < 8; b++) bits.push((v[k] >> (7 - b)) & 1);
          const n = bits.length - unused;
          info.keyUsage = KU.filter((_, k) => k < n && bits[k]);
        } else if (id === "2.5.29.37") info.eku = children(val).map((x) => OID_NAMES[oid(x)] ?? oid(x));
        else if (id === "2.5.29.17") {
          for (const g of children(val)) {
            const v = content(g);
            if (g.tag === 2) info.san.push({ type: "DNS", value: String.fromCharCode(...v) });
            else if (g.tag === 6) info.san.push({ type: "URI", value: String.fromCharCode(...v) });
            else if (g.tag === 1) info.san.push({ type: "Email", value: String.fromCharCode(...v) });
            else if (g.tag === 7) info.san.push({ type: "IP", value: v.length === 4 ? [...v].join(".") : hex(v, ":") });
          }
        } else if (id === "2.5.29.14") info.ski = hex(content(val));
        else if (id === "2.5.29.35") {
          const k = children(val).find((x) => x.cls === 2 && x.tag === 0);
          if (k) info.aki = hex(content(k));
        } else if (id === "2.5.29.31") {
          const txt = String.fromCharCode(...content(val));
          info.crl = [...txt.matchAll(/(https?:\/\/[\x21-\x7e]+|ldap:\/\/[\x21-\x7e]+)/g)].map((m) => m[1]);
        }
      } catch {
        /* skip a malformed extension */
      }
    }
  }
  if (info.aki && info.ski) info.selfSigned = info.selfSigned && info.aki === info.ski;
  return info;
}

/** Split PEM text (one or more certificates) or take a DER file. */
export function loadCerts(input: string | Uint8Array): Uint8Array[] {
  if (typeof input !== "string") {
    if (input[0] === 0x30) return [input];
    input = new TextDecoder().decode(input);
  }
  const out: Uint8Array[] = [];
  for (const m of input.matchAll(/-----BEGIN CERTIFICATE-----([\s\S]*?)-----END CERTIFICATE-----/g)) {
    const b64 = m[1].replace(/[^A-Za-z0-9+/=]/g, "");
    const bin = atob(b64);
    out.push(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  }
  return out;
}

export type Purpose = "tls-server" | "opcua" | "any";
export interface CertCheck {
  sev: "error" | "warning" | "info" | "ok";
  text: string;
}

export function checkCert(c: CertInfo, purpose: Purpose, now = new Date(), hostOrIp = ""): CertCheck[] {
  const out: CertCheck[] = [];
  const days = Math.floor((c.notAfter.getTime() - now.getTime()) / 864e5);
  if (now < c.notBefore) out.push({ sev: "error", text: `Not valid yet: valid from ${c.notBefore.toISOString().slice(0, 10)}. Check the clock of the device that will check it.` });
  if (days < 0) out.push({ sev: "error", text: `Expired ${-days} day(s) ago (${c.notAfter.toISOString().slice(0, 10)}). Connections that check the certificate will fail.` });
  else if (days <= 30) out.push({ sev: "warning", text: `Expires in ${days} day(s) (${c.notAfter.toISOString().slice(0, 10)}). Renew it now and plan the change on every system that trusts it.` });
  else if (days <= 90) out.push({ sev: "info", text: `Expires in ${days} days (${c.notAfter.toISOString().slice(0, 10)}): plan the renewal.` });
  else out.push({ sev: "ok", text: `Valid until ${c.notAfter.toISOString().slice(0, 10)} (${days} days).` });
  if (/md5|sha1|SHA1/.test(c.sigAlg)) out.push({ sev: "error", text: `Signature algorithm ${c.sigAlg} is broken or deprecated; current clients may reject it. Reissue with SHA-256 or stronger.` });
  if (c.keyAlg === "RSA") {
    const bits = parseInt(c.keySize, 10);
    if (bits < 2048) out.push({ sev: "error", text: `RSA key of ${bits} bits is too short; use 2048 bits or more.` });
  }
  if (c.selfSigned && c.ca !== true) out.push({ sev: "info", text: "Self-signed: every client must trust this exact certificate (copy it to the client's trusted store). Common for OPC UA and device web interfaces." });
  if (c.ca === true) out.push({ sev: "info", text: `This is a CA certificate${c.pathLen != null ? ` (path length ${c.pathLen})` : ""}: it signs other certificates and belongs in the trusted root or intermediate store.` });
  if (purpose === "tls-server") {
    if (!c.san.some((s) => s.type === "DNS" || s.type === "IP")) out.push({ sev: "warning", text: "No DNS or IP subject alternative name. Browsers and modern TLS clients ignore the CN and will report a name mismatch." });
    if (c.eku.length && !c.eku.includes("serverAuth")) out.push({ sev: "warning", text: "Extended key usage does not include serverAuth; TLS clients may reject it as a server certificate." });
    if (hostOrIp) {
      const h = hostOrIp.toLowerCase();
      const ok = c.san.some((s) => (s.type === "IP" && s.value === h) || (s.type === "DNS" && (s.value.toLowerCase() === h || (s.value.startsWith("*.") && h.endsWith(s.value.slice(1).toLowerCase()) && h.split(".").length === s.value.split(".").length))));
      out.push(ok ? { sev: "ok", text: `${hostOrIp} matches a subject alternative name.` } : { sev: "error", text: `${hostOrIp} is not in the subject alternative names (${c.san.map((s) => s.value).join(", ") || "none"}): clients connecting with this name or address will report a mismatch.` });
    }
  }
  if (purpose === "opcua") {
    const uri = c.san.find((s) => s.type === "URI");
    if (!uri) out.push({ sev: "error", text: "No URI in the subject alternative names. An OPC UA application instance certificate carries the ApplicationUri there, and clients check it against the server's description." });
    else out.push({ sev: "ok", text: `ApplicationUri: ${uri.value} — it must equal the ApplicationUri configured in the OPC UA application.` });
    const want = ["digitalSignature", "keyEncipherment", "dataEncipherment"];
    const miss = want.filter((k) => !c.keyUsage.includes(k));
    if (c.keyAlg === "RSA" && miss.length) out.push({ sev: "warning", text: `Key usage lacks ${miss.join(", ")}, normally present on RSA OPC UA application certificates (OPC 10000-6).` });
    if (c.eku.length && !(c.eku.includes("serverAuth") || c.eku.includes("clientAuth"))) out.push({ sev: "warning", text: "Extended key usage has neither serverAuth nor clientAuth; OPC UA stacks usually expect one or both." });
    if (!c.san.some((s) => s.type === "DNS" || s.type === "IP")) out.push({ sev: "info", text: "No host name or IP address in the alternative names; some clients check the server's host name too." });
  }
  return out;
}

export async function fingerprints(der: Uint8Array): Promise<{ sha1: string; sha256: string } | null> {
  try {
    const buf = der.slice().buffer;
    const s1 = new Uint8Array(await crypto.subtle.digest("SHA-1", buf));
    const s2 = new Uint8Array(await crypto.subtle.digest("SHA-256", buf));
    return { sha1: hex(s1, ""), sha256: hex(s2, ":") };
  } catch {
    return null;
  }
}

export function chainOrder(certs: CertInfo[]): CertCheck[] {
  const out: CertCheck[] = [];
  for (let k = 0; k + 1 < certs.length; k++) {
    if (certs[k].issuer !== certs[k + 1].subject) out.push({ sev: "warning", text: `Certificate ${k + 1} is not issued by certificate ${k + 2}: the chain is out of order or incomplete.` });
  }
  if (certs.length > 1 && !out.length) out.push({ sev: "ok", text: "The certificates form a chain in order (each issued by the next)." });
  return out;
}

/** A self-signed OPC UA server certificate (sample; valid 2026-11-13 to 2026-12-03). */
export const SAMPLE_CERT = `-----BEGIN CERTIFICATE-----
MIID1DCCArygAwIBAgIURhkFnV4iXX+nH7XboAAUz+OvKIQwDQYJKoZIhvcNAQEL
BQAwTTEiMCAGA1UEAwwZU0NBREEtU1JWMDEgT1BDIFVBIFNlcnZlcjEaMBgGA1UE
CgwRU2FtcGxlIFN1YnN0YXRpb24xCzAJBgNVBAYTAkFFMB4XDTI2MTExMzE4NDEx
MloXDTI2MTIwMzE4NDExMlowTTEiMCAGA1UEAwwZU0NBREEtU1JWMDEgT1BDIFVB
IFNlcnZlcjEaMBgGA1UECgwRU2FtcGxlIFN1YnN0YXRpb24xCzAJBgNVBAYTAkFF
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAySH/5c7fpZtZ1NJNVSTl
RWE9mNIb+LjCFmmtqfCdk3Ec8ZbTfvy31U8pZsVPwUKNtYJeX370Jcbv/pXi7unv
5ZVK7xra2WqzSVWe1I0iv3jKdttb5OdfnoaEEWvv2nIT3K+6ciwtrLyPPK9+5C6O
sMgplWlSjGIFg11zLzZOcGGk9rlOa7EO/2usNPnmF1ZmiNvuCykzG6T1Mt/4vH3Q
VgPg8RgVv+S7AX9UEBsUMNFWgmlLcNg1jBnNW8P/3pzzei+2spBg+VqPGRj9rKu1
gqWQ1+oMA4Di3dWfnmCB8+Zqxd5T4WT8dyAjvwjku7e+LLqi9xHPGduZd6VQgXoW
AQIDAQABo4GrMIGoMAwGA1UdEwEB/wQCMAAwDgYDVR0PAQH/BAQDAgTwMB0GA1Ud
JQQWMBQGCCsGAQUFBwMBBggrBgEFBQcDAjBKBgNVHREEQzBBhix1cm46U0NBREEt
U1JWMDE6U2FtcGxlU3Vic3RhdGlvbjpPcGNVYVNlcnZlcoILc2NhZGEtc3J2MDGH
BAoNABQwHQYDVR0OBBYEFA4ton+XLIYY6fsm+X6CphBKh4oWMA0GCSqGSIb3DQEB
CwUAA4IBAQA8yypZdpeBrpC+aPe6JEmDPZt9I6q8u8eoBR0EE20ZvVZT+6edyz3L
kA6N1YBvSdQNd4jSzhB++RCBJL1y6go98kCsx9hPqJ2ARvVg4nli5Nto1U43ncvw
mkDZIBtFZxEE3RBZzyinXVBx9l4W59I1qt7B48/qt4SWVRc93SQ9Dt1ju3TOlKiP
mb+wsMG6cu8J+yk61PF/DLO11d+QlPCXPzbSTYvL0nfiPSRD5Vnn3OF6Bc5xqUi6
vrfxblv0L8G2A1vIFtG7ZfadHBMZEfPeM8ojNmp8vKbkrudy3WyxOISX9JlKGgbg
PRDqpaJYywRKEd0PZ/LX1qOYhfxy28Sm
-----END CERTIFICATE-----`;
