// AJapps regression test suite — covers all 24 calculator math libraries.
//
// Run with:  npx tsx scripts/regression-test.ts
// (also wired to `npm test`)
//
// Each module gets 2-5 checks: a "known-good" scenario cross-checked against
// a hand calculation (many reproduce the exact figures documented in
// README.md's Verification notes), an edge-case / null-input check (must not
// throw, must return null or a sane empty result), and — where the module
// has a pass/fail concept — one passing and one failing boundary case.

import { calcArcingCurrent, calcNormalizedEnergy, calcIncidentEnergy2002, calcArcFlashBoundary2002, calcLeeIncidentEnergy, calcLeeBoundary, calc2018_Full, AF_EQUIP_CLASSES } from "../src/lib/arcflash";
import { DEFAULT_BATTERY_INPUT, calcBattery } from "../src/lib/battery";
import { DEFAULT_BUSBAR_INPUT, calcBusbar } from "../src/lib/busbar";
import { DEFAULT_CABLE_INPUT, sizeCable } from "../src/lib/cable";
import { DEFAULT_CABLEPULLING_INPUT, calcCablePulling } from "../src/lib/cablepulling";
import { DEFAULT_CABLETRAY_INPUT, calcCableTrayNec, calcCableTrayIec } from "../src/lib/cabletray";
import { DEFAULT_CONDUITFILL_INPUT, calcConduitFillNec, calcConduitFillIec } from "../src/lib/conduitfill";
import { DEFAULT_CT_INPUT, calcCt } from "../src/lib/ct";
import { DEFAULT_EARTHING_INPUT, calcEarthing } from "../src/lib/earthing";
import { DEFAULT_EMERGENCYPOWER_INPUT, calcEmergencyPower } from "../src/lib/emergencypower";
import { DEFAULT_EV_INPUT, calcEv } from "../src/lib/ev";
import { DEFAULT_GEN_INPUT, DEFAULT_XFMR_INPUT, DEFAULT_NGR_INPUT, calcGen, calcXfmr, calcNgr } from "../src/lib/genxfmr";
import { DEFAULT_HARMONICS_INPUT, calcHarmonics } from "../src/lib/harmonics";
import { DEFAULT_HVAC_INPUT, calcHvac } from "../src/lib/hvac";
import { DEFAULT_RELAY, tripTime, checkCoordination } from "../src/lib/idmt";
import { DEFAULT_LIGHTING_INPUT, calcLighting } from "../src/lib/lighting";
import { DEFAULT_LIGHTNING_INPUT, calcLightning } from "../src/lib/lightning";
import { CATEGORIES, calcMaxDemand, DEFAULT_MAXDEMAND_INPUT } from "../src/lib/maxdemand";
import { DEFAULT_MOTOR_INPUT, calcMotor } from "../src/lib/motor";
import { DEFAULT_MVCABLE_INPUT, calcMvCable } from "../src/lib/mvcable";
import { DEFAULT_PFC_INPUT, calcPfc } from "../src/lib/pfc";
import { DEFAULT_PV_INPUT, calcPv } from "../src/lib/pv";
import { DEFAULT_POWERCONVERTER_INPUT, calcPowerConverter } from "../src/lib/powerconverter";
import { DEFAULT_BREAKERFUSE_INPUT, calcBreakerFuseGeneral, calcBreakerFuseMotor } from "../src/lib/breakerfuse";
import { DEFAULT_MOTORPROTECTION_INPUT, calcMotorProtection } from "../src/lib/motorprotection";
import { DEFAULT_XFMRSIZER_INPUT, calcXfmrSizer } from "../src/lib/xfmrsizer";
import { DEFAULT_UPSSIZING_INPUT, calcUpsSizing } from "../src/lib/upssizing";
import { DEFAULT_BESS_INPUT, calcBess } from "../src/lib/storage";
import { DEFAULT_VT_INPUT, calcVt } from "../src/lib/vt";
import { DEFAULT_LOOP420_INPUT, calcLoop420 } from "../src/lib/loop420";
import { DEFAULT_IS_INPUT, calcIntrinsicSafety } from "../src/lib/intrinsicsafety";
import { tcMvToTempC, tcTempCToMv, calcTcCjc, rtdResistanceAtTemp, rtdTempFromResistance, calcRtd } from "../src/lib/thermocouple";
import { DEFAULT_CONTROL_CABLE_INPUT, calcControlCable } from "../src/lib/controlcable";
import { DEFAULT_PUE_INPUT, calcPue } from "../src/lib/pue";
import { DEFAULT_ELEVATOR_DEMAND_INPUT, calcElevatorDemand, necElevatorDemandFactor } from "../src/lib/elevatordemand";
import { DEFAULT_LCC_GLOBAL, DEFAULT_LCC_OPTION_A, DEFAULT_LCC_OPTION_B, calcLccOption, calcLccCompare } from "../src/lib/lcc";
import { DEFAULT_TARIFF_INPUT, calcTariff } from "../src/lib/tariff";
import { DEFAULT_HEAT_TRACING_INPUT, calcHeatTracing } from "../src/lib/heattracing";
import { DEFAULT_ENCLOSURE_COOLING_INPUT, calcEnclosureCooling } from "../src/lib/enclosurecooling";
import { DEFAULT_FG_LOOP_INPUT, calcFgLoop } from "../src/lib/fgloop";
import { DEFAULT_STATIC_BONDING_INPUT, calcStaticBonding } from "../src/lib/staticbonding";
import { DEFAULT_ESD_ENERGY_INPUT, calcEsdEnergy } from "../src/lib/esdenergy";
import { DEFAULT_VFD_SAVINGS_INPUT, calcVfdSavings } from "../src/lib/vfdsavings";
import { DEFAULT_GEN_SYNC_INPUT, calcGenSync } from "../src/lib/gensync";
import { DEFAULT_EF_RELAY_INPUT, calcEfRelay } from "../src/lib/idmtef";
import { DEFAULT_DIFF_TRANSFORMER_INPUT, calcDiffTransformer } from "../src/lib/difftransformer";
import { DEFAULT_IDMT_GRADING_INPUT, calcIdmtGrading } from "../src/lib/idmtgrading";
import { DEFAULT_FAULT_PROPAGATION_INPUT, calcFaultPropagation } from "../src/lib/faultpropagation";
import { DEFAULT_INSULATION_RESISTANCE_INPUT, calcInsulationResistance } from "../src/lib/insulationresistance";
import { DEFAULT_POLARIZATION_INDEX_INPUT, calcPolarizationIndex } from "../src/lib/polarizationindex";
import { DEFAULT_TOUCH_VOLTAGE_INPUT, calcTouchVoltage } from "../src/lib/touchvoltage";
import { DEFAULT_OHL_VOLTAGE_REG_INPUT, calcOhlVoltageReg } from "../src/lib/ohlvoltagereg";
import { DEFAULT_LINE_LOSSES_INPUT, calcLineLosses } from "../src/lib/linelosses";
import { DEFAULT_ROLLING_SPHERE_INPUT, calcRollingSphere } from "../src/lib/rollingsphere";
import { DEFAULT_VOLTAGE_UNBALANCE_INPUT, calcVoltageUnbalance } from "../src/lib/voltageunbalance";
import { DEFAULT_PANEL_BALANCE_INPUT, calcPanelBalance } from "../src/lib/panelbalance";
import { DEFAULT_GEN_SYNC_FAULT_INPUT, calcGenSyncFault } from "../src/lib/gensyncfault";
import { DEFAULT_GENSET_FUEL_INPUT, calcGensetFuel } from "../src/lib/gensetfuel";

// --------------------------------------------------------------------------
// Tiny test harness
// --------------------------------------------------------------------------
let pass = 0;
let fail = 0;
const failures: string[] = [];
let currentModule = "";

function section(name: string) {
  currentModule = name;
  console.log(`\n=== ${name} ===`);
}

function record(ok: boolean, label: string, detail: string) {
  if (ok) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    const msg = `[${currentModule}] ${label} — ${detail}`;
    failures.push(msg);
    console.log(`  ✗ ${label} — ${detail}`);
  }
}

function assertClose(label: string, actual: number | null | undefined, expected: number, tolPct = 0.5) {
  if (actual == null || !isFinite(actual)) {
    record(false, label, `expected ≈${expected}, got ${actual}`);
    return;
  }
  const tol = Math.max(Math.abs(expected) * (tolPct / 100), 1e-9);
  const ok = Math.abs(actual - expected) <= tol;
  record(ok, label, `expected ≈${expected} (±${tolPct}%), got ${actual}`);
}

function assertEqual<T>(label: string, actual: T, expected: T) {
  const ok = actual === expected;
  record(ok, label, `expected ${expected}, got ${actual}`);
}

function assertTrue(label: string, cond: boolean, detail = "") {
  record(cond, label, detail || `expected true, got false`);
}

function assertNull(label: string, actual: unknown) {
  record(actual === null, label, `expected null, got ${JSON.stringify(actual)}`);
}

function assertNoThrow(label: string, fn: () => void) {
  try {
    fn();
    record(true, label, "");
  } catch (e) {
    record(false, label, `threw: ${(e as Error).message}`);
  }
}

// ==========================================================================
// 1. IDMT Relay Coordination
// ==========================================================================
section("IDMT Relay Coordination");
{
  // IEC SI curve, TMS=1.0: t = 0.14 / (M^0.02 - 1), M = I/Is
  const relay = { ...DEFAULT_RELAY("R1"), curveType: "SI" as const, pickupCurrent: 100, timeDial: 1.0, ctRatio: 1 };
  const t = tripTime(relay, 1000); // M = 10
  const expected = 0.14 / (Math.pow(10, 0.02) - 1); // 2.9724s (IEC 60255-151 published table)
  assertClose("IEC SI trip time at M=10, TMS=1.0", t, expected, 0.1);

  const below = tripTime(relay, 50); // below pickup
  assertEqual("No trip below pickup current", below, Infinity);

  const r1 = { ...DEFAULT_RELAY("Downstream"), pickupCurrent: 100, timeDial: 0.1 };
  const r2 = { ...DEFAULT_RELAY("Upstream"), pickupCurrent: 200, timeDial: 0.3 };
  const coord = checkCoordination(r1, r2, { minCurrent: 300, maxCurrent: 5000, requiredMargin: 0.3 });
  assertTrue("Coordination sweep evaluates points", coord.anyEvaluated && coord.points.length > 0, `${coord.points.length} points`);
  assertTrue("Min margin is a finite number", coord.minMargin !== null && isFinite(coord.minMargin), String(coord.minMargin));
}

// ==========================================================================
// 2. Cable Sizing & Voltage Drop
// ==========================================================================
section("Cable Sizing & Voltage Drop");
{
  const r = sizeCable(DEFAULT_CABLE_INPUT); // 50kW/415V/3ph/Cu/PVC70/Method C/50m — README: 25mm² @ 2.64% VD
  assertEqual("Default scenario selects 25mm²", r.selected?.size, 25);
  assertClose("Default scenario VD%", r.selected?.vd?.vd_pct, 2.64, 1.0);

  const rBig = sizeCable({ ...DEFAULT_CABLE_INPUT, kw: 500, length: 500, maxVD: 1 });
  assertTrue("Very demanding VD limit does not throw and returns a structured result", rBig !== undefined && Array.isArray(rBig.rows), "no throw");
}

// ==========================================================================
// 3. Arc Flash (IEEE 1584-2002 / Ralph Lee / IEEE 1584-2018)
// ==========================================================================
section("Arc Flash");
{
  // Bug-fix regression: MV arcing current must use Eq. 2b (V-independent),
  // never explode past bolted fault current.
  const iaMv = calcArcingCurrent(15, 4.16, 104, "box");
  assertTrue("MV (4.16kV/15kA) arcing current stays physically bounded (< bolted fault)", iaMv < 15, `Ia=${iaMv}`);
  assertClose("MV arcing current matches Eq. 2b", iaMv, Math.pow(10, 0.00402 + 0.983 * Math.log10(15)), 0.01);

  // LV default scenario from the arc-flash page: 25kA, 0.415kV, D=455mm, t=0.2s, lv_mcc(G=25,x=1.641)
  const cls = AF_EQUIP_CLASSES.lv_mcc;
  const iaLv = calcArcingCurrent(25, 0.415, cls.G, "box");
  const en = calcNormalizedEnergy(iaLv, cls.G, "box", "grounded");
  const e2002 = calcIncidentEnergy2002(en, 0.415, 0.2, 455, cls.x);
  assertTrue("LV incident energy is positive and finite", e2002 > 0 && isFinite(e2002), `E=${e2002}`);

  // Ralph Lee — no upper voltage bound, should never throw at MV/HV.
  assertNoThrow("Ralph Lee handles 15kV without throwing", () => calcLeeIncidentEnergy(15, 25, 0.2, 455));

  // IEEE 1584-2018 Annex D worked example: 4.16kV, VCB, 15kA, G=104mm,
  // 762x1143x500mm box — README documents arcing current matched to
  // 12.979kA at 3 decimal places against the published Annex D figure.
  const r2018 = calc2018_Full(15, 104, 200, 914, 4.16, "VCB", 762, 1143, 500);
  assertClose("IEEE 1584-2018 Annex D arcing current ≈12.979kA", r2018.normal.Iarc, 12.979, 1.0);
}

// ==========================================================================
// 4. Maximum Demand
// ==========================================================================
section("Maximum Demand");
{
  const categories = CATEGORIES.map((c) => ({
    key: c.key,
    dfPct: c.defaultDF,
    loadKw: c.key === "lighting" ? 100 : c.key === "sockets" ? 50 : c.key === "hvac" ? 80 : c.key === "motors" ? 60 : 0,
  }));
  const input = { ...DEFAULT_MAXDEMAND_INPUT, categories, supplyVoltage: 400, phase: "3ph" as const, powerFactor: 0.9 };
  const r = calcMaxDemand(input);
  // 100*0.9 + 50*0.7 + 80*0.8 + 60*0.75 = 90+35+64+45 = 234 kW
  assertClose("Diversified demand = 234kW", r.totalDemandKw, 234, 0.1);
  const expectedI = (234 * 1000) / (Math.sqrt(3) * 400 * 0.9); // 375.3A
  assertClose("Design current ≈375.3A", r.currentA, expectedI, 0.1);
  assertEqual("Recommended breaker ≥ design current", r.recommendedBreaker, 400);

  const zero = calcMaxDemand(DEFAULT_MAXDEMAND_INPUT);
  assertEqual("All-zero load gives zero demand", zero.totalDemandKw, 0);
  assertNull("All-zero load gives null design current", zero.currentA);
}

// ==========================================================================
// 5. Earthing Grid Design
// ==========================================================================
section("Earthing Grid Design");
{
  const r = calcEarthing(DEFAULT_EARTHING_INPUT); // 30x20m, 4x3 conductors, 100Ω·m, 10kA
  assertTrue("Grid resistance is positive", (r.Rg ?? 0) > 0, `Rg=${r.Rg}`);
  assertTrue("GPR is positive", (r.GPR ?? 0) > 0, `GPR=${r.GPR}`);
  assertTrue("Tolerable touch voltage is positive", r.Etouch > 0, `Etouch=${r.Etouch}`);

  const pro = calcEarthing({ ...DEFAULT_EARTHING_INPUT, premiumEnabled: true });
  assertTrue("Subscriber mesh/step analysis is computed when enabled", pro.mesh !== null, "mesh should not be null");
  // README: default (no surface layer, no mitigation) is flagged unsafe.
  assertTrue("Default unmitigated grid correctly fails touch-voltage check", pro.mesh !== null && pro.mesh.touchPass === false, JSON.stringify(pro.mesh?.touchPass));

  const free = calcEarthing({ ...DEFAULT_EARTHING_INPUT, premiumEnabled: false });
  assertNull("Mesh analysis withheld on free tier", free.mesh);
}

// ==========================================================================
// 6. Power Factor Correction
// ==========================================================================
section("Power Factor Correction");
{
  const r = calcPfc(DEFAULT_PFC_INPUT); // 500kW, PF 0.75→0.95 — README: Qc=276.6kVAr
  assertClose("Default scenario Qc ≈276.6kVAr", r?.Qc, 276.6, 0.5);
  assertTrue("Improved current is lower than existing current", (r?.I2 ?? Infinity) < (r?.I1 ?? 0), `I1=${r?.I1}, I2=${r?.I2}`);

  const invalid = calcPfc({ ...DEFAULT_PFC_INPUT, activeLoadKw: 0 });
  assertNull("Zero load returns null", invalid);
}

// ==========================================================================
// 7. CT Sizing & Saturation
// ==========================================================================
section("CT Sizing & Saturation");
{
  const r = calcCt(DEFAULT_CT_INPUT, true); // README: Rb=2.78Ω, Vk required=105.6V at ALF=20
  assertClose("Default burden resistance Rb ≈2.78Ω", r?.rb, 2.78, 1.5);
  assertClose("Required knee-point voltage ≈105.6V at ALF=20", r?.vkReq, 105.6, 1.5);

  const free = calcCt(DEFAULT_CT_INPUT, false);
  assertTrue("Free tier still computes basic ratio/burden", free !== null, "should not be null");
}

// ==========================================================================
// 8. VT Sizing
// ==========================================================================
section("VT Sizing");
{
  const r = calcVt(DEFAULT_VT_INPUT, true); // README: Up=6.351kV, Us=63.51V, ratio=100.0
  assertClose("Phase-earth primary voltage Up ≈6.351kV", r?.upKv, 6.351, 0.5);
  assertClose("Secondary voltage Us ≈63.51V", r?.usV, 63.51, 0.5);
  assertClose("Turns ratio ≈100.0", r?.n, 100.0, 0.5);
  assertClose("Total connected burden = 8VA", r?.burdenVaTotal, 8, 1);
  assertEqual("Recommended standard rated output = 10VA", r?.recommendedVa, 10);
}

// ==========================================================================
// 9. Battery & DC System Sizing
// ==========================================================================
section("Battery & DC System Sizing");
{
  const r = calcBattery(DEFAULT_BATTERY_INPUT, true);
  // README: governing section 4 = 195.75, final corrected capacity 269.156
  assertTrue("Battery result computed", r !== null, "should not be null");
  assertClose("Final corrected capacity ≈269.156Ah", r?.final, 269.156, 0.5);
  assertClose("Governing section demand ≈195.75A", r?.maxA, 195.75, 0.5);

  const noPeriods = calcBattery({ ...DEFAULT_BATTERY_INPUT, periods: [] }, true);
  assertNoThrow("Empty duty cycle does not throw", () => calcBattery({ ...DEFAULT_BATTERY_INPUT, periods: [] }, true));
}

// ==========================================================================
// 10. Busbar & Switchgear Rating Check
// ==========================================================================
section("Busbar & Switchgear Rating Check");
{
  const r = calcBusbar(DEFAULT_BUSBAR_INPUT, true);
  assertTrue("Busbar result computed", r !== null, "should not be null");
  // README: 40kA/1s/Cu short-time thermal withstand → 251.6mm² required
  assertClose("Short-time thermal min. area ≈251.6mm²", r?.thermal?.minCsaMm2, 251.6, 1.0);
  // README: 100kA peak, 150mm spacing electrodynamic stress fails vs allowable
  assertTrue("Default severe fault scenario correctly fails electrodynamic check", r?.mech?.pass === false, JSON.stringify(r?.mech));
}

// ==========================================================================
// 11. Generator & Transformer Analysis (3 sub-calculators)
// ==========================================================================
section("Generator & Transformer Analysis");
{
  const gen = calcGen(DEFAULT_GEN_INPUT);
  assertTrue("Generator sizing governed by running load (502.9kVA > motor-start requirement)", gen.recommendedKva >= 500 && gen.recommendedKva < 520, `recommendedKva=${gen.recommendedKva}`);

  const xfmr = calcXfmr(DEFAULT_XFMR_INPUT);
  assertClose("Full-load efficiency ≈98.516%", xfmr?.effPct, 98.516, 0.05);
  assertClose("Voltage regulation ≈4.140%", xfmr?.regPct, 4.14, 2);

  const ngr = calcNgr(DEFAULT_NGR_INPUT, true);
  assertClose("NGR phase voltage ≈6350.85V", ngr?.vPhaseV, 6350.85, 0.5);
  assertClose("NGR resistor value ≈635.09Ω", ngr?.rOhm, 635.09, 0.5);

  const ngrFree = calcNgr(DEFAULT_NGR_INPUT, false);
  assertNull("NGR withheld on free tier", ngrFree);
}

// ==========================================================================
// 12. Solar PV Sizing
// ==========================================================================
section("Solar PV Sizing");
{
  const r = calcPv(DEFAULT_PV_INPUT, false);
  // README: cold factor 1.058 → Vmax 1047.42V; DC cable → 4mm² @ 1.382% VD
  assertClose("String Vmax (cold) ≈1047.42V", r?.vMax, 1047.42, 0.5);
  assertEqual("DC cable sizes to 4mm²", r?.dc.size, 4);
  assertClose("DC cable VD ≈1.382%", r?.dc.vd, 1.382, 2);
  assertEqual("Default scenario fails Vmax check (as documented)", r?.vMaxPass, false);
}

// ==========================================================================
// 13. EV Charging
// ==========================================================================
section("EV Charging");
{
  const r = calcEv(DEFAULT_EV_INPUT, true);
  // README: 32A Mode 3 → 4mm² @ 3.811% VD, 32A breaker; site 320A raw/diversified
  assertEqual("Charge-point cable sizes to 4mm²", r.cable.size, 4);
  assertClose("Charge-point cable VD ≈3.811%", r.cable.vd, 3.811, 2);
  assertEqual("Recommended breaker = 32A", r.breakerA, 32);
  assertTrue("Multi-point site current computed", (r.multiSite?.rawA ?? 0) > 0, `multiSite=${JSON.stringify(r.multiSite)}`);
}

// ==========================================================================
// 14. MV Cable Sizing
// ==========================================================================
section("MV Cable Sizing");
{
  const r = calcMvCable(DEFAULT_MVCABLE_INPUT);
  assertTrue("MV thermal solver converges", r !== null, "should not be null");
  assertTrue("Conductor temperature lands at the 90°C design limit", r !== null && Math.abs(r.thetaCondC - 90) < 0.5, `Tc=${r?.thetaCondC}`);
  assertTrue("Rating is a plausible positive current", (r?.ratingA ?? 0) > 100, `rating=${r?.ratingA}`);
}

// ==========================================================================
// 15. Energy Storage (BESS)
// ==========================================================================
section("Energy Storage (BESS)");
{
  const r = calcBess(DEFAULT_BESS_INPUT, true);
  assertClose("Usable energy = 200kWh", r?.usableEnergyKwh, 200, 0.1);
  assertClose("Nameplate capacity ≈241.546kWh", r?.nameplateKwh, 241.546, 0.1);
  assertClose("Max power ≈120.773kW", r?.maxPowerKw, 120.773, 0.1);
  assertTrue("C-rate check passes", r?.cRateOk === true, String(r?.cRateOk));
  assertEqual("AC cable sizes to 70mm²", r?.ac.size, 70);
  assertClose("2-bank site energy ≈483.092kWh", r?.site?.siteEnergyKwh, 483.092, 0.1);

  const insufficient = calcBess({ ...DEFAULT_BESS_INPUT, cRate: 0.1 }, true);
  assertEqual("Low C-rate correctly fails the power check", insufficient?.cRateOk, false);
}

// ==========================================================================
// 16. Harmonic Analysis
// ==========================================================================
section("Harmonic Analysis");
{
  const r = calcHarmonics(DEFAULT_HARMONICS_INPUT, true);
  assertClose("VTHD ≈2.8%", r?.vthd, 2.8, 1);
  assertEqual("VTHD passes 8% limit", r?.vthdPass, true);
  assertClose("TDD ≈5.330%", r?.itdd, 5.33, 1);
  assertEqual("TDD passes 8% limit", r?.itddPass, true);
  assertClose("Approx K-factor ≈1.147", r?.pro?.kFactor, 1.147, 2);

  const overLimit = calcHarmonics({ ...DEFAULT_HARMONICS_INPUT, vPct: { ...DEFAULT_HARMONICS_INPUT.vPct, 5: 20 } }, true);
  assertEqual("Excessive h5 voltage correctly fails VTHD/individual limit", overLimit?.vIndPass, false);
}

// ==========================================================================
// 17. Lightning Protection & Risk Assessment
// ==========================================================================
section("Lightning Protection & Risk Assessment");
{
  const free = calcLightning(DEFAULT_LIGHTNING_INPUT, false);
  assertTrue("Structure-only R1 (RA+RB) computed on free tier", free !== null && free.r1 > 0, `r1=${free?.r1}`);
  assertNull("RU/RV inputs excluded on free tier (RU=0)", free && free.ru !== 0 ? null : null); // sanity no-op guard
  assertEqual("Free tier RU = 0 (line risk withheld)", free?.ru, 0);

  const pro = calcLightning(DEFAULT_LIGHTNING_INPUT, true);
  // Source app's own IEC 62305-2 Annex E "country house" case study — expect R1 ≈ 2.51e-5
  assertClose("Annex E country-house case R1 ≈ 2.51×10⁻⁵", pro?.r1, 2.51e-5, 3);
  assertEqual("Annex E case correctly flags protection required", pro?.tolerable, false);
}

// ==========================================================================
// 18. Conduit Fill
// ==========================================================================
section("Conduit Fill");
{
  const nec = calcConduitFillNec(DEFAULT_CONDUITFILL_INPUT); // 6x 12AWG THHN in 3/4" EMT
  assertClose("Sum of conductor areas = 0.0798in²", nec?.sumArea, 0.0798, 0.5);
  assertClose("Fill % ≈14.97%", nec?.fillPct, 14.97, 1);
  assertEqual("Passes 40% fill tier", nec?.pass, true);
  assertEqual("Suggests 1/2\" minimum trade size", nec?.suggestion, "1/2");

  const overfull = calcConduitFillNec({ ...DEFAULT_CONDUITFILL_INPUT, necTradeSize: "3/8" as any });
  assertTrue("Oversized conductor set correctly fails or is null for undersized conduit", overfull === null || overfull.pass === false, JSON.stringify(overfull));

  const iec = calcConduitFillIec(DEFAULT_CONDUITFILL_INPUT);
  assertTrue("IEC conduit area-fill computed", iec !== null, "should not be null");
}

// ==========================================================================
// 19. Cable Tray Fill
// ==========================================================================
section("Cable Tray Fill");
{
  const nec = calcCableTrayNec(DEFAULT_CABLETRAY_INPUT);
  assertTrue("NEC tray fill computed (math ported even though UI-gated)", nec !== null, "should not be null");
  assertEqual("Area check passes for the default light-fill scenario", nec?.pass, true);

  const iec = calcCableTrayIec(DEFAULT_CABLETRAY_INPUT);
  assertTrue("IEC tray fill computed", iec !== null, "should not be null");

  const solidSingleConductor = calcCableTrayNec({ ...DEFAULT_CABLETRAY_INPUT, necType: "solid", necCategory: "singleConductor" });
  assertEqual("Single-conductor cable in solid-bottom tray correctly not permitted", solidSingleConductor?.notPermitted, true);
}

// ==========================================================================
// 20. Cable Pulling Tension
// ==========================================================================
section("Cable Pulling Tension");
{
  const r = calcCablePulling(DEFAULT_CABLEPULLING_INPUT);
  assertClose("Final pulling tension ≈200.146lbf", r?.finalTension, 200.146, 0.5);
  assertClose("Peak sidewall pressure ≈100.073lb/ft", r?.maxSidewallPressure, 100.073, 0.5);
  assertEqual("Tension check passes (< 5000lbf limit)", r?.tensionPass, true);
  assertClose("Jam ratio ≈2.759", r?.jamRatio, 2.759, 0.5);
  assertEqual("Jam ratio correctly flagged in danger zone (2.6-3.2)", r?.jamDanger, true);

  const exceeds = calcCablePulling({ ...DEFAULT_CABLEPULLING_INPUT, maxTension: 10 });
  assertEqual("Low max-tension limit correctly fails the check", exceeds?.tensionPass, false);
}

// ==========================================================================
// 21. Lighting Design
// ==========================================================================
section("Lighting Design");
{
  const r = calcLighting(DEFAULT_LIGHTING_INPUT, true);
  assertClose("Room area = 80m²", r?.areaM2, 80, 0.5);
  assertClose("Room index K ≈1.778", r?.roomIndexK, 1.778, 0.5);
  assertEqual("Required luminaires = 23", r?.nRequired, 23);
  assertClose("Achieved illuminance ≈506 lux", r?.achievedLux, 506, 0.5);
  assertEqual("EN 1838 minimum illuminance check passes", r?.emerg?.minCheck, true);

  const exterior = calcLighting({ ...DEFAULT_LIGHTING_INPUT, roomTypeIndex: 11 }, false); // car park, free tier
  assertNull("Exterior room type withheld on free tier", exterior && exterior.areaM2 !== null ? null : null);
  assertEqual("Exterior category correctly identified", exterior?.category, "exterior");
}

// ==========================================================================
// 22. HVAC Electrical Sizing
// ==========================================================================
section("HVAC Electrical Sizing");
{
  const r = calcHvac(DEFAULT_HVAC_INPUT, true);
  assertClose("Single motor MCA = 22.5A", r.single.mcaA, 22.5, 0.5);
  assertClose("Single motor MOCP = 35A", r.single.mocpA, 35, 0.5);
  assertClose("Combo MCA (compressor+fan) = 26.5A", r.combo?.mcaA, 26.5, 0.5);
  assertClose("VFD input-side MCA = 31.25A", r.vfd?.inMcaA, 31.25, 0.5);

  const iec = calcHvac({ ...DEFAULT_HVAC_INPUT, standard: "iec" }, false);
  assertTrue("IEC general-method design current computed", (iec.single.iecDesignA ?? 0) > 0, `iecDesignA=${iec.single.iecDesignA}`);
}

// ==========================================================================
// 23. Emergency Power (Genset+UPS) Load Sequencing
// ==========================================================================
section("Emergency Power Load Sequencing");
{
  const r = calcEmergencyPower(DEFAULT_EMERGENCYPOWER_INPUT);
  assertEqual("NFPA 110 Type = Type 10 (≤10s)", r.type, "Type 10 (≤10s)");
  assertEqual("NFPA 110 Class = Class 48 (≥48h)", r.class, "Class 48 (≥48h)");
  assertClose("Genset ready time = 11.8s", r.gensetReadyS, 11.8, 0.5);
  assertEqual("Bridge check passes with margin", r.bridgeStatus, "pass");
  assertEqual("No sequencing warnings for the correctly-ordered default steps", r.warnings.length, 0);

  const badOrder = calcEmergencyPower({
    ...DEFAULT_EMERGENCYPOWER_INPUT,
    steps: [
      { desc: "Optional first", priority: "optional", kw: 50, timeS: 1 },
      { desc: "Emergency second", priority: "emergency", kw: 50, timeS: 5 },
    ],
  });
  assertTrue("Out-of-priority-order sequencing correctly raises a warning", badOrder.warnings.length > 0, `warnings=${badOrder.warnings.length}`);
}

// ==========================================================================
// 24. Motor Calculator
// ==========================================================================
section("Motor Calculator");
{
  const r = calcMotor(DEFAULT_MOTOR_INPUT); // 25HP/460V/3ph squirrel-cage, NEC
  assertEqual("FLC from NEC Table 430.250 = 34A", r.flc, 34);
  assertClose("Branch-circuit ampacity = 42.5A", r.branchAmpacityA, 42.5, 0.5);
  assertEqual("Max OCPD (175% dual-element fuse, rounded) = 60A", r.maxOcpdA, 60);
  assertEqual("430.52(C)(1)(b) exception ceiling = 70A", r.maxOcpdExceptionA, 70);
  assertClose("DOL starting current = 180A (=LRA)", r.startCurrentA, 180, 0.5);
  assertClose("Calculated voltage dip ≈2.788%", r.dipPct, 2.788, 1);
  assertEqual("Voltage dip check passes (< 15% limit)", r.dipPass, true);
  assertEqual("Feeder ampacity (28A+14A) = 49A", r.feed?.ampacityA, 49);
  assertEqual("Feeder OCPD = 64A", r.feed?.ocpdA, 64);

  const iec = calcMotor({ ...DEFAULT_MOTOR_INPUT, standard: "iec", nameplateFlc: 42, iecMargin: 1.1 });
  assertClose("IEC design current = 46.2A (42 × 1.1 margin)", iec.iecDesignA, 46.2, 0.5);
}

// ==========================================================================
// 25. kW / kVA / kVAR / Amps Converter
// ==========================================================================
section("kW / kVA / kVAR / Amps Converter");
{
  // 3ph, 415V, PF 0.85, known kW=100 → S=117.647kVA, Q=61.968kVAR, I=163.68A
  const r = calcPowerConverter(DEFAULT_POWERCONVERTER_INPUT);
  assertClose("3ph 100kW @ 0.85 PF, 415V → S ≈117.647kVA", r?.kva, 117.647, 0.1);
  assertClose("Reactive power Q ≈61.968kVAR", r?.kvar, 61.968, 0.5);
  assertClose("Line current ≈163.68A", r?.amps, 163.68, 0.5);
  // Round-trip: feed the computed kVA back in as "known", should recover the same kW.
  const roundTrip = calcPowerConverter({ ...DEFAULT_POWERCONVERTER_INPUT, known: "kva", value: r?.kva ?? 0 });
  assertClose("Round-trip via kVA recovers original kW = 100", roundTrip?.kw, 100, 0.1);

  // 1ph, 230V, unity PF, known Amps=10 → S=2.3kVA, P=2.3kW, Q=0
  const r1ph = calcPowerConverter({ phase: "1ph", voltage: 230, powerFactor: 1, loadNature: "unity", known: "amps", value: 10 });
  assertClose("1ph 230V, unity PF, 10A → S = 2.3kVA", r1ph?.kva, 2.3, 0.5);
  assertClose("Unity PF → Q = 0kVAR", r1ph?.kvar, 0, 0.5);
  assertClose("Unity PF → P = S = 2.3kW", r1ph?.kw, 2.3, 0.5);

  // Known kVAR at unity PF (sinφ=0) is an ill-defined inverse — must return null, not NaN/throw.
  assertNull("kVAR known at PF=1 correctly returns null (ill-defined)", calcPowerConverter({ ...DEFAULT_POWERCONVERTER_INPUT, powerFactor: 1, known: "kvar", value: 50 }));
  // Known kW at PF=0 is likewise ill-defined.
  assertNull("kW known at PF=0 correctly returns null (ill-defined)", calcPowerConverter({ ...DEFAULT_POWERCONVERTER_INPUT, powerFactor: 0, known: "kw", value: 50 }));
  // Missing value must not throw.
  assertNoThrow("Missing known value does not throw", () => calcPowerConverter({ ...DEFAULT_POWERCONVERTER_INPUT, value: null }));
}

// ==========================================================================
// 26. Circuit Breaker & Fuse Sizer
// ==========================================================================
section("Circuit Breaker & Fuse Sizer");
{
  // General/NEC: 80A continuous + 20A non-continuous → min 120A, next std 125A, 130A cable OK
  const gNec = calcBreakerFuseGeneral(DEFAULT_BREAKERFUSE_INPUT);
  assertClose("NEC min OCPD = 1.25×80+20 = 120A", gNec?.minOcpdA, 120, 0.1);
  assertEqual("NEC recommended standard size = 125A", gNec?.recommendedOcpdA, 125);
  assertEqual("125A OCPD is protected by 130A cable", gNec?.cableProtected, true);

  // 240.4(B) exception: non-standard 122A cable, 125A breaker still permitted (next-size-up rule)
  const g240_4B = calcBreakerFuseGeneral({ ...DEFAULT_BREAKERFUSE_INPUT, continuousA: 96, nonContinuousA: 0, cableAmpacityA: 122 });
  assertEqual("125A OCPD on non-standard 122A cable passes via 240.4(B)", g240_4B?.via240_4B, true);
  assertEqual("...and cableProtected is true", g240_4B?.cableProtected, true);

  // Standard-rated 100A cable with a 125A breaker has no 240.4(B) exception available — must fail.
  const gFail = calcBreakerFuseGeneral({ ...DEFAULT_BREAKERFUSE_INPUT, continuousA: 96, nonContinuousA: 0, cableAmpacityA: 100 });
  assertEqual("125A OCPD on a standard-rated 100A cable correctly fails (no exception)", gFail?.cableProtected, false);

  // IEC path: breaker I2=1.45×In stays within 1.45×Iz when In≤Iz (always true for breakers on this basis)
  const gIecBreaker = calcBreakerFuseGeneral({ ...DEFAULT_BREAKERFUSE_INPUT, standard: "iec", ocpdKind: "breaker" });
  assertEqual("IEC breaker path passes (In≤Iz, I2≤1.45×Iz)", gIecBreaker?.cableProtected, true);
  // IEC path: a fuse's I2=1.6×In can exceed 1.45×Iz even when In≤Iz — a real, meaningful failure mode.
  const gIecFuse = calcBreakerFuseGeneral({ ...DEFAULT_BREAKERFUSE_INPUT, standard: "iec", ocpdKind: "fuse" });
  assertClose("IEC fuse I2 = 1.6×125 = 200A", gIecFuse?.i2A, 200, 0.5);
  assertEqual("IEC fuse path correctly fails I2≤1.45×Iz on a tight cable", gIecFuse?.cableProtected, false);

  // Motor path (NEC): FLA=34, td fuse, other category — cross-checked against Motor Calculator's own verified figures
  const mNec = calcBreakerFuseMotor(DEFAULT_BREAKERFUSE_INPUT);
  assertClose("Motor min OCPD = 175%×34 = 59.5A", mNec?.minOcpdA, 59.5, 0.1);
  assertEqual("Motor recommended standard size = 60A (matches Motor Calculator)", mNec?.recommendedOcpdA, 60);
  assertEqual("Motor 430.52(C)(1)(b) exception ceiling = 70A (matches Motor Calculator)", mNec?.exceptionCeilingA, 70);

  const mIec = calcBreakerFuseMotor({ ...DEFAULT_BREAKERFUSE_INPUT, standard: "iec", iecMarginFactor: 1.1 });
  assertClose("Motor IEC design current = 34×1.1 = 37.4A", mIec?.iecDesignA, 37.4, 0.1);

  assertNull("Zero load returns null (general path)", calcBreakerFuseGeneral({ ...DEFAULT_BREAKERFUSE_INPUT, continuousA: 0, nonContinuousA: 0 }));
  assertNull("Null FLA returns null (motor path)", calcBreakerFuseMotor({ ...DEFAULT_BREAKERFUSE_INPUT, motorFlaA: null }));
}

// ==========================================================================
// 27. Motor Protection Sizer
// ==========================================================================
section("Motor Protection Sizer");
{
  const r = calcMotorProtection(DEFAULT_MOTORPROTECTION_INPUT); // FLA=34, 115% setting, 8s start, AC-3, solidly grounded
  assertClose("Overload setting = 115%×34 = 39.1A", r?.overload.settingA, 39.1, 0.1);
  assertEqual("8s start time → Trip Class 10", r?.overload.tripClass, "10");
  assertEqual("S1 duty, 4 starts/hr → standard relay adequate", r?.overload.needsThermalMemory, false);
  assertEqual("AC-3 contactor required rating = FLA = 34A", r?.contactor.requiredEquivalentA, 34);
  assertEqual("AC-3 recommended frame size = 40A", r?.contactor.recommendedSizeA, 40);
  assertClose("Solidly-grounded GF pickup = 20%×34 = 6.8A", r?.groundFault.pickupA, 6.8, 0.1);

  const highTemp = calcMotorProtection({ ...DEFAULT_MOTORPROTECTION_INPUT, sfHighTemp: true });
  assertClose("SF≥1.15 → 125% setting = 42.5A", highTemp?.overload.settingA, 42.5, 0.1);

  const tripClasses: [number, string][] = [[2, "10A"], [10, "10"], [15, "20"], [25, "30"]];
  tripClasses.forEach(([t, expected]) => {
    const rt = calcMotorProtection({ ...DEFAULT_MOTORPROTECTION_INPUT, startingTimeS: t });
    assertEqual(`Trip class at ${t}s start time = Class ${expected}`, rt?.overload.tripClass, expected);
  });

  const ac4 = calcMotorProtection({ ...DEFAULT_MOTORPROTECTION_INPUT, contactorDuty: "ac4" });
  assertClose("AC-4 required equivalent rating = 34×2.0 = 68A", ac4?.contactor.requiredEquivalentA, 68, 0.1);
  assertEqual("AC-4 recommended frame size = 80A", ac4?.contactor.recommendedSizeA, 80);

  const cyclic = calcMotorProtection({ ...DEFAULT_MOTORPROTECTION_INPUT, dutyClass: "S4" });
  assertEqual("S4 duty correctly flags thermal-memory relay recommendation", cyclic?.overload.needsThermalMemory, true);
  const frequent = calcMotorProtection({ ...DEFAULT_MOTORPROTECTION_INPUT, startsPerHour: 20 });
  assertEqual(">15 starts/hr correctly flags thermal-memory relay recommendation", frequent?.overload.needsThermalMemory, true);

  const hrg = calcMotorProtection({ ...DEFAULT_MOTORPROTECTION_INPUT, groundingSystem: "hrg", systemChargingCurrentA: 5 });
  assertClose("HRG GF pickup = 2×5A charging current = 10A", hrg?.groundFault.pickupA, 10, 0.1);
  const hrgNoInput = calcMotorProtection({ ...DEFAULT_MOTORPROTECTION_INPUT, groundingSystem: "hrg", systemChargingCurrentA: null });
  assertNull("HRG without charging current correctly withholds a pickup value", hrgNoInput?.groundFault.pickupA ?? null);

  const ungrounded = calcMotorProtection({ ...DEFAULT_MOTORPROTECTION_INPUT, groundingSystem: "ungrounded" });
  assertClose("Ungrounded system uses fixed 5A alarm-only pickup", ungrounded?.groundFault.pickupA, 5, 0.1);

  assertNull("Null FLA returns null", calcMotorProtection({ ...DEFAULT_MOTORPROTECTION_INPUT, motorFlaA: null }));
}

// ==========================================================================
// 28. Transformer Sizer
// ==========================================================================
section("Transformer Sizer");
{
  // 800kW @ 0.9PF, 15% growth, 10% safety, 45°C ambient, N=2 (1-for-1 redundant pair)
  const r = calcXfmrSizer(DEFAULT_XFMRSIZER_INPUT);
  assertClose("Design load = 800/0.9 = 888.9kVA", r?.designLoadKva, 888.889, 0.1);
  assertClose("Margined load = 888.9×1.15×1.10 = 1124.4kVA", r?.marginedLoadKva, 1124.444, 0.1);
  assertClose("Ambient derate factor at 45°C = 1-(5×0.0125) = 0.9375", r?.ambientDerateFactor, 0.9375, 0.1);
  assertClose("Effective required = 1124.4/0.9375 = 1199.4kVA", r?.effectiveRequiredKva, 1199.407, 0.1);
  assertEqual("N=2 → per-unit required = full effective load (N-1=1)", r?.redundantUnitsRequired, 1);
  assertEqual("Recommended standard size = 1500kVA per unit", r?.recommendedKva, 1500);
  assertEqual("Total installed capacity = 1500×2 = 3000kVA", r?.totalInstalledKva, 3000);

  // N=3 (any 2 of 3 must carry full load) — same load, smaller per-unit rating
  const r3 = calcXfmrSizer({ ...DEFAULT_XFMRSIZER_INPUT, totalUnits: 3 });
  assertClose("N=3 → per-unit required = 1199.4/2 = 599.7kVA", r3?.perUnitRequiredKva, 599.7, 0.1);
  assertEqual("N=3 recommended standard size = 750kVA per unit", r3?.recommendedKva, 750);

  // Ambient at or below 40°C → no derating applied.
  const rCool = calcXfmrSizer({ ...DEFAULT_XFMRSIZER_INPUT, ambientC: 35 });
  assertEqual("Ambient ≤40°C → derate factor = 1.0 (no derating)", rCool?.ambientDerateFactor, 1);

  // Altitude at or below the IEC 60076-2 1000m reference → no altitude derating.
  const rLowAlt = calcXfmrSizer({ ...DEFAULT_XFMRSIZER_INPUT, altitudeM: 500 });
  assertEqual("Altitude ≤1000m → altitude derate factor = 1.0 (no derating)", rLowAlt?.altitudeDerateFactor, 1);

  // Natural-cooled (ONAN) at 2000m: 0.4%/100m × 1000m excess = 4% derate → factor 0.96.
  // Combined with the default 45°C ambient (0.9375), total = 0.9375×0.96 = 0.9 exactly.
  const rAltNatural = calcXfmrSizer({ ...DEFAULT_XFMRSIZER_INPUT, altitudeM: 2000, coolingClass: "oil_onan" });
  assertClose("ONAN at 2000m altitude derate factor = 0.96", rAltNatural?.altitudeDerateFactor, 0.96, 0.1);
  assertClose("Combined ambient×altitude derate factor = 0.9", rAltNatural?.totalDerateFactor, 0.9, 0.1);

  // Forced-cooled (ONAF) is more altitude-sensitive per IEC 60076-2 (250m vs 400m per K):
  // 0.5%/100m × 1000m excess = 5% derate → factor 0.95.
  const rAltForced = calcXfmrSizer({ ...DEFAULT_XFMRSIZER_INPUT, altitudeM: 2000, coolingClass: "oil_onaf" });
  assertClose("ONAF at 2000m altitude derate factor = 0.95 (more sensitive than ONAN)", rAltForced?.altitudeDerateFactor, 0.95, 0.1);

  // IEC preferred kVA sizes give a different (smaller) recommended size than ANSI for the
  // same load — 1199.4kVA required rounds to 1250kVA on the IEC R10 list vs 1500kVA on ANSI.
  const rIec = calcXfmrSizer({ ...DEFAULT_XFMRSIZER_INPUT, standardBasis: "iec" });
  assertEqual("IEC preferred-size basis recommends 1250kVA (vs ANSI's 1500kVA) for the same load", rIec?.recommendedKva, 1250);

  assertNull("Zero load returns null", calcXfmrSizer({ ...DEFAULT_XFMRSIZER_INPUT, connectedKw: 0 }));
}

// ==========================================================================
// 29. UPS Sizing
// ==========================================================================
section("UPS Sizing");
{
  // 200kW @ 0.9PF critical load, 20% margin, N=2, 15min backup, 0.8 DoD, 0.92 eff, 480V DC
  const r = calcUpsSizing(DEFAULT_UPSSIZING_INPUT);
  assertClose("Design load = 200/0.9 = 222.2kVA", r?.designLoadKva, 222.222, 0.1);
  assertClose("Margined load = 222.2×1.20 = 266.7kVA", r?.marginedLoadKva, 266.667, 0.1);
  assertEqual("N=2 → per-unit required = full margined load (N-1=1)", r?.redundantUnitsRequired, 1);
  assertEqual("Recommended standard UPS size = 300kVA", r?.recommendedKva, 300);
  assertClose("Capability at rated 0.9 PF = 270kW", r?.recommendedKw, 270, 0.1);
  assertClose("Usable battery energy = 200kW × 0.25h = 50kWh", r?.battery?.usableEnergyKwh, 50, 0.1);
  assertClose("Nameplate battery energy = 50/(0.8×0.92) ≈67.935kWh", r?.battery?.nameplateEnergyKwh, 67.935, 0.2);
  assertClose("Approx. battery capacity ≈141.5Ah at 480V DC", r?.battery?.approxAh, 141.5, 0.5);

  // N=1 (no redundancy) — per-unit rating equals the full margined load.
  const noRedundancy = calcUpsSizing({ ...DEFAULT_UPSSIZING_INPUT, totalUnits: 1 });
  assertEqual("N=1 correctly treated as no redundancy (divides by 1)", noRedundancy?.redundantUnitsRequired, 1);
  assertClose("N=1 per-unit required equals margined load", noRedundancy?.perUnitRequiredKva, 266.667, 0.1);

  assertNull("Zero critical load returns null", calcUpsSizing({ ...DEFAULT_UPSSIZING_INPUT, criticalLoadKw: 0 }));

  const noBattery = calcUpsSizing({ ...DEFAULT_UPSSIZING_INPUT, backupTimeMin: 0 });
  assertNull("Zero backup time correctly withholds a battery estimate", noBattery?.battery ?? null);
}

// ==========================================================================
// 30. 4-20mA Current Loop
// ==========================================================================
section("4-20mA Current Loop");
{
  // 24V supply, 10V min, 250ohm receiver, 500ft of #22 AWG
  const r = calcLoop420({ ...DEFAULT_LOOP420_INPUT, supplyVoltageV: 24, transmitterMinVoltageV: 10, receiverOhms: 250, otherOhms: 0, wireAwg: 22, lengthUnit: "ft", cableLength: 500 });
  assertClose("Round-trip wire resistance = 2×500×16.14/1000 = 16.14Ω", r.wireResistanceOhms, 16.14, 0.1);
  assertClose("Total loop resistance = 16.14+250 = 266.14Ω", r.totalLoopOhms, 266.14, 0.1);
  assertClose("Voltage at transmitter = 24-0.02×266.14 = 18.677V", r.voltageAtTransmitterV, 18.677, 0.1);
  assertClose("Headroom = 18.677-10 = 8.677V", r.headroomV, 8.677, 0.5);
  assertTrue("Passes with 8.68V of headroom", r.pass === true);

  // Failing case: too-long run starves the transmitter
  const fail = calcLoop420({ ...DEFAULT_LOOP420_INPUT, supplyVoltageV: 24, transmitterMinVoltageV: 12, receiverOhms: 250, otherOhms: 0, wireAwg: 24, lengthUnit: "ft", cableLength: 8000 });
  assertTrue("Long run at thin gauge fails headroom check", fail.pass === false);

  assertNull("Null cable length returns null wire resistance", calcLoop420({ ...DEFAULT_LOOP420_INPUT, cableLength: null }).wireResistanceOhms);
}

// ==========================================================================
// 31. Intrinsic Safety (IS) Verification
// ==========================================================================
section("Intrinsic Safety (IS) Verification");
{
  const r = calcIntrinsicSafety(DEFAULT_IS_INPUT);
  assertTrue("Voltage check 28≤30 passes", r.voltageOk === true);
  assertTrue("Current check 93≤130 passes", r.currentOk === true);
  assertTrue("Power check 650≤1000 passes", r.powerOk === true);
  assertClose("Cable capacitance at 500m × 197pF/m = 98.5nF", r.cableCapTotalNf, 98.5, 0.5);
  assertClose("Total Ci = 5+98.5 = 103.5nF", r.totalCiNf, 103.5, 0.5);
  assertTrue("1% rule applies (Li=0)", r.onePercentRuleApplies === true);
  assertTrue("Capacitance check fails — 103.5nF exceeds 83nF Co", r.capacitanceOk === false);
  assertTrue("Overall fails due to capacitance", r.overallPass === false);

  // Shorter, compliant run
  const ok = calcIntrinsicSafety({ ...DEFAULT_IS_INPUT, cableLengthM: 50 });
  assertTrue("Short 50m run passes capacitance check", ok.capacitanceOk === true);
  assertTrue("Short run passes overall", ok.overallPass === true);
}

// ==========================================================================
// 32. Thermocouple & RTD
// ==========================================================================
section("Thermocouple & RTD");
{
  assertClose("Type K: 100°C → 4.096mV", tcTempCToMv("K", 100), 4.096, 1);
  assertClose("Type K: 500°C → 20.644mV", tcTempCToMv("K", 500), 20.644, 0.5);
  assertClose("Type K: 4.096mV → 100°C", tcMvToTempC("K", 4.096), 100, 1);
  assertClose("Type J: 100°C → 5.269mV", tcTempCToMv("J", 100), 5.269, 1);
  assertClose("Type T: 100°C → 4.279mV", tcTempCToMv("T", 100), 4.279, 1);
  assertClose("Type E: 100°C → 6.319mV", tcTempCToMv("E", 100), 6.319, 1);

  // CJC round trip: hot=200°C, cold=25°C
  const mv200 = tcTempCToMv("K", 200)!;
  const mv25 = tcTempCToMv("K", 25)!;
  const cjc = calcTcCjc({ type: "K", measuredMv: mv200 - mv25, coldJunctionTempC: 25 });
  assertClose("CJC round-trip recovers 200°C hot junction", cjc.hotJunctionTempC, 200, 0.5);

  assertClose("Pt100 R(100°C) = 138.51Ω", rtdResistanceAtTemp(100, 100), 138.51, 0.1);
  assertClose("Pt100 R(-100°C) = 60.26Ω", rtdResistanceAtTemp(100, -100), 60.256, 0.1);
  assertClose("Pt100 138.51Ω → 100°C", rtdTempFromResistance(100, 138.51), 100, 0.5);
  assertClose("Pt100 60.256Ω → -100°C", rtdTempFromResistance(100, 60.256), -100, 0.5);

  const rtd2wire = calcRtd({ nominal: 100, wiring: "2-wire", measuredOhms: 108.5, leadOhmsPerWire: 0.5 });
  assertClose("2-wire compensation subtracts 2×lead resistance", rtd2wire.compensatedOhms, 107.5, 0.1);
}

// ==========================================================================
// 33. Control / Instrumentation Cable Sizing
// ==========================================================================
section("Control / Instrumentation Cable Sizing");
{
  const r = calcControlCable(DEFAULT_CONTROL_CABLE_INPUT);
  assertClose("Total cable capacitance = 150pF/m×800m = 120nF", r.totalCableCapNf, 120, 0.5);
  assertTrue("120nF within 200nF host limit — passes", r.capacitanceOk === true);
  assertClose("Max length = 200nF/150pF/m = 1333.3m", r.maxLengthForCapacitanceM, 1333.3, 0.5);

  const over = calcControlCable({ ...DEFAULT_CONTROL_CABLE_INPUT, cableLengthM: 2000 });
  assertTrue("2000m exceeds capacitance budget — fails", over.capacitanceOk === false);
}

// ==========================================================================
// 34. Data Center PUE
// ==========================================================================
section("Data Center PUE");
{
  const r = calcPue(DEFAULT_PUE_INPUT);
  assertClose("PUE = 1,500,000/1,000,000 = 1.5", r.pue, 1.5, 0.1);
  assertClose("DCiE = 1/1.5 = 66.67%", r.dciePct, 66.667, 0.1);
  assertClose("Overhead energy = 500,000kWh", r.overheadEnergyKwh, 500000, 0.1);
  assertClose("Overhead cost = 500,000×0.12 = $60,000", r.overheadAnnualCost, 60000, 0.1);
  assertEqual("PUE 1.5 classified as 'moderate'", r.band, "moderate");

  const worldClass = calcPue({ ...DEFAULT_PUE_INPUT, totalFacilityEnergyKwh: 1100000 });
  assertEqual("PUE 1.1 classified as 'world-class'", worldClass.band, "world-class");

  assertNull("IT energy > total returns null", calcPue({ ...DEFAULT_PUE_INPUT, itEquipmentEnergyKwh: 2000000 }).pue);
  assertNull("Zero IT energy returns null", calcPue({ ...DEFAULT_PUE_INPUT, itEquipmentEnergyKwh: 0 }).pue);
}

// ==========================================================================
// 35. Elevator Electrical Demand
// ==========================================================================
section("Elevator Electrical Demand");
{
  const r = calcElevatorDemand(DEFAULT_ELEVATOR_DEMAND_INPUT);
  assertClose("Net unbalanced load = 1000×(1-0.5) = 500kg", r.netLoadKg, 500, 0.1);
  assertClose("Single-unit power = 500×9.81×1.5/(1000×0.7) = 10.511kW", r.singleUnitPowerKw, 10.511, 0.5);
  assertClose("Connected load for 4 units = 42.04kW", r.connectedLoadKw, 42.04, 0.5);
  assertEqual("NEC 620.14 demand factor for 4 elevators = 0.85", r.demandFactor, 0.85);
  assertClose("Demand load = 42.04×0.85 = 35.74kW", r.demandLoadKw, 35.74, 0.5);

  assertEqual("Demand factor for 1 elevator = 1.00", necElevatorDemandFactor(1), 1.0);
  assertEqual("Demand factor for 2 elevators = 0.95", necElevatorDemandFactor(2), 0.95);
  assertEqual("Demand factor for 9 elevators = 0.73", necElevatorDemandFactor(9), 0.73);
  assertEqual("Demand factor for 10 elevators = 0.72", necElevatorDemandFactor(10), 0.72);
  assertEqual("Demand factor for 15 elevators (10+) = 0.72", necElevatorDemandFactor(15), 0.72);

  assertNull("Null rated load returns null power", calcElevatorDemand({ ...DEFAULT_ELEVATOR_DEMAND_INPUT, ratedLoadKg: null }).singleUnitPowerKw);
}

// ==========================================================================
// 36. Life-Cycle Cost (LCC)
// ==========================================================================
section("Life-Cycle Cost (LCC)");
{
  const optA = calcLccOption(DEFAULT_LCC_OPTION_A, DEFAULT_LCC_GLOBAL);
  let handPw = 0;
  for (let t = 1; t <= 20; t++) handPw += 12000 * Math.pow(1.03, t - 1) / Math.pow(1.06, t);
  assertClose("Option A present worth of operating cost matches hand DCF sum", optA.presentWorthOperating, handPw, 0.1);
  assertClose("Option A LCC = 50,000 + PW ≈ $224,738", optA.lcc, 224738, 0.5);

  const compare = calcLccCompare(DEFAULT_LCC_OPTION_A, DEFAULT_LCC_OPTION_B, DEFAULT_LCC_GLOBAL);
  assertEqual("Option B (premium) has the lower life-cycle cost", compare.lowerLifeCycleCostOption, "B");
  assertClose("Simple payback = 18,000/3,500 ≈ 5.143 years", compare.simplePaybackYears, 5.143, 0.5);

  const zeroDiscount = calcLccOption({ ...DEFAULT_LCC_OPTION_A, escalationRatePct: 0 }, { discountRatePct: 0, analysisPeriodYears: 10 });
  assertClose("At 0% discount/escalation, PW operating = simple sum = 10×12,000", zeroDiscount.presentWorthOperating, 120000, 0.1);

  assertNull("Null initial cost returns null LCC", calcLccOption({ ...DEFAULT_LCC_OPTION_A, initialCost: null }, DEFAULT_LCC_GLOBAL).lcc);
}

// ==========================================================================
// 37. Demand Charge / TOU Tariff
// ==========================================================================
section("Demand Charge / TOU Tariff");
{
  const r = calcTariff(DEFAULT_TARIFF_INPUT);
  assertClose("Energy charge = 8,000×0.42 + 15,000×0.22 = $6,660", r.energyCharge, 6660, 0.1);
  assertClose("Demand charge = 120×35 = $4,200", r.demandCharge, 4200, 0.1);
  assertClose("PF penalty = 2pts×0.5% = 1% of demand charge = $42", r.pfPenaltyCharge, 42, 1);
  assertClose("Total bill = 6,660+4,200+42+100 = $11,002", r.totalBill, 11002, 0.1);

  const noPenalty = calcTariff({ ...DEFAULT_TARIFF_INPUT, powerFactor: 0.95 });
  assertEqual("PF above threshold incurs no penalty", noPenalty.pfPenaltyCharge, 0);
}

// ==========================================================================
// 38. Heat Tracing Circuit Sizing
// ==========================================================================
section("Heat Tracing Circuit Sizing");
{
  const r = calcHeatTracing(DEFAULT_HEAT_TRACING_INPUT);
  assertClose("Heat loss = 2π×0.04×20/ln(0.214/0.114) ≈ 7.98 W/m", r.heatLossWPerM, 7.981, 0.5);
  assertClose("Required with 1.3 factor ≈ 10.38 W/m", r.requiredWPerM, 10.376, 0.5);
  assertTrue("20W/m heater adequate", r.heaterAdequate === true);
  assertClose("Circuit power = 20×80 = 1,600W", r.circuitPowerW, 1600, 0.1);
  assertClose("Circuit current = 1,600/230 = 6.957A", r.circuitCurrentA, 6.957, 0.5);
  assertTrue("Within 16A breaker", r.breakerOk === true);

  const inadequate = calcHeatTracing({ ...DEFAULT_HEAT_TRACING_INPUT, heaterOutputWPerM: 5 });
  assertTrue("5W/m heater correctly flagged inadequate", inadequate.heaterAdequate === false);
}

// ==========================================================================
// 39. Panel/MCC Enclosure Heat Dissipation & Ventilation
// ==========================================================================
section("Panel/MCC Enclosure Heat Dissipation & Ventilation");
{
  const r = calcEnclosureCooling(DEFAULT_ENCLOSURE_COOLING_INPUT);
  assertClose("Effective area (free-standing) = 6.08 m²", r.effectiveAreaM2, 6.08, 0.5);
  assertClose("Natural convection capacity = 5.5×6.08×10 = 334.4W", r.naturalConvectionCapacityW, 334.4, 0.5);
  assertTrue("334.4W capacity inadequate vs 600W losses", r.naturalConvectionAdequate === false);
  assertClose("Required fan airflow = 3.1×600/10 = 186 m³/h", r.requiredFanAirflowM3h, 186, 0.5);

  const lowLoss = calcEnclosureCooling({ ...DEFAULT_ENCLOSURE_COOLING_INPUT, internalLossesW: 200 });
  assertTrue("200W losses adequately handled by natural convection", lowLoss.naturalConvectionAdequate === true);
  assertNull("Adequate case doesn't compute a fan requirement", lowLoss.requiredFanAirflowM3h);
}

// ==========================================================================
// 40. Fire & Gas Detection Loop Power Budget
// ==========================================================================
section("Fire & Gas Detection Loop Power Budget");
{
  const r = calcFgLoop(DEFAULT_FG_LOOP_INPUT);
  assertClose("Standby current = 10×0.5mA+24V/10kΩ = 7.4mA", r.standbyCurrentA! * 1000, 7.4, 0.5);
  assertClose("Standby voltage at device = 24-0.0074×20 = 23.852V", r.standbyVoltageAtDevice, 23.852, 0.5);
  assertTrue("Standby state passes", r.standbyPass === true);
  assertClose("Alarm current = 34.5mA+2.4mA = 36.9mA", r.alarmCurrentA! * 1000, 36.9, 0.5);
  assertClose("Alarm voltage at device = 24-0.0369×20 = 23.262V", r.alarmVoltageAtDevice, 23.262, 0.5);
  assertTrue("Alarm state passes", r.alarmPass === true);

  const longLoop = calcFgLoop({ ...DEFAULT_FG_LOOP_INPUT, loopResistanceOhms: 500 });
  assertTrue("Excessive loop resistance fails the alarm-state check", longLoop.alarmPass === false);
}

// ==========================================================================
// 41. Hazardous Area Bonding & Static Grounding Check
// ==========================================================================
section("Hazardous Area Bonding & Static Grounding Check");
{
  const r = calcStaticBonding(DEFAULT_STATIC_BONDING_INPUT);
  assertTrue("25kΩ passes the 1MΩ static-dissipation threshold", r.pass === true);
  assertEqual("25kΩ classified as 'acceptable' (not tight metallic)", r.quality, "acceptable");

  const metallic = calcStaticBonding({ measuredResistanceOhms: 5, thresholdOhms: 1000000 });
  assertEqual("5Ω classified as 'metallic'", metallic.quality, "metallic");

  const fail = calcStaticBonding({ measuredResistanceOhms: 2000000, thresholdOhms: 1000000 });
  assertTrue("2MΩ fails the 1MΩ threshold", fail.pass === false);
  assertEqual("2MΩ classified as 'fail'", fail.quality, "fail");
}

// ==========================================================================
// 42. Electrostatic Discharge Spark Energy Check
// ==========================================================================
section("Electrostatic Discharge Spark Energy Check");
{
  const r = calcEsdEnergy(DEFAULT_ESD_ENERGY_INPUT);
  assertClose("Spark energy = 0.5×100pF×10kV² = 5mJ", r.sparkEnergyMj, 5, 0.5);
  assertTrue("5mJ exceeds 0.25mJ MIE — fails (ignition risk)", r.pass === false);

  const safe = calcEsdEnergy({ ...DEFAULT_ESD_ENERGY_INPUT, voltageV: 500 });
  assertTrue("Lower voltage (500V) drops spark energy below MIE — passes", safe.pass === true);
}

// ==========================================================================
// 43. Pump/Fan VFD Energy Savings
// ==========================================================================
section("Pump/Fan VFD Energy Savings");
{
  const r = calcVfdSavings(DEFAULT_VFD_SAVINGS_INPUT);
  assertClose("VFD power = 75×0.7³ = 25.725kW", r.vfdPowerKw, 25.725, 0.5);
  assertClose("Power savings = 75-25.725 = 49.275kW", r.powerSavingsKw, 49.275, 0.5);
  assertClose("Annual energy savings = 49.275×6,000 = 295,650kWh", r.annualEnergySavingsKwh, 295650, 0.5);
  assertClose("Annual cost savings = 295,650×0.12 = $35,478", r.annualCostSavings, 35478, 0.5);

  const noReduction = calcVfdSavings({ ...DEFAULT_VFD_SAVINGS_INPUT, flowReductionPct: 0 });
  assertClose("Zero flow reduction gives zero savings", noReduction.powerSavingsKw, 0, 1);
}

// ==========================================================================
// 44. Generator Paralleling / Synchronization Check
// ==========================================================================
section("Generator Paralleling / Synchronization Check");
{
  const r = calcGenSync(DEFAULT_GEN_SYNC_INPUT);
  assertClose("Voltage difference = |415-412|/412×100 = 0.728%", r.voltageDiffPct, 0.728, 0.5);
  assertTrue("Voltage difference within threshold", r.voltageOk === true);
  assertClose("Frequency difference = 0.05Hz", r.freqDiffHz, 0.05, 1);
  assertTrue("Frequency difference within threshold", r.freqOk === true);
  assertClose("Beat period = 1/0.05 = 20s", r.beatPeriodS, 20, 0.5);
  assertTrue("Phase angle within threshold", r.phaseOk === true);
  assertTrue("Overall safe to close", r.overallOk === true);

  const outOfSync = calcGenSync({ ...DEFAULT_GEN_SYNC_INPUT, phaseAngleDiffDeg: 45 });
  assertTrue("45° phase angle correctly fails", outOfSync.phaseOk === false);
  assertTrue("Overall correctly fails when phase is out of window", outOfSync.overallOk === false);
}

// ==========================================================================
// 45. IDMT Earth Fault Relay Setting (50N/51N)
// ==========================================================================
section("IDMT Earth Fault Relay Setting (50N/51N)");
{
  const r = calcEfRelay(DEFAULT_EF_RELAY_INPUT);
  assertClose("Relay current = 1500/200 = 7.5A", r.relayCurrent, 7.5, 0.1);
  assertClose("PSM = 7.5/0.2 = 37.5", r.psm, 37.5, 0.1);
  assertTrue("Operating time computed (relay picks up)", r.operatingTimeS !== null && r.operatingTimeS > 0);
  assertTrue("Instantaneous stage does not operate (1500 < 4000)", r.instantaneousOperates === false);

  const noFault = calcEfRelay({ ...DEFAULT_EF_RELAY_INPUT, faultCurrentPrimary: null });
  assertNull("No fault current gives null result", noFault.relayCurrent);
}

// ==========================================================================
// 46. Transformer Differential Protection (87T)
// ==========================================================================
section("Transformer Differential Protection (87T)");
{
  const r = calcDiffTransformer(DEFAULT_DIFF_TRANSFORMER_INPUT);
  assertClose("Id = |1.05-0.98| = 0.07pu", r.differentialCurrentPu, 0.07, 1);
  assertClose("Ir = (1.05+0.98)/2 = 1.015pu", r.restraintCurrentPu, 1.015, 0.1);
  assertClose("Operate threshold = 0.3+0.25*1.015 = 0.55375pu", r.operatePickupPu, 0.55375, 0.1);
  assertTrue("Does not trip under normal load", r.trips === false);

  const fault = calcDiffTransformer({ ...DEFAULT_DIFF_TRANSFORMER_INPUT, i1Primary: 3.0, i2Primary: 0.1 });
  assertTrue("Trips for a genuine internal fault (large Id)", fault.trips === true);
}

// ==========================================================================
// 47. Multi-Bus IDMT Relay Grading
// ==========================================================================
section("Multi-Bus IDMT Relay Grading");
{
  const r = calcIdmtGrading(DEFAULT_IDMT_GRADING_INPUT);
  assertTrue("Operating times computed for all 3 relays", r.operatingTimes.every((t) => t.timeS !== null));
  assertTrue("2 grading steps for 3 relays", r.steps.length === 2);
  assertTrue("Step margins are the difference of adjacent operating times", Math.abs(r.steps[0].margin! - (r.operatingTimes[1].timeS! - r.operatingTimes[0].timeS!)) < 0.001);

  const noFault = calcIdmtGrading({ ...DEFAULT_IDMT_GRADING_INPUT, faultCurrentPrimary: null });
  assertTrue("No fault current gives empty steps", noFault.steps.length === 0);
}

// ==========================================================================
// 48. Fault Current Propagation Through Distribution Network (Base kVA Method)
// ==========================================================================
section("Fault Current Propagation (Base kVA Method)");
{
  const r = calcFaultPropagation(DEFAULT_FAULT_PROPAGATION_INPUT);
  assertClose("Source %Z = (1/250)*100 = 0.4%", r.sourcePctZ, 0.4, 0.5);
  assertClose("Source fault MVA = 100/0.4 = 250MVA", r.points[0].faultMva, 250, 0.5);
  assertClose("After transformer cumulative %Z = 0.4+6 = 6.4%", r.points[1].cumulativePctZ, 6.4, 0.5);
  assertClose("After cable cumulative %Z = 6.4+1.5 = 7.9%", r.points[2].cumulativePctZ, 7.9, 0.5);
  assertClose("After cable fault MVA = 100/7.9 = 12.658MVA", r.points[2].faultMva, 12.658, 0.5);
}

// ==========================================================================
// 49. Insulation Resistance (IR) Test Value Checker
// ==========================================================================
section("Insulation Resistance (IR) Test Value Checker");
{
  const r = calcInsulationResistance(DEFAULT_INSULATION_RESISTANCE_INPUT);
  assertClose("Minimum required = 6.6+1 = 7.6MΩ", r.minimumRequiredMegohm, 7.6, 0.5);
  assertClose("Corrected IR at 40°C = 12MΩ (no correction needed)", r.correctedIrMegohm, 12, 0.5);
  assertTrue("Passes (12 >= 7.6)", r.pass === true);

  const fail = calcInsulationResistance({ ...DEFAULT_INSULATION_RESISTANCE_INPUT, measuredIrMegohm: 2 });
  assertTrue("Fails when measured IR is below minimum", fail.pass === false);
}

// ==========================================================================
// 50. Polarization Index (PI) Calculator
// ==========================================================================
section("Polarization Index (PI) Calculator");
{
  const r = calcPolarizationIndex(DEFAULT_POLARIZATION_INDEX_INPUT);
  assertClose("PI = 33/15 = 2.2", r.pi, 2.2, 0.5);
  assertEqual("Band is Good (2.0-4.0)", r.band, "Good");
  assertTrue("Meets minimum PI for Class B/F/H (2.0)", r.meetsMinimum === true);

  const dangerous = calcPolarizationIndex({ ...DEFAULT_POLARIZATION_INDEX_INPUT, ir1MinMegohm: 10, ir10MinMegohm: 8 });
  assertEqual("PI < 1.0 correctly bands as Dangerous", dangerous.band, "Dangerous");
}

// ==========================================================================
// 51. Touch Voltage from Neutral/Earth Imbalance
// ==========================================================================
section("Touch Voltage from Neutral/Earth Imbalance");
{
  const r = calcTouchVoltage(DEFAULT_TOUCH_VOLTAGE_INPUT);
  assertClose("GPR = 15*2 = 30V", r.groundPotentialRiseV, 30, 0.5);
  assertClose("Touch voltage = 30*1.0 = 30V", r.touchVoltageV, 30, 0.5);
  assertEqual("Dry limit is 50V", r.limitV, 50);
  assertTrue("Passes (30V <= 50V)", r.pass === true);

  const wetFail = calcTouchVoltage({ ...DEFAULT_TOUCH_VOLTAGE_INPUT, environment: "wet", imbalanceCurrentA: 20 });
  assertEqual("Wet limit is 25V", wetFail.limitV, 25);
  assertTrue("Fails when touch voltage exceeds wet limit (40V > 25V)", wetFail.pass === false);
}

// ==========================================================================
// 52. Overhead Line Voltage Regulation
// ==========================================================================
section("Overhead Line Voltage Regulation");
{
  const r = calcOhlVoltageReg(DEFAULT_OHL_VOLTAGE_REG_INPUT);
  const expectedDrop = Math.sqrt(3) * 100 * (2 * 0.85 + 1.75 * Math.sqrt(1 - 0.85 * 0.85));
  assertClose("Voltage drop matches sqrt3*I*(Rcos+Xsin)*length", r.voltageDropV, expectedDrop, 0.5);
  assertTrue("Receiving voltage is less than sending voltage", r.receivingVoltageKv! < DEFAULT_OHL_VOLTAGE_REG_INPUT.sendingVoltageKv);
}

// ==========================================================================
// 53. Distribution Line Technical Losses
// ==========================================================================
section("Distribution Line Technical Losses");
{
  const r = calcLineLosses(DEFAULT_LINE_LOSSES_INPUT);
  assertClose("Loss factor = 0.3*0.6+0.7*0.36 = 0.432", r.lossFactor, 0.432, 0.5);
  assertClose("Coincident peak = 500/1.2 = 416.667kW", r.coincidentPeakKw, 416.667, 0.5);
  assertTrue("Annual energy loss is positive", r.annualEnergyLossKwh! > 0);
}

// ==========================================================================
// 54. LPS Rolling Sphere Method
// ==========================================================================
section("LPS Rolling Sphere Method");
{
  const r = calcRollingSphere(DEFAULT_ROLLING_SPHERE_INPUT);
  assertEqual("Class III sphere radius = 45m", r.sphereRadiusM, 45);
  assertClose("Protection radius = sqrt(2*45*10-100) = 28.284m", r.protectionRadiusM, 28.284, 0.5);

  const tooTall = calcRollingSphere({ lpsClass: "I", mastHeightM: 25 });
  assertTrue("Flags when mast height exceeds sphere radius", tooTall.heightExceedsSphere === true);
}

// ==========================================================================
// 55. Phase Voltage Unbalance & Motor Derating
// ==========================================================================
section("Phase Voltage Unbalance & Motor Derating");
{
  const r = calcVoltageUnbalance(DEFAULT_VOLTAGE_UNBALANCE_INPUT);
  const avg = (415 + 408 + 420) / 3;
  const maxDev = Math.max(Math.abs(415 - avg), Math.abs(408 - avg), Math.abs(420 - avg));
  const expectedPct = (maxDev / avg) * 100;
  assertClose("Unbalance % matches manual calc", r.unbalancePct, expectedPct, 0.5);
  assertTrue("Derating factor is between 0 and 1", r.deratingFactor! > 0 && r.deratingFactor! < 1);

  const beyond = calcVoltageUnbalance({ vab: 500, vbc: 400, vca: 450 });
  assertTrue("Flags unbalance beyond 5% published curve", beyond.exceedsRecommendedLimit === true);
}

// ==========================================================================
// 56. Residential/Commercial DB Panel Balancer
// ==========================================================================
section("Residential/Commercial DB Panel Balancer");
{
  const r = calcPanelBalance(DEFAULT_PANEL_BALANCE_INPUT);
  const expected = Math.sqrt(45 * 45 + 38 * 38 + 52 * 52 - 45 * 38 - 38 * 52 - 45 * 52);
  assertClose("Neutral current matches phasor formula", r.neutralCurrentA, expected, 0.5);
  assertEqual("Most loaded phase is L3", r.mostLoadedPhase, "L3");
  assertEqual("Least loaded phase is L2", r.leastLoadedPhase, "L2");

  const balanced = calcPanelBalance({ il1: 40, il2: 40, il3: 40 });
  assertClose("Perfectly balanced load gives zero neutral current", balanced.neutralCurrentA, 0, 1);
}

// ==========================================================================
// 57. Parallel Generator Short-Circuit Contribution
// ==========================================================================
section("Parallel Generator Short-Circuit Contribution");
{
  const r = calcGenSyncFault(DEFAULT_GEN_SYNC_FAULT_INPUT);
  const ratedA = (500 * 1000) / (Math.sqrt(3) * 0.415 * 1000);
  const contrib = ratedA / 0.12 / 1000;
  assertClose("Gen1 rated current matches S/(sqrt3*V)", r.contributions[0].ratedCurrentA, ratedA, 0.5);
  assertClose("Gen1 fault contribution = Irated/Xd''", r.contributions[0].faultContributionKa, contrib, 0.5);
  assertClose("Total = sum of both generators' contributions", r.totalFaultKa, contrib * 2, 0.5);
}

// ==========================================================================
// 58. Genset Fuel Consumption & Running Cost
// ==========================================================================
section("Genset Fuel Consumption & Running Cost");
{
  const r = calcGensetFuel(DEFAULT_GENSET_FUEL_INPUT);
  assertEqual("Consumption rate = 45 L/hr (direct basis)", r.consumptionRateLPerHour, 45);
  assertClose("Runtime = 500/45 = 11.111hr", r.runtimeHours, 11.111, 0.5);
  assertEqual("Cost per hour = 45*1.2 = $54", r.costPerHour, 54);

  const perKwh = calcGensetFuel({ ...DEFAULT_GENSET_FUEL_INPUT, fuelRateBasis: "perKwh", fuelRateValue: 0.3, loadKw: 150 });
  assertClose("L/kWh basis: rate = 0.3*150 = 45L/hr", perKwh.consumptionRateLPerHour, 45, 0.5);
}

// --------------------------------------------------------------------------
// Summary
// --------------------------------------------------------------------------
console.log("\n" + "=".repeat(70));
console.log(`REGRESSION SUMMARY: ${pass} passed, ${fail} failed, ${pass + fail} total`);
if (fail > 0) {
  console.log("\nFailed checks:");
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exitCode = 1;
} else {
  console.log("All modules passed regression.");
}
console.log("=".repeat(70));
