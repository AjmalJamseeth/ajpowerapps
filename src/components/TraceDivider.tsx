// Decorative circuit-trace divider: a trace with nodes and a lightning mark in the middle.
export function TraceDivider() {
  return (
    <svg className="trace-divider" viewBox="0 0 1200 28" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path className="td-line" d="M0 14H520L536 4H564L580 14H620L636 24H664L680 14H1200" />
      <path className="td-pulse" d="M0 14H520L536 4H564L580 14H620L636 24H664L680 14H1200" />
      <circle className="td-node" cx="300" cy="14" r="3" />
      <circle className="td-node" cx="900" cy="14" r="3" />
      <path className="td-bolt" d="M603 3L594 15H601L597 25L607 12H600Z" />
    </svg>
  );
}
