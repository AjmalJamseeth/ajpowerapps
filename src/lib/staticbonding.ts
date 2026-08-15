// Hazardous Area Bonding & Static Grounding Check — compares a measured
// bonding/grounding resistance-to-ground against the commonly-cited NFPA 77
// threshold for adequate static-electricity dissipation (1 x 10^6 ohms, i.e.
// 1 megohm, or less), used for tank truck/rail car loading racks, drum
// filling, and other flammable-liquid transfer bonding points. Designed
// from scratch; no equivalent module in the source app.

export interface StaticBondingInput {
  measuredResistanceOhms: number | null;
  thresholdOhms: number; // default 1,000,000 ohms per NFPA 77 static-dissipation guidance
}

export const DEFAULT_STATIC_BONDING_INPUT: StaticBondingInput = {
  measuredResistanceOhms: 25000,
  thresholdOhms: 1000000,
};

export type StaticBondingQuality = "metallic" | "acceptable" | "fail";

export interface StaticBondingResult {
  pass: boolean | null;
  quality: StaticBondingQuality | null;
  qualityNote: string;
}

export function calcStaticBonding(input: StaticBondingInput): StaticBondingResult {
  const { measuredResistanceOhms: r, thresholdOhms } = input;
  if (r == null || r < 0) {
    return { pass: null, quality: null, qualityNote: "" };
  }

  const pass = r <= thresholdOhms;
  let quality: StaticBondingQuality;
  let qualityNote: string;

  if (r <= 10) {
    quality = "metallic";
    qualityNote = "Typical of a tight, all-metal bonding/grounding path — well below what static dissipation alone requires; this is a good, low-impedance connection.";
  } else if (pass) {
    quality = "acceptable";
    qualityNote = "Within the commonly-cited NFPA 77 threshold for static-electricity dissipation — adequate for that purpose, though a reading well above 10Ω on what should be an all-metal path can indicate corrosion, a loose connection, or a coating/contamination issue worth investigating.";
  } else {
    quality = "fail";
    qualityNote = "Exceeds the static-dissipation threshold — the bond/ground path will not reliably dissipate static charge; inspect for a broken connection, corrosion, paint/coating on contact surfaces, or a damaged cable.";
  }

  return { pass, quality, qualityNote };
}
