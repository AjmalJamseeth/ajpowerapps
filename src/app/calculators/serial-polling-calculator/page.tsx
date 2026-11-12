"use client";

import { useMemo } from "react";
import { useShareableInput } from "@/lib/shareState";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section, ResultCard, ResultRow, CheckRow } from "@/components/fields";
import { calcSerial, SERIAL_DEFAULTS, type SerialInput, type Parity, type ProtocolKey } from "@/lib/serialpoll";

const ms = (x: number) => (x >= 100 ? `${x.toFixed(0)} ms` : `${x.toFixed(2)} ms`);

export default function SerialPollingPage() {
  const [input, setInput] = useShareableInput<SerialInput>(SERIAL_DEFAULTS);
  const u = (p: Partial<SerialInput>) => setInput((prev) => ({ ...prev, ...p }));
  const r = useMemo(() => calcSerial(input), [input]);
  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Serial Line &amp; Polling Cycle Calculator (Modbus RTU, RS-485)</h1>
        <p className="mt-2 max-w-3xl text-muted">
          How long does it take to poll every device on an RS-485 line or a radio link? Character time from the baud rate and framing, the Modbus RTU
          inter-frame gap, the time per transaction and the full polling cycle — compared with the scan time the SCADA or gateway needs.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Serial Polling Cycle" standardsLine="Modbus over Serial Line V1.02, TIA/EIA-485" />
          <FeedbackButton calculatorName="Serial Line & Polling Cycle Calculator" />
        </div>
        <div className="mt-6">
          <InfoPanel
            purpose="Slow SCADA updates on serial lines are usually a polling-budget problem: too many devices, too many small requests, a low baud rate or the delay of a radio link. Calculating the cycle shows which one dominates and what to change before adding more devices."
            standards={["Modbus over Serial Line Specification V1.02 (RTU framing, 3.5- and 1.5-character gaps, fixed values above 19 200 baud)", "Modbus Application Protocol V1.1b3 (function 03/04 frame lengths)", "TIA/EIA-485 (multidrop serial line)"]}
            capabilities={[
              "Character time from baud rate, data bits, parity and stop bits.",
              "Modbus RTU t1.5 and t3.5 gaps, request and response frame lengths for function 03/04.",
              "Transaction time with device turnaround and link delay, polling cycle for N devices, updates per second and line utilisation.",
              "Time-outs of offline devices included in the cycle.",
            ]}
            example={{
              problem: "12 meters at 9600 baud 8E1, 2 polls each of 20 registers, 20 ms turnaround, 2 s required scan.",
              steps: [
                "11 bits per character → 1.146 ms per character; t3.5 = 4.01 ms.",
                "Request 8 bytes = 9.17 ms; response 45 bytes = 51.6 ms.",
                "Transaction = 9.17 + 4.01 + 20 + 51.6 + 4.01 = 88.8 ms.",
                "24 polls × 88.8 ms = 2.13 s > 2 s.",
              ],
              result: "Just too slow: read all 40 registers in one request per meter (cycle about 1.6 s) or raise the baud rate to 19 200.",
            }}
            notes="Device turnaround times vary with the device and the request; measure them with a line analyser for an exact budget."
          />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Serial line">
              <SelectField<number> label="Baud rate" value={input.baud} onChange={(v) => u({ baud: Number(v) })} options={[1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200].map((b) => ({ value: b, label: `${b} baud` }))} />
              <SelectField<number> label="Data bits" value={input.dataBits} onChange={(v) => u({ dataBits: Number(v) as 7 | 8 })} options={[{ value: 8, label: "8" }, { value: 7, label: "7 (Modbus ASCII)" }]} />
              <SelectField<Parity> label="Parity" value={input.parity} onChange={(v) => u({ parity: v })} options={[{ value: "even", label: "Even (Modbus default)" }, { value: "odd", label: "Odd" }, { value: "none", label: "None" }]} />
              <SelectField<number> label="Stop bits" value={input.stopBits} onChange={(v) => u({ stopBits: Number(v) as 1 | 2 })} options={[{ value: 1, label: "1" }, { value: 2, label: "2" }]} />
            </Section>
            <Section title="Polling">
              <SelectField<ProtocolKey> label="Protocol" value={input.protocol} onChange={(v) => u({ protocol: v })} options={[{ value: "modbus", label: "Modbus RTU, function 03/04" }, { value: "custom", label: "Other (enter frame sizes)" }]} />
              {input.protocol === "modbus" ? (
                <NumberField label="Registers per request" value={input.registers} onChange={(v) => u({ registers: v })} step={1} min={1} />
              ) : (
                <>
                  <NumberField label="Request frame" unit="bytes" value={input.reqBytes} onChange={(v) => u({ reqBytes: v })} step={1} min={1} />
                  <NumberField label="Response frame" unit="bytes" value={input.respBytes} onChange={(v) => u({ respBytes: v })} step={1} min={1} />
                </>
              )}
              <NumberField label="Devices on the line" value={input.devices} onChange={(v) => u({ devices: v })} step={1} min={1} />
              <NumberField label="Requests per device per cycle" value={input.pollsPerDevice} onChange={(v) => u({ pollsPerDevice: v })} step={1} min={1} />
              <NumberField label="Device turnaround" unit="ms" tip="Time the device takes to start answering after the request ends." value={input.turnaroundMs} onChange={(v) => u({ turnaroundMs: v })} step={5} min={0} />
              <NumberField label="Link delay, each direction" unit="ms" tip="Radio, modem or WAN latency; 0 for a direct RS-485 line." value={input.linkDelayMs} onChange={(v) => u({ linkDelayMs: v })} step={10} min={0} />
            </Section>
            <Section title="Requirement and failures">
              <NumberField label="Required scan time" unit="s" value={input.requiredScanS} onChange={(v) => u({ requiredScanS: v })} step={0.5} min={0.1} />
              <NumberField label="Time-outs per cycle (offline devices)" value={input.retries} onChange={(v) => u({ retries: v })} step={1} min={0} />
              <NumberField label="Response time-out" unit="ms" value={input.timeoutMs} onChange={(v) => u({ timeoutMs: v })} step={50} min={10} />
            </Section>
          </div>
          <div className="lg:col-span-2">
            <div className="space-y-6 lg:sticky lg:top-24">
              <div className={`rounded-xl border p-5 ${r.meetsScan ? "border-pass/50 bg-pass/10 text-pass" : "border-fail/50 bg-fail/10 text-fail"}`}>
                <div className="text-xs uppercase tracking-wide opacity-80">Polling cycle</div>
                <div className="mt-1 text-lg font-semibold">{(r.cycleMs / 1000).toFixed(2)} s {r.meetsScan ? "— meets the scan time" : "— slower than required"}</div>
              </div>
              <ResultCard title="Line">
                <ResultRow label="Bits per character" value={String(r.bitsPerChar)} />
                <ResultRow label="Character time" value={ms(r.charMs)} />
                <ResultRow label="Modbus t1.5 / t3.5" value={`${ms(r.t15Ms)} / ${ms(r.t35Ms)}`} />
              </ResultCard>
              <ResultCard title="Transaction">
                <ResultRow label={`Request ${r.reqBytes} bytes`} value={ms(r.reqMs)} />
                <ResultRow label={`Response ${r.respBytes} bytes`} value={ms(r.respMs)} />
                <ResultRow label="Per transaction" value={ms(r.transactionMs)} />
              </ResultCard>
              <ResultCard title="Cycle">
                <CheckRow label="Polling cycle vs required" value={`${(r.cycleMs / 1000).toFixed(2)} s / ${input.requiredScanS} s`} pass={r.meetsScan} />
                <ResultRow label="Full updates per second" value={r.updatesPerSecond.toFixed(2)} />
                <ResultRow label="Line busy sending data" value={`${r.utilisationPct.toFixed(0)} %`} />
              </ResultCard>
              {r.notes.length > 0 && <ResultCard title="Notes"><ul className="list-disc space-y-1.5 pl-5 text-foreground">{r.notes.map((n, i) => <li key={i}>{n}</li>)}</ul></ResultCard>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
