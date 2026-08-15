"use client";

import { useMemo, useState } from "react";
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
import { Lock } from "lucide-react";

ChartJS.register(LineElement, PointElement, LogarithmicScale, Tooltip, Legend);

export default function TccChart({
  relay1,
  relay2,
  minCurrent,
  maxCurrent,
}: {
  relay1: RelaySettings;
  relay2: RelaySettings;
  minCurrent: number;
  maxCurrent: number;
}) {
  const [showLockedMessage, setShowLockedMessage] = useState(false);

  const relay1Points = useMemo(
    () => curvePoints(relay1, minCurrent, maxCurrent),
    [relay1, minCurrent, maxCurrent]
  );

  const data = {
    datasets: [
      {
        label: relay1.label,
        data: relay1Points,
        borderColor: "#fbbf24",
        backgroundColor: "#fbbf24",
        borderWidth: 2,
        pointRadius: 0,
        tension: 0,
      },
    ],
  };

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
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">
          Time-current characteristic (TCC)
        </h3>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted">
            <span className="h-2 w-2 rounded-full bg-accent" /> {relay1.label}
          </span>
          <button
            type="button"
            onClick={() => setShowLockedMessage(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted transition-colors hover:border-accent-2/50 hover:text-accent-2"
          >
            <Lock className="h-3 w-3" />
            Add {relay2.label} to graph
          </button>
        </div>
      </div>

      <div className="mt-4 h-80">
        <Line data={data} options={options} />
      </div>

      {showLockedMessage && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-accent/30 bg-accent/10 p-4">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <div className="flex-1 text-sm">
            <p className="font-medium text-foreground">
              Overlaying a second relay on the graph is a subscriber feature.
            </p>
            <p className="mt-1 text-muted">
              It&apos;s planned for a future release once subscriptions launch.
              The numeric coordination check above already compares both
              relays across the full range — the graph overlay just adds the
              visual.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowLockedMessage(false)}
            className="text-muted hover:text-foreground"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
