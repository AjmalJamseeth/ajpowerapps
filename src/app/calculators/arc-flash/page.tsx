"use client";

import { FREE_LAUNCH } from "@/lib/launchConfig";
import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { NumberField, SelectField, Section } from "@/components/fields";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import PremiumSection from "@/components/PremiumSection";
import ArcFlashResults from "@/components/arcflash/ArcFlashResults";
import {
  ArcFlashMethod,
  Enclosure,
  Grounding,
  EquipClassKey,
  ElectrodeConfig,
  AF_EQUIP_CLASSES,
  ELECTRODE_CONFIGS,
  calcArcingCurrent,
  calcNormalizedEnergy,
  calcIncidentEnergy2002,
  calcArcFlashBoundary2002,
  ppeCategory,
  calcLeeIncidentEnergy,
  calcLeeBoundary,
} from "@/lib/arcflash";

const METHOD_OPTIONS: { value: ArcFlashMethod; label: string }[] = [
  { value: "ieee2002", label: "IEEE 1584-2002 (Empirical)" },
  { value: "lee", label: "Ralph Lee (Theoretical)" },
  { value: "ieee2018", label: "IEEE 1584-2018 (Empirical) — subscriber" },
];

export default function ArcFlashPage() {
  const [method, setMethod] = useState<ArcFlashMethod>("ieee2002");

  const [ibf, setIbf] = useState<number | null>(25);
  const [voltage, setVoltage] = useState<number | null>(0.415);
  const [distance, setDistance] = useState<number | null>(455);
  const [time, setTime] = useState<number | null>(0.2);

  const [equipClass, setEquipClass] = useState<EquipClassKey>("lv_mcc");
  const [enclosure, setEnclosure] = useState<Enclosure>("box");
  const [grounding, setGrounding] = useState<Grounding>("grounded");
  const [gap, setGap] = useState<number | null>(AF_EQUIP_CLASSES.lv_mcc.G);
  const [exponent, setExponent] = useState<number | null>(AF_EQUIP_CLASSES.lv_mcc.x);

  const [config2018, setConfig2018] = useState<ElectrodeConfig>("VCB");
  const [gap2018, setGap2018] = useState<number | null>(104);
  const [width2018, setWidth2018] = useState<number | null>(762);
  const [height2018, setHeight2018] = useState<number | null>(1143);
  const [depth2018, setDepth2018] = useState<number | null>(500);

  const onEquipClassChange = (cls: EquipClassKey) => {
    setEquipClass(cls);
    const c = AF_EQUIP_CLASSES[cls];
    setGap(c.G);
    setExponent(c.x);
    setDistance(c.D);
  };

  const result = useMemo(() => {
    if (!ibf || !voltage || !distance || !time) {
      return { ready: false, arcingCurrent: null, incidentEnergy: null, boundaryMm: null, ppe: null, rangeWarning: null };
    }

    if (method === "lee") {
      const E = calcLeeIncidentEnergy(voltage, ibf, time, distance);
      const AFB = calcLeeBoundary(voltage, ibf, time);
      return { ready: true, arcingCurrent: null, incidentEnergy: E, boundaryMm: AFB, ppe: ppeCategory(E), rangeWarning: null };
    }

    if (method === "ieee2018") {
      // Subscriber-only — no live calculation on the free site yet.
      return { ready: false, arcingCurrent: null, incidentEnergy: null, boundaryMm: null, ppe: null, rangeWarning: null };
    }

    // IEEE 1584-2002
    if (!gap || !exponent) {
      return { ready: false, arcingCurrent: null, incidentEnergy: null, boundaryMm: null, ppe: null, rangeWarning: null };
    }
    const rangeWarning =
      ibf < 0.7 || ibf > 106 || voltage < 0.208 || voltage > 15
        ? "Outside the IEEE 1584-2002 validated range (0.7–106 kA, 0.208–15 kV) — consider the Ralph Lee method instead."
        : null;
    const Ia = calcArcingCurrent(ibf, voltage, gap, enclosure);
    const En = calcNormalizedEnergy(Ia, gap, enclosure, grounding);
    const E = calcIncidentEnergy2002(En, voltage, time, distance, exponent);
    const AFB = calcArcFlashBoundary2002(En, voltage, time, exponent);
    return { ready: true, arcingCurrent: Ia, incidentEnergy: E, boundaryMm: AFB, ppe: ppeCategory(E), rangeWarning };
  }, [method, ibf, voltage, distance, time, gap, exponent, enclosure, grounding]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Arc Flash Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Incident energy, arc flash boundary and PPE category. IEEE 1584-2002
          and the Ralph Lee theoretical method are free; IEEE 1584-2018 is a
          subscriber feature.
        </p>

<div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Arc Flash Calculator" standardsLine="IEEE 1584-2002/2018, Ralph Lee" />
          <FeedbackButton calculatorName="Arc Flash Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
          purpose={"Calculates the incident energy, arc flash boundary and required PPE category for a point in an electrical system — the core hazard analysis behind arc-flash warning labels and safe-work-distance/PPE decisions for live or potentially-live electrical work."}
          standards={["IEEE 1584-2002 (empirical arc-flash hazard model)", "IEEE 1584-2018 (current edition, subscriber feature)", "Ralph Lee theoretical model (Lee, 1982)"]}
          capabilities={["IEEE 1584-2002 empirical model — arcing current, incident energy, arc flash boundary and PPE category from equipment class, enclosure, gap and grounding.", "Ralph Lee theoretical model — no equipment class or gap needed, works at any voltage, generally more conservative and used as the fallback above 15kV.", "Out-of-range warnings when inputs fall outside the IEEE 1584-2002 validated range (0.7-106kA, 0.208-15kV).", "Subscriber: IEEE 1584-2018, the current edition, with electrode configuration and enclosure size correction."]}
          example={{ problem: "A 415V LV MCC with a 25kA bolted fault current, 455mm working distance and a 0.2s clearing time. Estimate the incident energy using IEEE 1584-2002.", steps: ["Look up typical gap (G) and distance exponent (x) for the LV MCC equipment class.", "Compute arcing current Ia from bolted fault current, voltage, gap and enclosure type.", "Compute normalized incident energy En from Ia, gap, enclosure and grounding.", "Scale En by voltage, time and working distance to get incident energy E, and compute the arc flash boundary from the same normalized energy."], result: "The resulting incident energy determines the PPE category (from a standard cal/cm² table) and the arc flash boundary defines the distance at which incident energy drops to the 1.2 cal/cm² onset-of-second-degree-burn threshold." }}
          notes="A bug in the source app was found and fixed here: IEEE 1584-2002 defines separate arcing-current equations for ≤1kV and 1-15kV systems, but the source app applied the ≤1kV equation at every voltage, producing nonphysical results (arcing current exceeding the bolted fault current) above 1kV. This calculator implements both equations correctly."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Calculation method">
              <div className="col-span-2">
                <SelectField<ArcFlashMethod>
                  label="Method"
                  tip={"Choice of arc-flash model. IEEE 1584-2002 is empirical and needs equipment class/enclosure/gap/grounding data; Ralph Lee is a simpler theoretical model needing only voltage, fault current, time and distance, generally more conservative and used above the 2002 model's validated range."} value={method}
                  onChange={setMethod}
                  options={METHOD_OPTIONS}
                />
              </div>
              <div className="col-span-2 text-xs text-muted">
                {method === "ieee2002" &&
                  "Empirical model validated for 0.208–15 kV and 0.7–106 kA bolted fault current. Accounts for equipment enclosure, gap and grounding."}
                {method === "lee" &&
                  "Theoretical model — no equipment class, enclosure or gap needed, just voltage, fault current, time and distance. Use above 15 kV or wherever the empirical model doesn't apply. Generally more conservative."}
                {method === "ieee2018" &&
                  "Subscriber feature — see the locked section below. Switch to 2002 or Ralph Lee above for a computed result today."}
              </div>
            </Section>

            <Section title="Fault & timing">
              <NumberField label="Bolted fault current Ibf" unit="kA" tip={"The bolted (three-phase) fault current available at this point, from a short-circuit study \u2014 the starting point for the arcing current calculation (which is always somewhat lower than the bolted value)."} value={ibf} onChange={setIbf} min={0.1} />
              <NumberField label="System voltage" unit="kV" tip={"System voltage at the point of work \u2014 sets which model equations/coefficients apply and directly scales incident energy."} value={voltage} onChange={setVoltage} min={0.05} step={0.001} />
              <NumberField label="Working distance D" unit="mm" tip={"Working distance \u2014 how far the worker's face/chest is from the potential arc source during the task. Incident energy falls off sharply with distance, so this has a large effect on the result."} value={distance} onChange={setDistance} min={1} />
              <NumberField label="Arc duration / clearing time" unit="s" tip={"Total time the arc is allowed to burn before the upstream protective device clears it \u2014 normally taken from the relay/breaker's actual trip-time curve at the arcing current, not the bolted-fault trip time."} value={time} onChange={setTime} min={0.001} step={0.001} />
            </Section>

            {method === "ieee2002" && (
              <Section title="Equipment & enclosure (IEEE 1584-2002)">
                <div className="col-span-2">
                  <SelectField<EquipClassKey>
                    label="Equipment class"
                    hint="sets typical gap/exponent/distance — override below if known"
                    tip={"Auto-fills typical conductor gap, distance exponent and working distance for common equipment types (switchgear, MCC, panelboard, cable) \u2014 override the individual values below if you have equipment-specific data."} value={equipClass}
                    onChange={onEquipClassChange}
                    options={Object.entries(AF_EQUIP_CLASSES).map(([value, c]) => ({
                      value: value as EquipClassKey,
                      label: c.label,
                    }))}
                  />
                </div>
                <SelectField<Enclosure>
                  label="Enclosure"
                  tip={"Whether the arc occurs inside an enclosure (box) or in open air \u2014 enclosed arcs concentrate and reflect more energy toward the worker than an open-air arc of the same current."} value={enclosure}
                  onChange={setEnclosure}
                  options={[
                    { value: "box", label: "Box (enclosed equipment)" },
                    { value: "open", label: "Open air" },
                  ]}
                />
                <SelectField<Grounding>
                  label="System grounding"
                  tip={"System grounding affects arc behavior and is one of the IEEE 1584-2002 model's direct inputs to normalized incident energy."} value={grounding}
                  onChange={setGrounding}
                  options={[
                    { value: "grounded", label: "Solidly grounded" },
                    { value: "ungrounded", label: "Ungrounded / high-resistance grounded" },
                  ]}
                />
                <NumberField label="Conductor gap G" hint="auto-filled by equipment class" unit="mm" tip={"Conductor gap \u2014 the spacing between phase conductors at the arc location, from equipment datasheets or IEEE 1584's typical values by equipment class. Auto-filled by equipment class, but override if known precisely."} value={gap} onChange={setGap} min={1} />
                <NumberField label="Distance exponent x" hint="auto-filled by equipment class" tip={"Distance exponent (x) \u2014 an empirical factor from IEEE 1584-2002 controlling how quickly incident energy falls off with working distance, specific to equipment class/voltage. Auto-filled by equipment class."} value={exponent} onChange={setExponent} min={0.1} step={0.001} />
              </Section>
            )}

            <PremiumSection
              title="IEEE 1584-2018 (600 V < Voc ≤ 15 kV)"
              description="Configuration-specific empirical model with enclosure size correction and arcing-current variation check — the current edition of the standard."
              unlocked={FREE_LAUNCH}
            >
              <div className="col-span-2">
                <SelectField<ElectrodeConfig>
                  label="Electrode configuration"
                  value={config2018}
                  onChange={setConfig2018}
                  options={ELECTRODE_CONFIGS}
                  disabled
                />
              </div>
              <NumberField label="Conductor gap G" unit="mm" value={gap2018} onChange={setGap2018} disabled />
              <NumberField label="Enclosure width" hint="ignored for VOA/HOA" unit="mm" value={width2018} onChange={setWidth2018} disabled />
              <NumberField label="Enclosure height" unit="mm" value={height2018} onChange={setHeight2018} disabled />
              <NumberField label="Enclosure depth" hint="shallow LV enclosures only" unit="mm" value={depth2018} onChange={setDepth2018} disabled />
              <div className="col-span-2 rounded-lg border border-border bg-surface-2 p-3 text-xs text-muted">
                Note: even once unlocked, this implementation covers 600 V &lt; Voc ≤ 15 kV only — for
                systems at or below 600 V, 2002 or Ralph Lee remain the methods to use. The enclosure
                size correction factor is partially verified against IEEE&apos;s own Annex D example — treat
                CF-dependent results as indicative pending full resolution.
              </div>
            </PremiumSection>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              <ArcFlashResults
                ready={result.ready}
                arcingCurrent={result.arcingCurrent}
                incidentEnergy={result.incidentEnergy}
                boundaryMm={result.boundaryMm}
                ppe={result.ppe}
                rangeWarning={result.rangeWarning}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
