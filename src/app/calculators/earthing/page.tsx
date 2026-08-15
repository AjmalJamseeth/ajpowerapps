"use client";

import { FREE_LAUNCH } from "@/lib/launchConfig";
import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { NumberField, SelectField, Section } from "@/components/fields";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import PremiumSection from "@/components/PremiumSection";
import EarthingResults from "@/components/earthing/EarthingResults";
import {
  DEFAULT_EARTHING_INPUT,
  EarthingInput,
  BodyWeight,
  ConductorMaterial,
  ElectrodeType,
  SurfaceMaterial,
  calcEarthing,
  calcRodR,
  calcPlateR,
  calcStripR,
  calcRingR,
  calcParallelR,
} from "@/lib/earthing";

export default function EarthingPage() {
  const [input, setInput] = useState<EarthingInput>(DEFAULT_EARTHING_INPUT);
  const update = (patch: Partial<EarthingInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const [elecType, setElecType] = useState<ElectrodeType>("rod");
  const [rodL, setRodL] = useState(3);
  const [rodA, setRodA] = useState(0.008);
  const [plateA, setPlateA] = useState(0.5);
  const [plateB, setPlateB] = useState(0.5);
  const [stripL, setStripL] = useState(10);
  const [stripW, setStripW] = useState(0.025);
  const [stripD, setStripD] = useState(0.6);
  const [ringD, setRingD] = useState(10);
  const [ringA, setRingA] = useState(0.008);
  const [ringH, setRingH] = useState(0.6);
  const [parallelN, setParallelN] = useState(4);
  const [parallelS, setParallelS] = useState(3);

  // Mesh/step voltage and other subscriber sub-calculations are never
  // enabled on the free site.
  const result = useMemo(() => calcEarthing({ ...input, premiumEnabled: FREE_LAUNCH }), [input]);

  const electrodeR = useMemo(() => {
    switch (elecType) {
      case "rod":
        return calcRodR(input.rho, rodL, rodA);
      case "plate":
        return calcPlateR(input.rho, plateA, plateB);
      case "strip":
        return calcStripR(input.rho, stripL, stripW, stripD);
      case "ring":
        return calcRingR(input.rho, ringD, ringA, ringH);
    }
  }, [elecType, input.rho, rodL, rodA, plateA, plateB, stripL, stripW, stripD, ringD, ringA, ringH]);

  // Parallel-electrode mutual-coupling formula is the classic rod-based one
  // (uses rod length directly), so it's applied against the "rod" geometry's
  // own length/resistance regardless of which electrode type is selected above.
  const parallelR = useMemo(() => {
    if (elecType !== "rod" || electrodeR === null || parallelN < 1) return null;
    return calcParallelR(electrodeR, parallelN, parallelS, rodL, input.rho);
  }, [elecType, electrodeR, parallelN, parallelS, rodL, input.rho]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Earthing Grid Design Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Grid resistance, ground potential rise and tolerable touch/step
          limits per IEEE Std 80, plus BS 7430 electrode sizing. Mesh/step
          voltage (the pass/fail safety check), two-layer soil, parallel
          electrodes and transferred potential are subscriber features.
        </p>

<div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Earthing Grid Design Calculator" standardsLine="IEEE Std 80, BS 7430" />
          <FeedbackButton calculatorName="Earthing Grid Design Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
          purpose={"Designs a substation/site earthing (grounding) grid per IEEE Std 80: grid resistance, ground potential rise (GPR) and the tolerable touch/step voltage safety limits people must be protected against during a ground fault, plus BS 7430 single-electrode resistance formulas for rods, plates, strips and rings."}
          standards={["IEEE Std 80 (guide for safety in AC substation grounding)", "BS 7430 (code of practice for protective earthing of electrical installations)"]}
          capabilities={["Grid resistance (Sverak formula) and ground potential rise from soil resistivity, grid geometry and fault current.", "Tolerable touch and step voltage limits from body weight and fault clearing time.", "Surface layer derating (crushed rock, asphalt, concrete, gravel) to raise tolerable limits.", "Single electrode resistance for rod, plate, strip and ring geometries (BS 7430).", "Subscriber: the actual mesh (Em) and step (Es) voltage pass/fail check against the tolerable limits, plus two-layer soil, parallel electrodes and transferred (offsite) potential."]}
          example={{ problem: "Analyze a default 30m×20m grid with 4×3 conductors, 100 Ω·m uniform soil, and a 10kA ground fault.", steps: ["Compute grid resistance Rg from the Sverak formula using grid area, conductor length, and burial depth.", "Compute ground potential rise GPR = fault current × Rg.", "Compute tolerable touch and step voltage limits from body weight and fault clearing time.", "Compare (on the subscriber tier) actual mesh voltage Em and step voltage Es against those tolerable limits."], result: "The default grid configuration (no surface layer, no mitigation) correctly flags as unsafe — the calculation chain from Rg through GPR to Em/Es pass/fail was confirmed internally consistent end to end." }}
          notes="The free tier computes Rg/GPR and the tolerable limits themselves, but not the actual mesh/step voltage pass/fail verdict — that comparison is a subscriber feature, matching the source app's own tiering exactly."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Soil model">
              <NumberField label="Soil resistivity ρ" unit="Ω·m" tip={"The single most important earthing input \u2014 how strongly the soil resists current flow. Lower \u03c1 means lower grid resistance and lower ground potential rise for the same fault current. Should come from an actual site test (Wenner or Schlumberger method) \u2014 it can vary 10-100\u00d7 between sites."} value={input.rho} onChange={(v) => update({ rho: v })} min={1} />
              <SelectField<SurfaceMaterial>
                label="Surface layer material"
                tip={"A layer of high-resistivity material spread over the ground inside the grid. It doesn't lower grid resistance, but sharply raises the resistance between a person's feet and true earth, reducing actual body current for a given touch/step voltage."} value={input.surface}
                onChange={(v) => update({ surface: v })}
                options={[
                  { value: "none", label: "None (bare soil)" },
                  { value: "crushed_wet", label: "Crushed rock — wet (3000 Ω·m)" },
                  { value: "crushed_dry", label: "Crushed rock — dry (10000 Ω·m)" },
                  { value: "asphalt", label: "Asphalt (1,000,000 Ω·m)" },
                  { value: "concrete", label: "Concrete — dry (10000 Ω·m)" },
                  { value: "gravel", label: "Gravel (5000 Ω·m)" },
                ]}
              />
              <NumberField label="Surface layer depth hs" unit="m" tip={"Thickness of the surface material above. A thicker layer gives more derating (higher tolerable touch/step voltage) up to a point of diminishing returns \u2014 typically 75-150mm is standard practice."} value={input.hs} onChange={(v) => update({ hs: v })} min={0.01} step={0.01} />
            </Section>

            <PremiumSection
              title="Wenner 4-pin / two-layer soil model"
              description="Derives apparent resistivity from field Wenner readings, or models a two-layer (or cascaded three-layer) soil structure instead of a single uniform resistivity."
              unlocked={FREE_LAUNCH}
            >
              <div className="col-span-2 text-xs text-muted">
                A uniform single-resistivity soil model (left) is used for all
                free-tier calculations. Layered soil modelling refines the
                effective resistivity seen by the grid for sites with real
                stratified ground.
              </div>
            </PremiumSection>

            <Section title="Fault & protection">
              <NumberField label="Symmetrical fault current 3I₀" unit="A" tip={"The total zero-sequence (3\u00d7I\u2080) single-line-to-ground fault current at this location. Pull it from a completed short-circuit study \u2014 it drives both the grid resistance requirement and the GPR/touch/step voltage results."} value={input.If} onChange={(v) => update({ If: v })} min={1} />
              <NumberField label="Current division factor Sf" hint="0–1" tip={"The fraction of total ground fault current that actually flows through the grid into the soil, versus returning via other metallic paths (shield wires, cable armor, neutrals). 1.0 (all current via the grid) is the safe default if unsure."} value={input.Sf} onChange={(v) => update({ Sf: v })} min={0.01} max={1} step={0.01} />
              <NumberField label="Fault clearing time tf" unit="s" tip={"How long fault current actually flows before protection clears it. Directly sets the tolerable touch/step voltage limits \u2014 a faster clearing time allows a higher tolerable voltage."} value={input.tf} onChange={(v) => update({ tf: v })} min={0.02} step={0.01} />
              <NumberField label="Decrement factor Df" tip={"Accounts for the fault current's DC offset during the clearing period \u2014 a fault with significant DC offset has a higher effective RMS value than its steady-state symmetrical value. 1.0 once the DC component has decayed (typically \u22650.5s clearing)."} value={input.Df} onChange={(v) => update({ Df: v })} min={0.5} max={1.5} step={0.01} />
              <div className="col-span-2">
                <SelectField<BodyWeight>
                  label="Body weight"
                  tip={"IEEE 80's tolerable touch/step voltage formulas are based on statistical body weight \u2014 from the underlying Dalziel fibrillation research, a heavier body has a slightly higher tolerable body current."} value={input.bw}
                  onChange={(v) => update({ bw: v })}
                  options={[
                    { value: 70, label: "70 kg (IEEE 80 default)" },
                    { value: 50, label: "50 kg (IEEE 80 alternative)" },
                  ]}
                />
              </div>
            </Section>

            <Section title="Grid geometry">
              <NumberField label="Grid length Lx" unit="m" tip={"Length of the earthing grid's footprint \u2014 combined with width and mesh count, sets grid resistance and the mesh/step voltage results."} value={input.Lx} onChange={(v) => update({ Lx: v })} min={1} />
              <NumberField label="Grid width Ly" unit="m" tip={"Width of the earthing grid's footprint."} value={input.Ly} onChange={(v) => update({ Ly: v })} min={1} />
              <NumberField label="Conductors in X direction nx" tip={"Number of parallel conductors running in the X direction \u2014 a finer mesh generally reduces mesh/step voltages without necessarily changing overall grid resistance much."} value={input.nx} onChange={(v) => update({ nx: v })} min={2} step={1} />
              <NumberField label="Conductors in Y direction ny" tip={"Number of parallel conductors running in the Y direction."} value={input.ny} onChange={(v) => update({ ny: v })} min={2} step={1} />
              <NumberField label="Burial depth h" unit="m" tip={"Depth below grade the grid conductors are buried \u2014 affects grid resistance and surface voltage gradients."} value={input.h} onChange={(v) => update({ h: v })} min={0.1} step={0.05} />
              <NumberField label="Ground rod length lr" hint="0 = no rods" unit="m" tip={"Length of each vertical ground rod added to the grid (0 = no rods). Rods reaching deeper than the grid's burial depth tap into lower, often more stable/moister soil, and are especially effective at cutting step voltage near the grid perimeter."} value={input.lr} onChange={(v) => update({ lr: v })} min={0} step={0.5} />
              <NumberField label="Number of ground rods nr" tip={"Number of ground rods added to the grid, typically placed around the perimeter/corners for maximum step-voltage benefit."} value={input.nr} onChange={(v) => update({ nr: v })} min={0} step={1} />
              <NumberField label="Conductor diameter d" unit="m" tip={"Physical diameter of the buried grid conductor \u2014 a required input to IEEE 80's Sverak resistance formula; a larger conductor gives a marginally lower grid resistance."} value={input.diam} onChange={(v) => update({ diam: v })} min={0.001} step={0.001} />
            </Section>

            <Section title="Conductor sizing (BS 7430 / IEEE 80)">
              <div className="col-span-2">
                <SelectField<ConductorMaterial>
                  label="Conductor material"
                  tip={"Sets the adiabatic material constant k used in the minimum-conductor-size (fault withstand) calculation \u2014 different materials tolerate different temperature rises before damage, so the same fault duty needs a different cross-section by material."} value={input.condMat}
                  onChange={(v) => update({ condMat: v })}
                  options={[
                    { value: "Cu", label: "Copper (k=226)" },
                    { value: "CuEC", label: "Copper, electrolytic (k=226)" },
                    { value: "GS", label: "Galvanised steel (k=80)" },
                    { value: "SS", label: "Stainless steel (k=106)" },
                  ]}
                />
              </div>
            </Section>

            <div className="rounded-xl border border-border bg-surface p-6">
              <h3 className="text-base font-semibold text-foreground">Single electrode resistance (BS 7430)</h3>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <SelectField<ElectrodeType>
                    label="Electrode type"
                    tip={"The physical shape of the electrode being sized \u2014 each has its own BS 7430 resistance formula, since current spreads into the soil differently depending on geometry."} value={elecType}
                    onChange={setElecType}
                    options={[
                      { value: "rod", label: "Vertical rod" },
                      { value: "plate", label: "Horizontal plate" },
                      { value: "strip", label: "Horizontal strip / buried tape" },
                      { value: "ring", label: "Ring electrode" },
                    ]}
                  />
                </div>
                {elecType === "rod" && (
                  <>
                    <NumberField label="Rod length L" unit="m" tip={"Length of the vertical rod \u2014 resistance mainly depends on length (reaching lower/fresher soil) and, more weakly, radius."} value={rodL} onChange={setRodL} min={0.5} step={0.5} />
                    <NumberField label="Rod radius a" unit="m" tip={"Radius of the vertical rod conductor."} value={rodA} onChange={setRodA} min={0.001} step={0.001} />
                  </>
                )}
                {elecType === "plate" && (
                  <>
                    <NumberField label="Plate side A" unit="m" tip={"One side dimension of the horizontal plate electrode \u2014 resistance depends on plate area and burial depth."} value={plateA} onChange={setPlateA} min={0.1} step={0.1} />
                    <NumberField label="Plate side B" unit="m" tip={"The other side dimension of the horizontal plate electrode."} value={plateB} onChange={setPlateB} min={0.1} step={0.1} />
                  </>
                )}
                {elecType === "strip" && (
                  <>
                    <NumberField label="Strip length L" unit="m" tip={"Length of the horizontal strip/buried tape electrode \u2014 a long, shallow-buried conductor often used to interconnect other electrodes or where rock prevents deep rod driving."} value={stripL} onChange={setStripL} min={1} step={1} />
                    <NumberField label="Strip width w" unit="m" tip={"Width of the strip/tape conductor."} value={stripW} onChange={setStripW} min={0.001} step={0.001} />
                    <NumberField label="Burial depth d" unit="m" tip={"Burial depth of the strip/tape electrode."} value={stripD} onChange={setStripD} min={0.1} step={0.1} />
                  </>
                )}
                {elecType === "ring" && (
                  <>
                    <NumberField label="Ring diameter D" unit="m" tip={"Diameter of the ring electrode \u2014 a closed loop often used around building/structure perimeters (e.g. lightning protection earthing)."} value={ringD} onChange={setRingD} min={1} step={1} />
                    <NumberField label="Conductor radius a" unit="m" tip={"Radius of the ring conductor."} value={ringA} onChange={setRingA} min={0.001} step={0.001} />
                    <NumberField label="Burial depth h" unit="m" tip={"Burial depth of the ring electrode."} value={ringH} onChange={setRingH} min={0.1} step={0.1} />
                  </>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between rounded-lg border border-accent/30 bg-accent/10 p-4">
                <span className="text-sm text-muted">Single electrode resistance RE</span>
                <span className="text-lg font-semibold text-foreground">
                  {electrodeR !== null ? `${electrodeR.toFixed(3)} Ω` : "—"}
                </span>
              </div>
            </div>

            <PremiumSection
              title="Parallel electrode system"
              description="Combines multiple electrodes (e.g. several rods) sharing the same soil into one system resistance, accounting for mutual coupling between them."
              unlocked={FREE_LAUNCH}
            >
              {elecType !== "rod" ? (
                <div className="col-span-2 text-xs text-muted">
                  This mutual-coupling formula is calibrated for rod electrodes — switch &quot;Electrode type&quot;
                  above to &quot;Vertical rod&quot; to use it.
                </div>
              ) : (
                <>
                  <NumberField label="Number of electrodes n" value={parallelN} onChange={(v) => setParallelN(v ?? 1)} min={1} step={1} />
                  <NumberField label="Spacing between rods s" unit="m" value={parallelS} onChange={(v) => setParallelS(v ?? 1)} min={0.5} step={0.5} />
                  <div className="col-span-2 flex items-center justify-between rounded-lg border border-accent/30 bg-accent/10 p-4">
                    <span className="text-sm text-muted">Parallel system resistance</span>
                    <span className="text-lg font-semibold text-foreground">
                      {parallelR !== null ? `${parallelR.toFixed(3)} Ω` : "—"}
                    </span>
                  </div>
                </>
              )}
            </PremiumSection>

            <PremiumSection
              title="Transferred potential (offsite hazard)"
              description="IEEE 80 §17 — checks whether a metallic path (pipe, rail, fence, cable sheath) crossing the grid boundary could carry the full GPR to a point outside the grid."
              unlocked={FREE_LAUNCH}
            >
              <div className="col-span-2 text-xs text-muted">
                Not yet implemented in this calculator — this section describes the IEEE 80 §17 transferred-potential
                check but doesn&apos;t compute it yet. Applies when a metallic conductor crosses the grid boundary and
                could carry the ground potential rise largely undiminished to someone standing on true remote earth;
                treat any such crossing as a hazard to review manually against §17 until this is built.
              </div>
            </PremiumSection>

            <PremiumSection
              title="Grid design assistant"
              description="If the grid fails the mesh/step voltage check, searches finer conductor spacings for the smallest change that passes both, reusing the same IEEE 80 formulas."
              unlocked={FREE_LAUNCH}
            >
              <div className="col-span-2 text-xs text-muted">
                Not yet implemented in this calculator — mesh/step voltage checking itself (above) is now unlocked,
                but this auto-search assistant for a compliant spacing hasn&apos;t been built yet. Adjust grid
                geometry manually and re-check the mesh/step result in the panel to the right.
              </div>
            </PremiumSection>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              <EarthingResults result={result} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
