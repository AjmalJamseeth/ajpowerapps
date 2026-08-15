// Genset Fuel Consumption & Runtime — user-supplied fuel consumption rate
// (deliberately not hard-coded: actual L/kWh or L/hr varies significantly
// by genset model, load level, and manufacturer datasheet, so the user
// enters their own genset's rated consumption figure) combined with tank
// size and load level to estimate runtime, consumption, and cost. Designed
// from scratch; no equivalent module in the source app.

export type FuelRateBasis = "perKwh" | "perHour";

export interface GensetFuelInput {
  tankLiters: number;
  loadKw: number | null;
  fuelRateBasis: FuelRateBasis;
  fuelRateValue: number; // L/kWh if basis=perKwh (at the stated load), or L/hr if basis=perHour (already reflects the load point)
  fuelPricePerLiter: number;
}

export const DEFAULT_GENSET_FUEL_INPUT: GensetFuelInput = {
  tankLiters: 500,
  loadKw: 200,
  fuelRateBasis: "perHour",
  fuelRateValue: 45,
  fuelPricePerLiter: 1.2,
};

export interface GensetFuelResult {
  consumptionRateLPerHour: number | null;
  runtimeHours: number | null;
  totalFuelForRuntimeL: number | null;
  costPerHour: number | null;
}

export function calcGensetFuel(input: GensetFuelInput): GensetFuelResult {
  const { tankLiters, loadKw, fuelRateBasis, fuelRateValue, fuelPricePerLiter } = input;

  let consumptionRateLPerHour: number | null = null;

  if (fuelRateBasis === "perHour") {
    consumptionRateLPerHour = fuelRateValue;
  } else if (loadKw != null && loadKw > 0) {
    consumptionRateLPerHour = fuelRateValue * loadKw;
  }

  if (consumptionRateLPerHour == null || consumptionRateLPerHour <= 0) {
    return { consumptionRateLPerHour, runtimeHours: null, totalFuelForRuntimeL: null, costPerHour: null };
  }

  const runtimeHours = tankLiters / consumptionRateLPerHour;
  const totalFuelForRuntimeL = tankLiters;
  const costPerHour = consumptionRateLPerHour * fuelPricePerLiter;

  return { consumptionRateLPerHour, runtimeHours, totalFuelForRuntimeL, costPerHour };
}
