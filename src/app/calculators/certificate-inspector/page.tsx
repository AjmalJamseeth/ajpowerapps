"use client";

import { useEffect, useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { FeedbackButton } from "@/components/FeedbackButton";
import { Section, ResultCard, ResultRow, TextField, SelectField } from "@/components/fields";
import { loadCerts, parseCert, checkCert, chainOrder, fingerprints, SAMPLE_CERT, type Purpose, type CertInfo } from "@/lib/certinspect";

const SEV: Record<string, [string, string]> = { error: ["Problem", "text-fail"], warning: ["Check", "text-accent"], info: ["Note", "text-accent-2"], ok: ["OK", "text-pass"] };

export default function CertificateInspectorPage() {
  const [pem, setPem] = useState(SAMPLE_CERT);
  const [der, setDer] = useState<Uint8Array | null>(null);
  const [purpose, setPurpose] = useState<Purpose>("opcua");
  const [host, setHost] = useState("10.13.0.20");
  const [fps, setFps] = useState<{ sha1: string; sha256: string }[]>([]);
  const parsed = useMemo(() => {
    try {
      const list = der ? loadCerts(der) : loadCerts(pem);
      return { certs: list.map(parseCert), err: list.length ? "" : "No certificate found. Paste PEM text (-----BEGIN CERTIFICATE-----) or open a .cer/.crt/.der/.pem file." };
    } catch (e) {
      return { certs: [] as CertInfo[], err: "Could not read the certificate: " + (e as Error).message };
    }
  }, [pem, der]);
  useEffect(() => { let on = true; Promise.all(parsed.certs.map((c) => fingerprints(c.der))).then((r) => on && setFps(r.map((x) => x ?? { sha1: "—", sha256: "—" }))); return () => { on = false; }; }, [parsed]);
  const onFile = (f?: File) => { if (!f) return; const r = new FileReader(); r.onload = () => { const u = new Uint8Array(r.result as ArrayBuffer); if (u[0] === 0x30) { setDer(u); } else { setDer(null); setPem(new TextDecoder().decode(u)); } }; r.readAsArrayBuffer(f); };
  const d = (x: Date) => (isNaN(x.getTime()) ? "—" : x.toISOString().replace("T", " ").slice(0, 16) + " UTC");
  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Certificate Inspector — OPC UA, TLS &amp; IEC 62351</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Open a certificate file or paste PEM text to see who it belongs to, who issued it, when it expires, its key and signature, and its
          names and usages — with checks for expiry, weak algorithms, name mismatches and what OPC UA applications expect. Nothing is uploaded.
        </p>
        <div className="mt-6 flex flex-wrap gap-3"><FeedbackButton calculatorName="Certificate Inspector" /></div>
        <div className="mt-6">
          <InfoPanel
            purpose="OPC UA, HTTPS device interfaces, IEC 62351 secured protocols and VPNs all depend on certificates. An expired certificate, a missing ApplicationUri or a name mismatch stops communication with an error that rarely says why. This inspector reads the certificate and tells you."
            standards={["X.509 v3 certificates (RFC 5280)", "OPC UA application instance certificates (OPC 10000-4 and -6)", "TLS server identity (RFC 6125)", "IEC 62351-3 / -8 (TLS and certificates for power-system protocols)"]}
            capabilities={[
              "Reads PEM (one or a chain) and DER files (.cer, .crt, .der, .pem) in the browser.",
              "Subject, issuer, serial, validity, key algorithm and size, signature algorithm, key usage, extended key usage, subject alternative names, key identifiers, CRL locations, SHA-1 thumbprint and SHA-256 fingerprint.",
              "Checks: expired or soon expiring, not yet valid, SHA-1/MD5 signatures, short RSA keys, self-signed, missing names, host or IP mismatch, OPC UA ApplicationUri and key usages, chain order.",
            ]}
            example={{
              problem: "The sample OPC UA server certificate of SCADA-SRV01.",
              steps: ["Self-signed RSA 2048, SHA-256.", "SAN: URI urn:SCADA-SRV01:SampleSubstation:OpcUaServer, DNS scada-srv01, IP 10.13.0.20.", "Valid for 20 days from 13 November 2026."],
              result: "Correct for OPC UA, but expiring soon: renew it and copy the new certificate to every client's trusted store before 3 December.",
            }}
            notes="Password-protected .pfx/.p12 files are not read; export the certificate part (without the private key) as .cer first. Never paste a private key into any website."
          />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-2">
            <Section title="Certificate">
              <div className="flex flex-wrap gap-2">
                <label className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent">Open file…<input type="file" accept=".cer,.crt,.der,.pem" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} /></label>
                <button type="button" onClick={() => { setDer(null); setPem(SAMPLE_CERT); }} className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent">Load sample</button>
              </div>
              <textarea value={der ? "(binary DER file loaded)" : pem} onChange={(e) => { setDer(null); setPem(e.target.value); }} rows={10} spellCheck={false} aria-label="PEM certificate" className="mt-3 w-full rounded-lg border border-border bg-surface p-3 font-mono text-[11px] text-foreground" />
            </Section>
            <Section title="Check for">
              <SelectField<Purpose> label="Use" value={purpose} onChange={setPurpose} options={[{ value: "opcua", label: "OPC UA application certificate" }, { value: "tls-server", label: "TLS / HTTPS server" }, { value: "any", label: "General" }]} />
              {purpose === "tls-server" && <TextField label="Host name or IP clients connect to" value={host} onChange={setHost} />}
            </Section>
          </div>
          <div className="space-y-6 lg:col-span-3">
            {parsed.err && <ResultCard title="Certificate"><p className="text-fail">{parsed.err}</p></ResultCard>}
            {parsed.certs.length > 1 && <ResultCard title="Chain"><ul className="space-y-1.5">{chainOrder(parsed.certs).map((c, i) => <li key={i}><span className={`mr-2 text-xs font-semibold uppercase ${SEV[c.sev][1]}`}>{SEV[c.sev][0]}</span>{c.text}</li>)}</ul></ResultCard>}
            {parsed.certs.map((c, k) => (
              <div key={k} className="space-y-4">
                <ResultCard title={`${parsed.certs.length > 1 ? `Certificate ${k + 1}: ` : ""}${c.subjectCN || c.subject}`}>
                  <ul className="space-y-2">{checkCert(c, purpose, new Date(), purpose === "tls-server" ? host : "").map((x, i) => <li key={i}><span className={`mr-2 text-xs font-semibold uppercase ${SEV[x.sev][1]}`}>{SEV[x.sev][0]}</span><span className="text-foreground">{x.text}</span></li>)}</ul>
                </ResultCard>
                <ResultCard title="Details">
                  <ResultRow label="Subject" value={c.subject} />
                  <ResultRow label="Issuer" value={c.issuer + (c.selfSigned ? " (self-signed)" : "")} />
                  <ResultRow label="Valid from / until" value={`${d(c.notBefore)} → ${d(c.notAfter)}`} />
                  <ResultRow label="Key" value={`${c.keyAlg} ${c.keySize}`} />
                  <ResultRow label="Signature" value={c.sigAlg} />
                  <ResultRow label="Serial number" value={<span className="break-all font-mono text-xs">{c.serial}</span>} />
                  <ResultRow label="Subject alternative names" value={c.san.map((s) => `${s.type}: ${s.value}`).join(" · ") || "none"} />
                  <ResultRow label="Key usage" value={c.keyUsage.join(", ") || "—"} />
                  <ResultRow label="Extended key usage" value={c.eku.join(", ") || "—"} />
                  <ResultRow label="CA" value={c.ca == null ? "—" : c.ca ? "yes" : "no"} />
                  {fps[k] && <ResultRow label="Thumbprint (SHA-1)" value={<span className="break-all font-mono text-xs">{fps[k].sha1}</span>} />}
                  {fps[k] && <ResultRow label="SHA-256 fingerprint" value={<span className="break-all font-mono text-xs">{fps[k].sha256}</span>} />}
                  {c.crl.length > 0 && <ResultRow label="CRL" value={c.crl.join(", ")} />}
                  <p className="mt-2 text-xs text-muted">Windows certificate manager and OPC UA trust lists identify certificates by the SHA-1 thumbprint.</p>
                </ResultCard>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
