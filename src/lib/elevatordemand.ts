// Elevator Electrical Demand — traction elevator motor power from rated
// load/speed/counterweight balance/efficiency, plus NEC Table 620.14 feeder
// demand factor for a group of elevators on a single feeder. Designed from
// scratch. No equivalent module in the source app.
//
// Motor power: standard elevator-engineering formula — the counterweight
// balances a fraction of the rated load, so the motor only has to move the
// unbalanced (net) portion at rated speed:
//   P(kW) = netLoad(kg) x 9.81(m/s^2) x speed(m/s) / (1000 x efficiency)
//   netLoad = ratedLoad x (1 - balanceFactor)
//
// Feeder demand factor: NEC Table 620.14 — demand factors for two or more
// elevators on a single feeder, based on a 50% duty cycle assumption.
// Verified against two independent published summaries of the table
// (Elevator World's "NEC Article 620: Elevators, Part I", and EC&M's
// "Ensuring Accuracy in Demand Factors with the NEC").

export const NEC_620_14_DEMAND_FACTOR: Record<number, number> = {
  1: 1.0,
  2: 0.95,
  3: 0.9,
  4: 0.85,
  5: 0.82,
  6: 0.79,
  7: 0.77,
  8: 0.75,
  9: 0.73,
};
const NEC_620_14_DEMAND_FACTOR_10_PLUS = 0.72;

export function necElevatorDemandFactor(numElevators: number): number {
  if (numElevators <= 0) return 1;
  if (numElevators >= 10) return NEC_620_14_DEMAND_FACTOR_10_PLUS;
  return NEC_620_14_DEMAND_FACTOR[Math.round(numElevators)] ?? 1;
}

const G = 9.81; // m/s^2

export interface ElevatorDemandInput {
  ratedLoadKg: number | null;
  speedMs: number | null;
  balanceFactor: number; // 0-1, fraction of rated load balanced by the counterweight
  efficiency: number; // 0-1, overall (mechanical x motor) drive efficiency
  numElevators: number; // count of identical elevators on the shared feeder
  voltageV: number; // for an approximate full-load current estimate
  powerFactor: number; // 0-1
}

export const DEFAULT_ELEVATOR_DEMAND_INPUT: ElevatorDemandInput = {
  ratedLoadKg: 1000,
  speedMs: 1.5,
  balanceFactor: 0.5,
  efficiency: 0.7,
  numElevators: 4,
  voltageV: 415,
  powerFactor: 0.85,
};

export interface ElevatorDemandResult {
  netLoadKg: number | null;
  singleUnitPowerKw: number | null;
  singleUnitFlaApprox: number | null; // 3-phase approx, sqrt(3) x V x I x PF
  connectedLoadKw: number | null; // N x single unit
  demandFactor: number;
  demandLoadKw: number | null;
  demandLoadFlaApprox: number | null;
}

export function calcElevatorDemand(input: ElevatorDemandInput): ElevatorDemandResult {
  const { ratedLoadKg, speedMs, balanceFactor, efficiency, numElevators, voltageV, powerFactor } = input;

  if (ratedLoadKg == null || speedMs == null || efficiency <= 0) {
    return {
      netLoadKg: null,
      singleUnitPowerKw: null,
      singleUnitFlaApprox: null,
      connectedLoadKw: null,
      demandFactor: necElevatorDemandFactor(numElevators),
      demandLoadKw: null,
      demandLoadFlaApprox: null,
    };
  }

  const netLoadKg = ratedLoadKg * (1 - balanceFactor);
  const singleUnitPowerKw = (netLoadKg * G * speedMs) / (1000 * efficiency);
  const singleUnitFlaApprox =
    voltageV > 0 && powerFactor > 0
      ? (singleUnitPowerKw * 1000) / (Math.sqrt(3) * voltageV * powerFactor)
      : null;

  const connectedLoadKw = singleUnitPowerKw * numElevators;
  const demandFactor = necElevatorDemandFactor(numElevators);
  const demandLoadKw = connectedLoadKw * demandFactor;
  const demandLoadFlaApprox = singleUnitFlaApprox != null ? singleUnitFlaApprox * numElevators * demandFactor : null;

  return {
    netLoadKg,
    singleUnitPowerKw,
    singleUnitFlaApprox,
    connectedLoadKw,
    demandFactor,
    demandLoadKw,
    demandLoadFlaApprox,
  };
}
