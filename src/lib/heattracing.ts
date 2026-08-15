// Heat Tracing Circuit Sizing — electrical trace-heating power from
// steady-state radial conduction heat loss through pipe insulation, heater
// selection against required W/m, and circuit voltage-drop/breaker sizing.
// Basis: standard cylindrical-conduction heat-loss formula (textbook heat
// transfer), applied per IEEE 515 (electric resistance trace heating)
// practice; hazardous-area installations additionally follow IEC 60079-30
// and require GFEP (ground-fault equipment protection). Designed from
// scratch; no equivalent module in the source app.

export interface HeatTracingInput {
  pipeOuterDiameterMm: number | null; // pipe OD (before insulation)
  insulationThicknessMm: number | null;
  insulationK: number; // thermal conductivity, W/(m·K) — mineral wool ≈0.04, PIR ≈0.025
  maintainTempC: number | null; // desired pipe/fluid temperature to maintain
  minAmbientTempC: number | null; // design minimum ambient (worst case)
  designFactor: number; // safety margin multiplier on computed heat loss, e.g. 1.2-1.5 per IEEE 515 practice
  heaterOutputWPerM: number; // selected heating cable's rated output, W/m
  circuitLengthM: number | null;
  circuitVoltageV: number;
  cableResistanceOhmPerM: number; // heating cable's own resistance per unit length (constant-wattage type) — 0 to skip the voltage-drop check
  breakerRatingA: number;
}

export const DEFAULT_HEAT_TRACING_INPUT: HeatTracingInput = {
  pipeOuterDiameterMm: 114,
  insulationThicknessMm: 50,
  insulationK: 0.04,
  maintainTempC: 10,
  minAmbientTempC: -10,
  designFactor: 1.3,
  heaterOutputWPerM: 20,
  circuitLengthM: 80,
  circuitVoltageV: 230,
  cableResistanceOhmPerM: 0,
  breakerRatingA: 16,
};

export interface HeatTracingResult {
  heatLossWPerM: number | null; // steady-state, unfactored
  requiredWPerM: number | null; // with design factor applied
  heaterAdequate: boolean | null; // does the selected heater's W/m cover the requirement?
  circuitPowerW: number | null;
  circuitCurrentA: number | null;
  breakerOk: boolean | null;
  voltageDropV: number | null;
  voltageDropPct: number | null;
}

export function calcHeatTracing(input: HeatTracingInput): HeatTracingResult {
  const {
    pipeOuterDiameterMm,
    insulationThicknessMm,
    insulationK,
    maintainTempC,
    minAmbientTempC,
    designFactor,
    heaterOutputWPerM,
    circuitLengthM,
    circuitVoltageV,
    cableResistanceOhmPerM,
    breakerRatingA,
  } = input;

  if (
    pipeOuterDiameterMm == null ||
    insulationThicknessMm == null ||
    maintainTempC == null ||
    minAmbientTempC == null ||
    insulationK <= 0
  ) {
    return {
      heatLossWPerM: null,
      requiredWPerM: null,
      heaterAdequate: null,
      circuitPowerW: null,
      circuitCurrentA: null,
      breakerOk: null,
      voltageDropV: null,
      voltageDropPct: null,
    };
  }

  const dPipeM = pipeOuterDiameterMm / 1000;
  const dInsOuterM = (pipeOuterDiameterMm + 2 * insulationThicknessMm) / 1000;
  const deltaT = maintainTempC - minAmbientTempC;

  // Steady-state radial conduction through a cylindrical insulation layer:
  // Q (W/m) = 2*pi*k*deltaT / ln(D_outer / D_inner)
  const heatLossWPerM = (2 * Math.PI * insulationK * deltaT) / Math.log(dInsOuterM / dPipeM);
  const requiredWPerM = heatLossWPerM * designFactor;
  const heaterAdequate = heaterOutputWPerM >= requiredWPerM;

  let circuitPowerW: number | null = null;
  let circuitCurrentA: number | null = null;
  let breakerOk: boolean | null = null;
  let voltageDropV: number | null = null;
  let voltageDropPct: number | null = null;

  if (circuitLengthM != null && circuitLengthM >= 0) {
    circuitPowerW = heaterOutputWPerM * circuitLengthM;
    circuitCurrentA = circuitVoltageV > 0 ? circuitPowerW / circuitVoltageV : null;
    breakerOk = circuitCurrentA != null ? circuitCurrentA <= breakerRatingA : null;

    if (cableResistanceOhmPerM > 0 && circuitCurrentA != null) {
      const totalR = cableResistanceOhmPerM * circuitLengthM;
      voltageDropV = circuitCurrentA * totalR;
      voltageDropPct = (voltageDropV / circuitVoltageV) * 100;
    }
  }

  return {
    heatLossWPerM,
    requiredWPerM,
    heaterAdequate,
    circuitPowerW,
    circuitCurrentA,
    breakerOk,
    voltageDropV,
    voltageDropPct,
  };
}
