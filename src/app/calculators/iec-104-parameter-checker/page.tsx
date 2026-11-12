"use client";

import { useMemo } from "react";
import { useShareableInput } from "@/lib/shareState";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, Section, ResultCard, ResultRow } from "@/components/fields";
import { checkIec104, IEC104_DEFAULTS, PARAM_HELP, type Iec104Input } from "@/lib/iec104params";

const SEV: Record<string, [string, string]> = { error: ["Problem", "text-fail"], warning: ["Check", "text-accent"], info: ["Note", "text-accent-2"], ok: ["OK", "text-pass"] };

export default function Iec104ParameterCheckerPage() {
  const [input, setInput] = useShareableInput<Iec104Input>(IEC104_DEFAULTS);
  const u = (p: Partial<Iec104Input>) => setInput((prev) => ({ ...prev, ...p }));
  const r = useMemo(() => checkIec104(input), [input]);
  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">IEC 60870-5-104 Parameter Checker (k, w, t0–t3)</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Check the link parameters of an IEC 104 connection between a gateway or RTU and the control centre: the window sizes k and w and the
          timers t0, t1, t2 and t3, against the rules of IEC 60870-5-104 — and, with the round-trip time of the link, whether t1 leaves enough time
          on slow, radio or satellite links.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="IEC 60870-5-104 Parameter Check" standardsLine="IEC 60870-5-104" />
          <FeedbackButton calculatorName="IEC 60870-5-104 Parameter Checker" />
        </div>
        <div className="mt-6">
          <InfoPanel
            purpose="IEC 104 connections that drop every few minutes, or stall during an event burst, are often caused by link parameters that do not match each other or the link: w larger than k, t2 not shorter than t1, or a t1 too short for the delay of a radio or satellite link. Both ends must also use the same values."
            standards={["IEC 60870-5-104: k, w, t0–t3, their default values and ranges", "IEC 60870-5-101/104 APCI: I-, S- and U-frames, STARTDT, STOPDT, TESTFR"]}
            capabilities={[
              "Checks w ≤ 2/3 k, w ≤ k, t2 < t1, timer ranges (1–255 s) and t3 relative to t1.",
              "With a measured round-trip time and the link bit rate, estimates the worst case before an acknowledgement arrives and compares it with t1.",
              "Lists every value that differs from the defaults so both ends can be compared.",
            ]}
            example={{
              problem: "A gateway over a cellular link (round trip 900 ms, 64 kbit/s) uses k = 12, w = 10, t1 = 10 s, t2 = 10 s, t3 = 20 s.",
              steps: [
                "w = 10 > 2/3 × 12 = 8: warning.",
                "t2 = 10 s is not shorter than t1 = 10 s: error.",
                "Round trip 0.9 s + sending 12 frames 0.15 s + t2 10 s ≈ 11.1 s > t1 = 10 s: warning.",
              ],
              result: "Use w = 8, t2 = 10 s and t1 = 15 s (the defaults), on both ends.",
            }}
            notes="The checker applies the standard's rules and simple timing arithmetic. The vendor's limits and the control centre's settings also apply."
          />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Window">
              <NumberField label="k" tip={PARAM_HELP.k} value={input.k} onChange={(v) => u({ k: v })} step={1} min={1} />
              <NumberField label="w" tip={PARAM_HELP.w} value={input.w} onChange={(v) => u({ w: v })} step={1} min={1} />
            </Section>
            <Section title="Timers">
              <NumberField label="t0 (connection)" unit="s" tip={PARAM_HELP.t0} value={input.t0} onChange={(v) => u({ t0: v })} step={1} min={1} />
              <NumberField label="t1 (acknowledgement time-out)" unit="s" tip={PARAM_HELP.t1} value={input.t1} onChange={(v) => u({ t1: v })} step={1} min={1} />
              <NumberField label="t2 (acknowledge without data)" unit="s" tip={PARAM_HELP.t2} value={input.t2} onChange={(v) => u({ t2: v })} step={1} min={1} />
              <NumberField label="t3 (test frame when idle)" unit="s" tip={PARAM_HELP.t3} value={input.t3} onChange={(v) => u({ t3: v })} step={1} min={1} />
            </Section>
            <Section title="Link (optional)">
              <NumberField label="Round-trip time" unit="ms" tip="Measured with ping between the two ends. 0 = unknown." value={input.rttMs} onChange={(v) => u({ rttMs: v })} step={10} min={0} />
              <NumberField label="Link bit rate" unit="kbit/s" tip="Slowest part of the path. 0 = unknown." value={input.kbps} onChange={(v) => u({ kbps: v })} step={8} min={0} />
              <NumberField label="Typical I-frame size" unit="bytes" tip="APDU length; about 40 bytes of TCP/IP header are added." value={input.apduBytes} onChange={(v) => u({ apduBytes: v })} step={5} min={6} />
            </Section>
            <button type="button" onClick={() => setInput(IEC104_DEFAULTS)} className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent">Reset to IEC 104 defaults</button>
          </div>
          <div className="lg:col-span-2">
            <div className="space-y-6 lg:sticky lg:top-24">
              <div className={`rounded-xl border p-5 ${r.ok ? "border-pass/50 bg-pass/10 text-pass" : "border-fail/50 bg-fail/10 text-fail"}`}>
                <div className="text-xs uppercase tracking-wide opacity-80">Result</div>
                <div className="mt-1 text-lg font-semibold">{r.ok ? "Parameters are consistent" : "Parameters need correcting"}</div>
              </div>
              {r.windowSendMs != null && (
                <ResultCard title="Link figures">
                  <ResultRow label="k frames incl. TCP/IP" value={`${r.windowKbits!.toFixed(1)} kbit`} />
                  <ResultRow label="Time to send k frames" value={`${r.windowSendMs.toFixed(0)} ms`} />
                </ResultCard>
              )}
              <ResultCard title="Checks">
                <ul className="space-y-2">{r.findings.map((f, i) => <li key={i}><span className={`mr-2 text-xs font-semibold uppercase ${SEV[f.sev][1]}`}>{SEV[f.sev][0]}</span><span className="text-foreground">{f.text}</span></li>)}</ul>
              </ResultCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
