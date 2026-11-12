// Decorative hero illustration: the power system on the left (line, busbar,
// breaker, transformer) feeding the automation network on the right (IEDs,
// switch, SCADA, clock). Amber = energy, cyan = data. Animated with CSS only
// (see .pn-* rules in globals.css); motion stops for prefers-reduced-motion.

export function PowerNetMotif({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 520 440" className={`pn-motif ${className}`} aria-hidden="true" focusable="false">
      {/* faint blueprint frame */}
      <rect x="6" y="6" width="508" height="428" rx="18" className="pn-frame" />
      <path d="M6 60H514M6 380H514" className="pn-rule" />

      {/* transmission tower */}
      <g className="pn-struct">
        <path d="M58 360L80 120L102 360M64 300H96M70 240H90M74 180H86M80 120L80 96" />
        <path d="M50 150H110M56 190H104" />
        <path d="M64 300L90 240M96 300L70 240M70 240L86 180M90 240L74 180" />
      </g>
      {/* conductors to the busbar */}
      <path d="M110 150C150 150 160 110 196 110" className="pn-power pn-flow" />
      <path d="M104 190C150 190 170 118 196 118" className="pn-power pn-flow pn-slow" />

      {/* busbar */}
      <path d="M196 104V170" className="pn-bus" />
      <text x="190" y="92" className="pn-label" textAnchor="middle">132 kV</text>

      {/* breaker + transformer + feeder */}
      <path d="M196 140H232" className="pn-power" />
      <rect x="232" y="128" width="24" height="24" rx="3" className="pn-sym" />
      <path d="M256 140H282" className="pn-power" />
      <circle cx="296" cy="140" r="14" className="pn-sym" />
      <circle cx="314" cy="140" r="14" className="pn-sym" />
      <path d="M328 140H352" className="pn-power pn-flow" />
      <text x="305" y="118" className="pn-label" textAnchor="middle">33 kV</text>

      {/* lightning bolt badge */}
      <circle cx="244" cy="226" r="26" className="pn-badge" />
      <path d="M248 206L234 230H246L240 248L256 222H244Z" className="pn-bolt" />

      {/* instrument transformer to the IED */}
      <path d="M244 152V200" className="pn-power pn-dash" />
      <path d="M244 252V300H300" className="pn-data pn-flow" />

      {/* IEDs */}
      <g className="pn-node-g">
        <rect x="300" y="286" width="56" height="30" rx="6" className="pn-node" />
        <text x="328" y="305" className="pn-label pn-label-strong" textAnchor="middle">IED</text>
        <rect x="360" y="70" width="56" height="30" rx="6" className="pn-node" />
        <text x="388" y="89" className="pn-label pn-label-strong" textAnchor="middle">IED</text>
        <path d="M352 140H388V100" className="pn-power" />
      </g>

      {/* Ethernet switch */}
      <rect x="388" y="190" width="96" height="40" rx="8" className="pn-switch" />
      <path d="M402 222V214M414 222V214M426 222V214M438 222V214M450 222V214M462 222V214" className="pn-ports" />
      <text x="436" y="207" className="pn-label pn-label-strong" textAnchor="middle">SWITCH</text>

      {/* data links */}
      <path d="M388 100V150H420V190" className="pn-data pn-flow" />
      <path d="M356 300H376V210H388" className="pn-data pn-flow pn-slow" />
      <path d="M484 210H504V119H488" className="pn-data pn-flow" />
      <path d="M436 230V300" className="pn-data pn-flow pn-slow" />

      {/* SCADA, clock, gateway */}
      <rect x="432" y="104" width="56" height="30" rx="6" className="pn-node" />
      <text x="460" y="123" className="pn-label pn-label-strong" textAnchor="middle">SCADA</text>
      <rect x="408" y="300" width="56" height="30" rx="6" className="pn-node" />
      <text x="436" y="319" className="pn-label pn-label-strong" textAnchor="middle">PTP</text>

      {/* protocol tags */}
      <text x="358" y="262" className="pn-tag">GOOSE</text>
      <text x="350" y="176" className="pn-tag">MMS</text>
      <text x="498" y="172" className="pn-tag" textAnchor="end">IEC 104</text>

      {/* sine wave of the power system along the foot */}
      <path d="M24 410C44 390 64 390 84 410S124 430 144 410S184 390 204 410S244 430 264 410" className="pn-wave" />
      {/* data pulses along the foot */}
      <path d="M284 410H496" className="pn-data pn-bits" />
      <text x="24" y="40" className="pn-label">POWER · PROTECTION</text>
      <text x="496" y="40" className="pn-label" textAnchor="end">AUTOMATION · SCADA</text>
    </svg>
  );
}
