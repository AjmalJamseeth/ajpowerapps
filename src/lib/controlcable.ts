// Control / Instrumentation Cable Sizing — capacitance-limited maximum cable
// length for 4-20mA / HART loops, minimum conductor size guidance, and
// general EMI separation-distance guidance for routing instrument cable
// alongside power/VFD cable. Designed from scratch; general practice figures
// (not a single universal IEC constant) are explicitly caveated as such,
// consistent with how this app already caveats project-specific rules of
// thumb elsewhere (e.g. busbar ambient derating). No equivalent module in
// the source app.

export type ConductorPurpose = "4-20mA" | "hart" | "digital-io" | "general-signal";

export interface ControlCableInput {
  purpose: ConductorPurpose;
  cableLengthM: number | null;
  cableCapPfPerM: number; // manufacturer datasheet value; default is a common STP instrument-cable figure
  maxSystemCapacitanceNf: number | null; // host/multiplexer-specific — from the HART host or barrier datasheet
  runLengthM: number | null; // for min-conductor-size guidance
}

export const DEFAULT_CONTROL_CABLE_INPUT: ControlCableInput = {
  purpose: "hart",
  cableLengthM: 800,
  cableCapPfPerM: 150,
  maxSystemCapacitanceNf: 200,
  runLengthM: 800,
};

export interface ControlCableResult {
  totalCableCapNf: number | null;
  capacitanceOk: boolean | null;
  maxLengthForCapacitanceM: number | null;
  minConductorAwgRecommendation: string;
}

export function calcControlCable(input: ControlCableInput): ControlCableResult {
  const { cableLengthM, cableCapPfPerM, maxSystemCapacitanceNf, runLengthM } = input;

  const totalCableCapNf = cableLengthM != null ? (cableCapPfPerM * cableLengthM) / 1000 : null;
  const capacitanceOk =
    totalCableCapNf != null && maxSystemCapacitanceNf != null ? totalCableCapNf <= maxSystemCapacitanceNf : null;
  const maxLengthForCapacitanceM =
    maxSystemCapacitanceNf != null && cableCapPfPerM > 0 ? (maxSystemCapacitanceNf * 1000) / cableCapPfPerM : null;

  // Common industry guidance (e.g. HART/4-20mA wiring practice): #24 AWG for
  // runs under ~1500 m, step up to #20 AWG beyond that for reduced loop
  // resistance and better noise immunity. This is general practice, not a
  // single hard IEC number — always confirm against the transmitter
  // manufacturer's own wiring guidance and the loop's voltage budget (see
  // the 4-20mA Current Loop Calculator).
  let minConductorAwgRecommendation: string;
  if (runLengthM == null) {
    minConductorAwgRecommendation = "Enter a run length for a recommendation.";
  } else if (runLengthM <= 1500) {
    minConductorAwgRecommendation = "#24 AWG (0.22 mm²) typically adequate for runs up to ~1500 m — confirm against the loop voltage budget.";
  } else {
    minConductorAwgRecommendation = "#20 AWG (0.5 mm²) or larger recommended beyond ~1500 m to keep loop resistance and voltage drop manageable.";
  }

  return { totalCableCapNf, capacitanceOk, maxLengthForCapacitanceM, minConductorAwgRecommendation };
}

// IEEE 518-style general EMI separation-distance guidance. These are
// commonly-cited general-practice figures (not a single official numeric
// matrix confirmed from a primary IEEE 518 source in this session) — the UI
// must caveat this clearly and point users to their project's actual IEEE
// 518 edition / site EMI standard for design-critical spacing.
export const EMI_SEPARATION_GUIDANCE = [
  { pairing: "Shielded twisted-pair instrument cable vs. VFD/motor power cable", distance: "≥150 mm (6 in)" },
  { pairing: "Unshielded instrument cable vs. VFD/motor power cable", distance: "≥300 mm (12 in)" },
  { pairing: "Low-level signal cable vs. high-voltage power cable (Level 1 vs Level 4 susceptibility)", distance: "≥300–600 mm (12–24 in), increasing with power cable current/voltage" },
] as const;
