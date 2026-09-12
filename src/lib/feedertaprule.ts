// Feeder Tap Rule Calculator — NEC 240.21(B) tap conductor compliance
// checks. A "tap conductor" is permitted to be smaller than would
// otherwise be required for the feeder overcurrent device, provided it
// satisfies one of the specific length/ampacity/protection conditions in
// 240.21(B). This covers the three most commonly applied tap rules:
// the 10-ft tap [240.21(B)(1)], the 25-ft tap [240.21(B)(2)], and the
// outside taps of unlimited length rule [240.21(B)(5)]. (The transformer
// primary/secondary tap rules in 240.21(B)(3)/(C) and the over-25-ft
// high-bay manufacturing building rule in 240.21(B)(4) are not covered by
// this simplified tool — consult NEC directly for those specific cases.)
// Designed from scratch; no equivalent module exists elsewhere in AJapps.

export type TapRuleType = "tenFoot" | "twentyFiveFoot" | "outsideUnlimited";

export interface FeederTapInput {
  tapRuleType: TapRuleType;
  feederOcpdRatingA: number | null; // ampere rating of the OCPD protecting the feeder being tapped
  tapConductorAmpacityA: number | null; // ampacity of the tap conductor itself
  tapLengthFt: number | null;
  terminalOcpdRatingA: number | null; // rating of the single OCPD (or sum, for 10-ft rule) the tap terminates in
  protectedFromPhysicalDamage: boolean; // enclosed in raceway or otherwise protected
  outsideExceptAtTermination: boolean; // 240.21(B)(5) condition — only relevant for outsideUnlimited
  ocpdAtOrNearDisconnect: boolean; // 240.21(B)(5) condition
}

export const DEFAULT_FEEDER_TAP_INPUT: FeederTapInput = {
  tapRuleType: "tenFoot",
  feederOcpdRatingA: 400,
  tapConductorAmpacityA: 60,
  tapLengthFt: 8,
  terminalOcpdRatingA: 60,
  protectedFromPhysicalDamage: true,
  outsideExceptAtTermination: true,
  ocpdAtOrNearDisconnect: true,
};

export interface FeederTapCheck {
  label: string;
  pass: boolean | null;
  detail: string;
}

export interface FeederTapResult {
  checks: FeederTapCheck[];
  compliant: boolean | null;
  minTapAmpacityRequiredA: number | null;
}

export function calcFeederTap(input: FeederTapInput): FeederTapResult {
  const { tapRuleType, feederOcpdRatingA, tapConductorAmpacityA, tapLengthFt, terminalOcpdRatingA } = input;

  if (feederOcpdRatingA == null || feederOcpdRatingA <= 0 || tapConductorAmpacityA == null || tapConductorAmpacityA <= 0) {
    return { checks: [], compliant: null, minTapAmpacityRequiredA: null };
  }

  const checks: FeederTapCheck[] = [];
  let minTapAmpacityRequiredA: number | null = null;

  if (tapRuleType === "tenFoot") {
    minTapAmpacityRequiredA = feederOcpdRatingA / 10;
    const lengthOk = tapLengthFt != null && tapLengthFt <= 10;
    const ampacityOk = tapConductorAmpacityA >= minTapAmpacityRequiredA;
    const terminalOk = terminalOcpdRatingA != null && terminalOcpdRatingA <= tapConductorAmpacityA;

    checks.push({ label: "Tap length ≤ 10 ft", pass: lengthOk, detail: `${tapLengthFt ?? "—"} ft` });
    checks.push({ label: "Tap ampacity ≥ 1/10 of feeder OCPD", pass: ampacityOk, detail: `${tapConductorAmpacityA}A ≥ ${minTapAmpacityRequiredA.toFixed(1)}A required` });
    checks.push({ label: "Protected from physical damage (enclosed in raceway)", pass: input.protectedFromPhysicalDamage, detail: input.protectedFromPhysicalDamage ? "Yes" : "No" });
    checks.push({ label: "Terminal OCPD rating ≤ tap ampacity", pass: terminalOk, detail: `${terminalOcpdRatingA ?? "—"}A ≤ ${tapConductorAmpacityA}A` });

    const compliant = lengthOk && ampacityOk && input.protectedFromPhysicalDamage && terminalOk;
    return { checks, compliant, minTapAmpacityRequiredA };
  }

  if (tapRuleType === "twentyFiveFoot") {
    minTapAmpacityRequiredA = feederOcpdRatingA / 3;
    const lengthOk = tapLengthFt != null && tapLengthFt <= 25;
    const ampacityOk = tapConductorAmpacityA >= minTapAmpacityRequiredA;
    const terminalOk = terminalOcpdRatingA != null && terminalOcpdRatingA <= tapConductorAmpacityA;

    checks.push({ label: "Tap length ≤ 25 ft", pass: lengthOk, detail: `${tapLengthFt ?? "—"} ft` });
    checks.push({ label: "Tap ampacity ≥ 1/3 of feeder OCPD", pass: ampacityOk, detail: `${tapConductorAmpacityA}A ≥ ${minTapAmpacityRequiredA.toFixed(1)}A required` });
    checks.push({ label: "Suitably protected from physical damage", pass: input.protectedFromPhysicalDamage, detail: input.protectedFromPhysicalDamage ? "Yes" : "No" });
    checks.push({ label: "Terminal OCPD rating ≤ tap ampacity", pass: terminalOk, detail: `${terminalOcpdRatingA ?? "—"}A ≤ ${tapConductorAmpacityA}A` });

    const compliant = lengthOk && ampacityOk && input.protectedFromPhysicalDamage && terminalOk;
    return { checks, compliant, minTapAmpacityRequiredA };
  }

  // outsideUnlimited — 240.21(B)(5): no minimum ampacity ratio requirement, but several
  // installation conditions must all be met, and the terminal OCPD must limit the load
  // to the tap conductor's ampacity.
  const terminalOk = terminalOcpdRatingA != null && terminalOcpdRatingA <= tapConductorAmpacityA;
  checks.push({ label: "Tap conductors protected from physical damage", pass: input.protectedFromPhysicalDamage, detail: input.protectedFromPhysicalDamage ? "Yes" : "No" });
  checks.push({ label: "Outside the building except at the point of termination", pass: input.outsideExceptAtTermination, detail: input.outsideExceptAtTermination ? "Yes" : "No" });
  checks.push({ label: "OCPD is part of, or immediately adjacent to, the disconnecting means", pass: input.ocpdAtOrNearDisconnect, detail: input.ocpdAtOrNearDisconnect ? "Yes" : "No" });
  checks.push({ label: "Terminal OCPD rating ≤ tap ampacity", pass: terminalOk, detail: `${terminalOcpdRatingA ?? "—"}A ≤ ${tapConductorAmpacityA}A` });

  const compliant = input.protectedFromPhysicalDamage && input.outsideExceptAtTermination && input.ocpdAtOrNearDisconnect && terminalOk;
  return { checks, compliant, minTapAmpacityRequiredA: null };
}
