"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { FeedbackButton } from "@/components/FeedbackButton";
import { Section, ResultCard, ResultRow, TextField, NumberField, SelectField } from "@/components/fields";
import * as C from "@/lib/scadaconvert";

const fmt = (x: number) => (Number.isFinite(x) ? (Math.abs(x) !== 0 && (Math.abs(x) < 1e-6 || Math.abs(x) >= 1e9) ? x.toExponential(6) : String(Number(x.toPrecision(9)))) : String(x));
const h4 = (n: number) => n.toString(16).toUpperCase().padStart(4, "0");

export default function ScadaValueConverterPage() {
  const [r1s, setR1] = useState("16712");
  const [r2s, setR2] = useState("0");
  const [fv, setFv] = useState(12.5);
  const [notation, setNotation] = useState("40001");
  const [nvaRaw, setNvaRaw] = useState("0x70A4");
  const [eng, setEng] = useState(132);
  const [fs, setFs] = useState(150);
  const [cp, setCp] = useState("82 91 05 0E AD 0B 1A");
  const [qKind, setQKind] = useState<C.IecQualityKind>("DIQ");
  const [qByte, setQByte] = useState("0x82");
  const [q61, setQ61] = useState("4000");

  const r1 = C.parseReg(r1s), r2 = C.parseReg(r2s);
  const pair = useMemo(() => (r1 != null && r2 != null ? C.decodePair(r1, r2) : null), [r1, r2]);
  const enc = useMemo(() => C.encodeFloat(fv), [fv]);
  const nt = useMemo(() => C.parseNotation(notation), [notation]);
  const raw = C.parseReg(nvaRaw);
  const nvaE = useMemo(() => (fs !== 0 ? C.nvaFromEngineering({ engineering: eng, fullScale: fs }) : null), [eng, fs]);
  const cpd = useMemo(() => C.decodeCp56(cp), [cp]);
  const qb = C.parseReg(qByte);
  const q104 = qb != null && qb <= 255 ? C.decode104Quality(qKind, qb) : null;
  const q = useMemo(() => C.decode61850Quality(q61), [q61]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">SCADA Value Converter — Modbus, IEC 104 &amp; IEC 61850</h1>
        <p className="mt-2 max-w-3xl text-muted">
          The conversions SCADA engineers do by hand when a value looks wrong: two Modbus registers to a float or 32-bit integer in all four byte
          orders, Modbus register notation to the protocol address, IEC 60870-5-104 normalised and short-float values, the CP56Time2a time tag,
          and the quality bits of IEC 104 and IEC 61850.
        </p>
        <div className="mt-6 flex flex-wrap gap-3"><FeedbackButton calculatorName="SCADA Value Converter" /></div>
        <div className="mt-6">
          <InfoPanel
            purpose="Most 'wrong value' problems between a device and SCADA are not faults but encoding mismatches: a float read with the words swapped, a register address off by one, a normalised value scaled to the wrong full scale, or a quality flag nobody decoded. This page shows every interpretation side by side so you can see which one matches the real value."
            standards={["Modbus Application Protocol V1.1b3 (function codes, register addressing)", "IEEE 754 single precision floating point", "IEC 60870-5-101/104 (NVA, SVA, short float, CP56Time2a, QDS, SIQ, DIQ)", "IEC 61850-7-3 quality"]}
            capabilities={[
              "Two registers → float32, int32 and uint32 in ABCD, CDAB, BADC and DCBA order; one register → uint16, int16, hex and BCD.",
              "A float → the two registers to write in each order.",
              "Modbus notation (40001, 400001, 30010 …) → table, 0-based protocol address and function codes.",
              "IEC 104 normalised value ↔ raw, engineering value ↔ NVA with resolution, short float byte order on the wire.",
              "CP56Time2a seven bytes → date and time with the invalid and summer-time bits.",
              "IEC 104 QDS / SIQ / DIQ and IEC 61850 quality decoded flag by flag.",
            ]}
            example={{
              problem: "A meter shows 12.5 kV but SCADA reads 2.34e-41 from holding registers 40101–40102 (values 0 and 16712).",
              steps: [
                "Enter register 1 = 0, register 2 = 16712.",
                "ABCD gives 2.34e-41; CDAB gives 12.5.",
                "The device sends the low word first (word swap).",
              ],
              result: "Set the SCADA point (or gateway) to word-swapped float (CDAB).",
            }}
            notes="The converter interprets numbers; it does not read from a device. Check against a known value on the device's display before changing the configuration."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Section title="Modbus: two registers → value">
              <TextField label="Register 1 (lower address)" tip="Decimal (16712), signed decimal (−1), or hex (0x4148 or 4148h)." value={r1s} onChange={setR1} />
              <TextField label="Register 2 (next address)" value={r2s} onChange={setR2} />
            </Section>
            {pair ? (
              <ResultCard title="All four byte orders">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-muted"><th className="py-1 pr-3">Order</th><th className="py-1 pr-3">Bytes</th><th className="py-1 pr-3">float32</th><th className="py-1 pr-3">int32</th><th className="py-1">uint32</th></tr></thead>
                    <tbody>{pair.map((p) => <tr key={p.order} className="border-t border-border text-foreground"><td className="py-1 pr-3 font-mono">{p.order}</td><td className="py-1 pr-3 font-mono text-xs">{p.hex}</td><td className="py-1 pr-3 font-mono">{fmt(p.float32)}</td><td className="py-1 pr-3 font-mono">{p.int32}</td><td className="py-1 font-mono">{p.uint32}</td></tr>)}</tbody>
                  </table>
                </div>
                {r1 != null && (() => { const s = C.decodeSingle(r1); return <p className="mt-3 text-xs text-muted">Register 1 alone: uint16 {s.uint16}, int16 {s.int16}, hex {s.hex}{s.bcd != null ? `, BCD ${s.bcd}` : ""}.</p>; })()}
                <p className="mt-2 text-xs text-muted">The right order is the one that matches the value on the device&apos;s display. Values like 1e-41 or 1e+38 mean the order is wrong.</p>
              </ResultCard>
            ) : <ResultCard title="All four byte orders"><p className="text-fail">Enter two 16-bit registers (0–65535, −32768–32767, or hex).</p></ResultCard>}

            <Section title="Modbus: float → registers to write">
              <NumberField label="Value" value={fv} onChange={setFv} step={0.1} />
            </Section>
            <ResultCard title="Registers to write">
              {enc.map((e) => <ResultRow key={e.order} label={e.order} value={<span className="font-mono">{e.r1} , {e.r2} (0x{h4(e.r1)} 0x{h4(e.r2)})</span>} />)}
            </ResultCard>

            <Section title="Modbus: register notation">
              <TextField label="Notation" placeholder="40001, 400001, 30010, 4x0001" tip="The first digit is the table (0 coils, 1 discrete inputs, 3 input registers, 4 holding registers); the rest is the 1-based register number." value={notation} onChange={setNotation} />
            </Section>
            {nt ? (
              <ResultCard title="What it means on the wire">
                <ResultRow label="Table" value={C.TABLES[nt.table].name} />
                <ResultRow label="Protocol address (0-based)" value={`${nt.protocolAddress} (0x${h4(nt.protocolAddress)})`} />
                <ResultRow label="Notation" value={`${nt.fiveDigit ? nt.fiveDigit + " / " : ""}${nt.sixDigit}`} />
                <ResultRow label="Read with" value={nt.readFc} />
                <ResultRow label="Write with" value={nt.writeFc} />
                {nt.note && <p className="mt-2 text-xs text-muted">{nt.note}</p>}
                <p className="mt-2 text-xs text-muted">Many manuals list 1-based register numbers while the protocol sends the 0-based address. If every value is shifted by one register, this is the reason.</p>
              </ResultCard>
            ) : <ResultCard title="What it means on the wire"><p className="text-fail">Use 5 or 6 digits starting with 0, 1, 3 or 4.</p></ResultCard>}
          </div>

          <div className="space-y-6">
            <Section title="IEC 104: normalised value (M_ME_NA_1)">
              <TextField label="Raw 16-bit value" tip="As sent in the ASDU, decimal or hex." value={nvaRaw} onChange={setNvaRaw} />
              <NumberField label="Engineering value" value={eng} onChange={setEng} />
              <NumberField label="Full scale (engineering value at NVA = 1.0)" value={fs} onChange={setFs} />
            </Section>
            <ResultCard title="Normalised value">
              {raw != null && <ResultRow label="Raw → NVA" value={`${fmt(C.nvaFromRaw(raw))} (× full scale = ${fmt(C.nvaFromRaw(raw) * fs)})`} />}
              {nvaE && <ResultRow label="Engineering → NVA" value={`${fmt(nvaE.nva)}, raw ${nvaE.raw} (0x${nvaE.rawHex})${nvaE.clipped ? " — clipped at the range limit" : ""}`} />}
              {nvaE && <ResultRow label="Resolution" value={`${fmt(nvaE.resolution)} per bit`} />}
              <ResultRow label={`Short float ${eng} on the wire (M_ME_NC_1)`} value={<span className="font-mono">{C.shortFloatBytes(eng)}</span>} />
              <p className="mt-2 text-xs text-muted">NVA covers −1 to +1 − 2⁻¹⁵. Both ends must use the same full scale; a value that saturates at ±1 means the full scale is too small.</p>
            </ResultCard>

            <Section title="IEC 104: CP56Time2a time tag">
              <TextField label="Seven bytes (hex)" placeholder="82 91 05 0E AD 0B 1A" value={cp} onChange={setCp} />
            </Section>
            {cpd ? (
              <ResultCard title="Decoded time">
                <ResultRow label="Date and time" value={<span className={cpd.ok ? "" : "text-fail"}>{cpd.text}</span>} />
                <ResultRow label="Invalid (IV) / summer time (SU)" value={`${cpd.invalid ? "IV set" : "valid"} / ${cpd.summer ? "summer" : "standard"}`} />
                {cpd.notes.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5 text-foreground">{cpd.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>}
                <p className="mt-2 text-xs text-muted">Byte order: milliseconds (2 bytes, low first), minutes + IV, hours + SU, day of month + day of week, month, year (00–99).</p>
              </ResultCard>
            ) : <ResultCard title="Decoded time"><p className="text-fail">Enter exactly seven bytes.</p></ResultCard>}

            <Section title="IEC 104 quality descriptor">
              <SelectField<C.IecQualityKind> label="Type" value={qKind} onChange={setQKind} options={[{ value: "QDS", label: "QDS — measured values" }, { value: "SIQ", label: "SIQ — single point with quality" }, { value: "DIQ", label: "DIQ — double point with quality" }]} />
              <TextField label="Byte" placeholder="0x82" value={qByte} onChange={setQByte} />
            </Section>
            {q104 && (
              <ResultCard title={q104.summary}>
                {q104.value && <ResultRow label="State" value={q104.value} />}
                <ul className="mt-2 space-y-1.5">{q104.flags.map((x) => <li key={x.name}><span className={`mr-2 font-mono text-xs font-semibold ${x.set ? "text-fail" : "text-muted"}`}>{x.name} {x.set ? "1" : "0"}</span><span className="text-foreground">{x.meaning}</span></li>)}</ul>
              </ResultCard>
            )}

            <Section title="IEC 61850 quality">
              <TextField label="Quality" placeholder="4000 or 0100000000000" tip="Either the two content bytes in hex as Wireshark shows them (bit 0 = most significant bit), or the 13 bits 0…12 written out." value={q61} onChange={setQ61} />
            </Section>
            {q ? (
              <ResultCard title={`Validity: ${q.validity}`}>
                <ResultRow label="Flags set" value={q.set.length ? q.set.join(", ") : "none"} />
                <p className="mt-2 text-xs text-muted">Validity good = 00, invalid = 01, reserved = 10, questionable = 11. &ldquo;test&rdquo; means the value comes from a device in test mode; &ldquo;source = substituted&rdquo; means it was not measured.</p>
              </ResultCard>
            ) : <ResultCard title="Validity"><p className="text-fail">Enter 4 hex digits or 13 bits.</p></ResultCard>}
          </div>
        </div>
      </div>
    </div>
  );
}
