// Overhead Line Voltage Regulation — approximate voltage drop / regulation
// for a single circuit given user-supplied R and X per km (deliberately NOT
// embedding an ACSR/AAAC/AAC conductor table, to avoid transcription risk;
// the user enters R and X per km for the specific conductor/spacing from
// their own datasheet). Standard short-line approximate voltage-drop
// formula: Vdrop (approx, per phase) = I x (R cos(phi) + X sin(phi)) x
// length; %Reg = Vdrop_line-line / Vsend x 100 for a 3-phase circuit.
// Designed from scratch; no equivalent module in the source app.

export interface OhlVoltageRegInput {
  sendingVoltageKv: number; // line-to-line
  currentA: number | null;
  powerFactor: number; // lagging, 0-1
  rOhmPerKm: number;
  xOhmPerKm: number;
  lengthKm: number;
}

export const DEFAULT_OHL_VOLTAGE_REG_INPUT: OhlVoltageRegInput = {
  sendingVoltageKv: 11,
  currentA: 100,
  powerFactor: 0.85,
  rOhmPerKm: 0.4,
  xOhmPerKm: 0.35,
  lengthKm: 5,
};

export interface OhlVoltageRegResult {
  voltageDropV: number | null; // approximate line-line drop
  regulationPct: number | null;
  receivingVoltageKv: number | null;
}

export function calcOhlVoltageReg(input: OhlVoltageRegInput): OhlVoltageRegResult {
  const { sendingVoltageKv, currentA, powerFactor, rOhmPerKm, xOhmPerKm, lengthKm } = input;

  if (currentA == null || sendingVoltageKv <= 0) {
    return { voltageDropV: null, regulationPct: null, receivingVoltageKv: null };
  }

  const r = rOhmPerKm * lengthKm;
  const x = xOhmPerKm * lengthKm;
  const sinPhi = Math.sqrt(Math.max(0, 1 - powerFactor * powerFactor));

  // Approximate 3-phase line-line voltage drop formula: sqrt(3) x I x (R cos(phi) + X sin(phi))
  const voltageDropV = Math.sqrt(3) * currentA * (r * powerFactor + x * sinPhi);
  const sendingVoltageV = sendingVoltageKv * 1000;
  const regulationPct = (voltageDropV / sendingVoltageV) * 100;
  const receivingVoltageKv = (sendingVoltageV - voltageDropV) / 1000;

  return { voltageDropV, regulationPct, receivingVoltageKv };
}
