// Elevator Energy Calculator — estimates annual electrical energy
// consumption (kWh/year) for a traction elevator from its running power
// (reusing the same net-load/speed/efficiency relation as
// `elevatordemand.ts`), duty cycle (trips/day, average running time per
// trip), an optional regenerative-drive energy credit, and standby
// (idle-mode) power draw. Distinct from `elevatordemand.ts`, which sizes
// the feeder/demand load (kW) for a group of elevators — this tool instead
// estimates energy consumption (kWh) over time for a single unit.
// Designed from scratch; no equivalent module exists elsewhere in AJapps.
//
// Method follows the same running-energy + standby-energy structure used
// by ISO 25745-2 (Energy performance of lifts, escalators and moving
// walks — Part 2: Energy calculation and classification for lifts) for a
// simplified preliminary estimate — NOT a full ISO 25745-2 classification
// (which requires manufacturer-measured motor/standby power per the
// standard's specific test/measurement procedure). Regenerative-drive
// credit and standby power are generic planning figures; always confirm
// against the specific elevator manufacturer's published energy data for
// a final energy audit or ISO 25745-2 classification.

const G = 9.81; // m/s^2

export interface ElevatorEnergyInput {
  ratedLoadKg: number | null;
  speedMs: number | null;
  balanceFactor: number; // 0-1
  efficiency: number; // 0-1
  avgRunTimeSecPerTrip: number | null;
  regenCreditPct: number; // 0-100, energy recovered by a regenerative drive
  standbyPowerW: number; // idle-mode power draw (controller, lighting, brake hold)
  tripsPerDay: number | null;
  operatingDaysPerYear: number;
}

export const DEFAULT_ELEVATOR_ENERGY_INPUT: ElevatorEnergyInput = {
  ratedLoadKg: 1000,
  speedMs: 1.5,
  balanceFactor: 0.5,
  efficiency: 0.7,
  avgRunTimeSecPerTrip: 25,
  regenCreditPct: 0,
  standbyPowerW: 150,
  tripsPerDay: 150,
  operatingDaysPerYear: 365,
};

export interface ElevatorEnergyResult {
  netLoadKg: number | null;
  runningPowerKw: number | null;
  energyPerTripKwh: number | null;
  dailyRunningHours: number | null;
  dailyRunningEnergyKwh: number | null;
  dailyStandbyEnergyKwh: number | null;
  dailyTotalEnergyKwh: number | null;
  annualEnergyKwh: number | null;
}

export function calcElevatorEnergy(input: ElevatorEnergyInput): ElevatorEnergyResult {
  const { ratedLoadKg, speedMs, balanceFactor, efficiency, avgRunTimeSecPerTrip, regenCreditPct, standbyPowerW, tripsPerDay, operatingDaysPerYear } = input;

  if (ratedLoadKg == null || speedMs == null || efficiency <= 0 || avgRunTimeSecPerTrip == null || tripsPerDay == null) {
    return {
      netLoadKg: null,
      runningPowerKw: null,
      energyPerTripKwh: null,
      dailyRunningHours: null,
      dailyRunningEnergyKwh: null,
      dailyStandbyEnergyKwh: null,
      dailyTotalEnergyKwh: null,
      annualEnergyKwh: null,
    };
  }

  const netLoadKg = ratedLoadKg * (1 - balanceFactor);
  const runningPowerKw = (netLoadKg * G * speedMs) / (1000 * efficiency);

  const regenFactor = 1 - Math.max(0, Math.min(100, regenCreditPct)) / 100;
  const energyPerTripKwh = runningPowerKw * (avgRunTimeSecPerTrip / 3600) * regenFactor;

  const dailyRunningHours = (tripsPerDay * avgRunTimeSecPerTrip) / 3600;
  const dailyRunningEnergyKwh = tripsPerDay * energyPerTripKwh;

  const standbyHours = Math.max(0, 24 - dailyRunningHours);
  const dailyStandbyEnergyKwh = (standbyPowerW / 1000) * standbyHours;

  const dailyTotalEnergyKwh = dailyRunningEnergyKwh + dailyStandbyEnergyKwh;
  const annualEnergyKwh = dailyTotalEnergyKwh * operatingDaysPerYear;

  return {
    netLoadKg,
    runningPowerKw,
    energyPerTripKwh,
    dailyRunningHours,
    dailyRunningEnergyKwh,
    dailyStandbyEnergyKwh,
    dailyTotalEnergyKwh,
    annualEnergyKwh,
  };
}
