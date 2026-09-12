// Cable Tray Ventilation Calculator — open-area (perforation) ratio of a
// cable tray, as a quick screening indicator of how freely a ventilated/
// perforated tray can dissipate heat compared to a fully solid-bottom
// tray. Ladder tray is effectively ~100% open at the bottom; perforated
// trough tray is typically in the 15-40% range depending on hole
// pattern; solid-bottom tray is 0% (relies entirely on convection off the
// top and sides). Designed from scratch; no equivalent module exists
// elsewhere in AJapps.

export type VentilationGrade = "LOW" | "MODERATE" | "GOOD" | "HIGH";

export interface CableTrayVentilationInput {
  trayWidthMm: number;
  trayLengthM: number;
  openAreaM2: number | null; // total open (perforated) area over the tray length being assessed
}

export const DEFAULT_CABLE_TRAY_VENTILATION_INPUT: CableTrayVentilationInput = {
  trayWidthMm: 300,
  trayLengthM: 10,
  openAreaM2: 1.2,
};

export interface CableTrayVentilationResult {
  totalTrayAreaM2: number | null;
  ventilationRatioPct: number | null;
  grade: VentilationGrade | null;
}

export function gradeVentilationRatio(pct: number): VentilationGrade {
  if (pct < 10) return "LOW";
  if (pct < 25) return "MODERATE";
  if (pct < 50) return "GOOD";
  return "HIGH";
}

export function calcCableTrayVentilation(input: CableTrayVentilationInput): CableTrayVentilationResult {
  const { trayWidthMm, trayLengthM, openAreaM2 } = input;
  if (trayWidthMm <= 0 || trayLengthM <= 0 || openAreaM2 == null || openAreaM2 < 0) {
    return { totalTrayAreaM2: null, ventilationRatioPct: null, grade: null };
  }

  const totalTrayAreaM2 = (trayWidthMm / 1000) * trayLengthM;
  const ventilationRatioPct = totalTrayAreaM2 > 0 ? Math.min(100, (openAreaM2 / totalTrayAreaM2) * 100) : 0;
  const grade = gradeVentilationRatio(ventilationRatioPct);

  return { totalTrayAreaM2, ventilationRatioPct, grade };
}
