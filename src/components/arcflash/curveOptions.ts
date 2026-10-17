import { IEC_CURVES, IEEE_CURVES } from "@/lib/idmt";

export const IDMT_CURVE_OPTIONS_EXPORT: Record<"IEC" | "IEEE", { value: string; label: string }[]> = {
  IEC: Object.entries(IEC_CURVES).map(([value, c]) => ({ value, label: c.label })),
  IEEE: Object.entries(IEEE_CURVES).map(([value, c]) => ({ value, label: c.label })),
};
