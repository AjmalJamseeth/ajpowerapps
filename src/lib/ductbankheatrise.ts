// Duct Bank Heat Rise Calculator — simplified external thermal resistance
// estimate for a buried concrete-encased duct bank, using the same
// "equivalent cylinder" idea behind the Neher-McGrath / IEC 60287 buried-
// cable external thermal resistance formula: the duct bank's rectangular
// cross-section is approximated as a circular cylinder of equal area, and
// the resulting soil thermal resistance from that cylinder's surface to
// ambient is used to estimate the duct-bank-to-ambient temperature rise
// from the total heat loss generated inside it.
//
//   D_eq = 2 * sqrt((W * H) / pi)                [equal-area equivalent diameter]
//   R_ext = (rho_soil / (2*pi)) * ln(4*L / D_eq)  [K·m/W, buried-cylinder external
//                                                   thermal resistance, L = burial
//                                                   depth to duct bank center]
//   dT = W_total_per_m * R_ext                    [K rise, bank surface to ambient]
//
// This is a first-principles simplification, not the full Neher-McGrath
// method (which includes group geometric factors for the individual
// ducts/cables inside the bank, mutual heating between circuits, and a
// more detailed internal thermal resistance of the concrete/duct
// material) — flagged as a preliminary screening estimate, not a
// substitute for a full thermal study on a heavily loaded duct bank.
// Designed from scratch; no equivalent module exists elsewhere in AJapps.

export type DuctBankMode = "heatRise" | "maxLosses";

export interface DuctBankHeatRiseInput {
  mode: DuctBankMode;
  soilResistivityKmPerW: number; // rho_soil, K·m/W (typical 0.9-1.2 good soil, up to 2.5-3 poor/dry soil)
  burialDepthM: number; // to duct bank center, m
  bankWidthM: number;
  bankHeightM: number;
  ambientSoilTempC: number;

  // heatRise mode
  totalLossesWPerM: number | null; // total conductor I^2R heat generated per meter of duct bank length

  // maxLosses mode
  maxAllowableTempC: number | null; // target maximum bank surface / duct temperature
}

export const DEFAULT_DUCT_BANK_HEAT_RISE_INPUT: DuctBankHeatRiseInput = {
  mode: "heatRise",
  soilResistivityKmPerW: 1.0,
  burialDepthM: 1.0,
  bankWidthM: 1.2,
  bankHeightM: 0.6,
  ambientSoilTempC: 20,
  totalLossesWPerM: 60,
  maxAllowableTempC: 60,
};

export interface DuctBankHeatRiseResult {
  equivalentDiameterM: number | null;
  externalThermalResistanceKmPerW: number | null;

  // heatRise mode
  deltaTK: number | null;
  bankSurfaceTempC: number | null;

  // maxLosses mode
  maxLossesWPerM: number | null;
}

export function calcDuctBankHeatRise(input: DuctBankHeatRiseInput): DuctBankHeatRiseResult {
  const empty: DuctBankHeatRiseResult = {
    equivalentDiameterM: null,
    externalThermalResistanceKmPerW: null,
    deltaTK: null,
    bankSurfaceTempC: null,
    maxLossesWPerM: null,
  };

  const { soilResistivityKmPerW, burialDepthM, bankWidthM, bankHeightM } = input;
  if (soilResistivityKmPerW <= 0 || burialDepthM <= 0 || bankWidthM <= 0 || bankHeightM <= 0) return empty;

  const equivalentDiameterM = 2 * Math.sqrt((bankWidthM * bankHeightM) / Math.PI);
  const ratio = (4 * burialDepthM) / equivalentDiameterM;
  if (ratio <= 1) return { ...empty, equivalentDiameterM };

  const externalThermalResistanceKmPerW = (soilResistivityKmPerW / (2 * Math.PI)) * Math.log(ratio);

  if (input.mode === "heatRise") {
    if (input.totalLossesWPerM == null || input.totalLossesWPerM < 0) return { ...empty, equivalentDiameterM, externalThermalResistanceKmPerW };
    const deltaTK = input.totalLossesWPerM * externalThermalResistanceKmPerW;
    const bankSurfaceTempC = input.ambientSoilTempC + deltaTK;
    return { equivalentDiameterM, externalThermalResistanceKmPerW, deltaTK, bankSurfaceTempC, maxLossesWPerM: null };
  }

  // maxLosses
  if (input.maxAllowableTempC == null) return { ...empty, equivalentDiameterM, externalThermalResistanceKmPerW };
  const allowedDeltaTK = input.maxAllowableTempC - input.ambientSoilTempC;
  if (allowedDeltaTK <= 0) return { equivalentDiameterM, externalThermalResistanceKmPerW, deltaTK: null, bankSurfaceTempC: null, maxLossesWPerM: 0 };
  const maxLossesWPerM = allowedDeltaTK / externalThermalResistanceKmPerW;
  return { equivalentDiameterM, externalThermalResistanceKmPerW, deltaTK: null, bankSurfaceTempC: null, maxLossesWPerM };
}
