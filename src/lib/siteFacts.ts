// Shared site facts quoted on several pages. The regression suite checks that
// AUTOMATED_CHECKS equals its own total, so the published figure cannot drift.
export const AUTOMATED_CHECKS = 741;

export interface ChangeEntry {
  date: string; // e.g. "November 2026"
  title: string;
  items: string[];
}

// Public change log for calculation results and published content, newest first.
export const CHANGE_LOG: ChangeEntry[] = [
  {
    date: "November 2026",
    title: "Installation method B2 and multi-cable pulling",
    items: [
      "LV Cable Sizing, EV Charging, Solar PV and BESS: installation method B1 is now correctly described as insulated conductors or single-core cables in conduit on a wall. Method B2 (multicore cable in conduit on a wall) has been added from IEC 60364-5-52 Tables B.52.4 and B.52.5. Previously a multicore cable in conduit could only be modelled as B1, which overstates its current rating by up to about 16%.",
      "Cable Pulling Tension: added one cable, three cables triangular and three cables cradled. The weight correction factor is now applied to straight sections and bends, and sidewall pressure uses the formula for each configuration. For three cables this raises the calculated tension; in the worked example it rises from 200 lbf to 363 lbf.",
      "The cable-pulling worked example now states the number of cables, the weight of each cable and the total, and the configuration.",
    ],
  },
  {
    date: "November 2026",
    title: "Second technical review",
    items: [
      "VFD energy savings: the affinity-law result is described as an upper bound on savings, not a conservative estimate.",
      "CT sizing: the fault-current table no longer extends beyond the CT's actual accuracy limit factor.",
      "Intrinsic safety, NFPA 110 and catalog descriptions: wording corrected to match the standards.",
      "Added a Short Circuit & Arc Flash guide, six worked examples and written guides under six more calculators.",
    ],
  },
  {
    date: "October 2026",
    title: "Full accuracy audit",
    items: [
      "Voltage drop (cable, EV, PV, BESS): the mV/A/m values are single-phase loop values and are now halved per conductor before the 2 or √3 factor. Results were previously about twice the correct drop.",
      "Earthing (IEEE 80): corrected the Km corner term, n = na·nb, the Lm term for rods, and the BS 7430 plate formula.",
      "Power factor correction: capacitance is now shown correctly in µF at the system voltage.",
      "VT sizing: IEC 61869-3 voltage factors and the open-delta winding voltage corrected.",
      "IEC 60909: the peak current uses method B (1.15·κ) when several sources feed the fault.",
      "MV cable: trefoil mutual heating for direct burial and the air gap for ducts included in T4.",
      "NEC: rounding rules for 430.62 and 440.22, the 240.4(D) small-conductor limit, 2000 kcmil at 60 °C, 220.57 EVSE load and the 392.22 mixed-cable tray rule corrected.",
      "IEEE 43: minimum insulation resistance by winding type.",
    ],
  },
];
