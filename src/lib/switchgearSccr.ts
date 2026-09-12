// Switchgear Short-Circuit Rating (SCCR) Calculator — prospective
// (bolted, symmetrical) fault current at a transformer's secondary from
// its kVA and %impedance, an approximate peak asymmetrical fault current,
// and a pass/fail check of the downstream switchgear's SCCR/AIC rating
// against that available fault current, per NEC 110.9/110.10. This is a
// single-transformer screening calculation — it ignores upstream
// utility/source impedance and downstream cable impedance, so it reads
// somewhat higher than a full let-through study (which is conservative
// for a first-pass screening check). The 1.8 peak asymmetry multiplier is
// a commonly used conservative worst-case figure (full asymmetry, low
// X/R systems can be lower) rather than a literal IEC 60909 κ factor
// computed from the actual X/R ratio — flagged as a screening
// simplification. Designed from scratch; no equivalent module exists
// elsewhere in AJapps (the existing Fault Current Propagation calculator
// covers cascading multi-point Base kVA Method studies).

export interface SwitchgearSccrInput {
  transformerKva: number | null;
  secondaryVoltageV: number | null;
  transformerPctZ: number | null;
  deviceAicRatingA: number | null; // OCPD interrupting rating
  equipmentSccrRatingA: number | null; // switchgear/panelboard SCCR nameplate rating
}

export const DEFAULT_SWITCHGEAR_SCCR_INPUT: SwitchgearSccrInput = {
  transformerKva: 1500,
  secondaryVoltageV: 480,
  transformerPctZ: 5.75,
  deviceAicRatingA: 42000,
  equipmentSccrRatingA: 42000,
};

export interface SwitchgearSccrResult {
  faultCurrentRmsA: number | null;
  peakFaultCurrentA: number | null;
  deviceAicOk: boolean | null;
  equipmentSccrOk: boolean | null;
  overallOk: boolean | null;
}

const PEAK_ASYMMETRY_MULTIPLIER = 1.8; // conservative worst-case figure — see module notes

export function calcSwitchgearSccr(input: SwitchgearSccrInput): SwitchgearSccrResult {
  const { transformerKva, secondaryVoltageV, transformerPctZ, deviceAicRatingA, equipmentSccrRatingA } = input;
  const empty: SwitchgearSccrResult = { faultCurrentRmsA: null, peakFaultCurrentA: null, deviceAicOk: null, equipmentSccrOk: null, overallOk: null };

  if (transformerKva == null || transformerKva <= 0 || secondaryVoltageV == null || secondaryVoltageV <= 0 || transformerPctZ == null || transformerPctZ <= 0) {
    return empty;
  }

  const fullLoadCurrentA = (transformerKva * 1000) / (Math.sqrt(3) * secondaryVoltageV);
  const faultCurrentRmsA = fullLoadCurrentA / (transformerPctZ / 100);
  const peakFaultCurrentA = faultCurrentRmsA * Math.sqrt(2) * PEAK_ASYMMETRY_MULTIPLIER;

  const deviceAicOk = deviceAicRatingA != null ? deviceAicRatingA >= faultCurrentRmsA : null;
  const equipmentSccrOk = equipmentSccrRatingA != null ? equipmentSccrRatingA >= faultCurrentRmsA : null;
  const overallOk = deviceAicOk != null && equipmentSccrOk != null ? deviceAicOk && equipmentSccrOk : null;

  return { faultCurrentRmsA, peakFaultCurrentA, deviceAicOk, equipmentSccrOk, overallOk };
}
