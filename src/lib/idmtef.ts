// IDMT Earth Fault Relay Setting (50N/51N) — earth-fault variant of the
// standard IDMT overcurrent relay, using the same IEC 60255-151 / IEEE
// C37.112 inverse-time curve mathematics already verified in idmt.ts (the
// physics of the curve doesn't change — only the CT arrangement, typical
// pickup level, and terminology differ: Ie>/te> instead of I>/t>). Reuses
// idmt.ts's tripTime() directly rather than re-deriving the curve math, to
// avoid duplicating (and risking a transcription error in) already-verified
// coefficients. Designed from scratch; no equivalent module in the source
// app.

import { RelaySettings, DEFAULT_RELAY, tripTime } from "./idmt";

export interface EfRelayInput {
  relay: RelaySettings;
  faultCurrentPrimary: number | null; // earth fault current at the relay's CT location
  instantaneousPickupPrimary: number | null; // Ie>> high-set instantaneous stage, primary amps (0/null = not used)
  instantaneousTimeS: number; // definite-time delay for the instantaneous stage, if any
}

export const DEFAULT_EF_RELAY_INPUT: EfRelayInput = {
  relay: { ...DEFAULT_RELAY("Earth Fault Relay (50N/51N)"), pickupCurrent: 0.2, ctRatio: 200, timeDial: 0.2 },
  faultCurrentPrimary: 1500,
  instantaneousPickupPrimary: 4000,
  instantaneousTimeS: 0.05,
};

export interface EfRelayResult {
  relayCurrent: number | null; // fault current referred to relay/CT secondary
  psm: number | null; // plug setting multiplier
  operatingTimeS: number | null; // te>, IDMT stage
  instantaneousOperates: boolean | null; // whether Ie>> is exceeded
  instantaneousTimeS: number | null;
}

export function calcEfRelay(input: EfRelayInput): EfRelayResult {
  const { relay, faultCurrentPrimary, instantaneousPickupPrimary, instantaneousTimeS } = input;

  if (faultCurrentPrimary == null) {
    return { relayCurrent: null, psm: null, operatingTimeS: null, instantaneousOperates: null, instantaneousTimeS: null };
  }

  const ctRatio = relay.ctRatio > 0 ? relay.ctRatio : 1;
  const relayCurrent = faultCurrentPrimary / ctRatio;
  const psm = relayCurrent / relay.pickupCurrent;

  const t = tripTime(relay, faultCurrentPrimary);
  const operatingTimeS = isFinite(t) ? t : null;

  let instantaneousOperates: boolean | null = null;
  if (instantaneousPickupPrimary != null && instantaneousPickupPrimary > 0) {
    instantaneousOperates = faultCurrentPrimary >= instantaneousPickupPrimary;
  }

  return {
    relayCurrent,
    psm,
    operatingTimeS,
    instantaneousOperates,
    instantaneousTimeS: instantaneousOperates ? instantaneousTimeS : null,
  };
}
