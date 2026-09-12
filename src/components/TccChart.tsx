"use client";

import { useMemo } from "react";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LogarithmicScale,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { RelaySettings, curvePoints } from "@/lib/idmt";

ChartJS.register(LineElement, PointElement, LogarithmicScale, Tooltip, Legend);

// Cycled across relays if there are more curves than colors.
const CURVE_COLORS = ["#fbbf24", "#22d3ee", "#a78bfa", "#f472b6", "#34d399", "#fb7185", "#60a5fa", "#facc15"];

export default function TccChart({
  relays,
  minCurrent,
  maxCurrent,
}: {
  relays: RelaySettings[];
  minCurrent: number;
  maxCurrent: number;
}) {
  const datasets = useMemo(
    () =>
      relays.map((relay, i) => ({
        label: relay.label,
        data: curvePoints(relay, minCurrent, maxCurrent),
        borderColor: CURVE_COLORS[i % CURVE_COLORS.length],
        backgroundColor: CURVE_COLORS[i % CURVE_COLORS.length],
        borderWidth: 2,
        pointRadius: 0,
        tension: 0,
      })),
    [relays, minCurrent, maxCurrent]
  );

  const data = { datasets };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    parsing: false,
    animation: false,
    interaction: { mode: "nearest", intersect: false },
    scales: {
      x: {
        type: "logarithmic",
        min: minCurrent,
        max: maxCurrent,
        title: { display: true, text: "Fault current (A)", color: "#94a3b8" },
        ticks: { color: "#94a3b8" },
        grid: { color: "#1e293b" },
      },
      y: {
        type: "logarithmic",
        title: { display: true, text: "Operating time (s)", color: "#94a3b8" },
        ticks: { color: "#94a3b8" },
        grid: { color: "#1e293b" },
      },
    },
    plugins: {
      legend: {
        labels: { color: "#e2e8f0" },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const p = ctx.raw as { x: number; y: number };
            return `${ctx.dataset.label}: ${p.y.toFixed(3)} s @ ${p.x.toFixed(0)} A`;
          },
        },
      },
    },
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h3 className="text-base font-semibold text-foreground">
        Time-current characteristic (TCC)
      </h3>

      <div className="mt-4 h-80">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
