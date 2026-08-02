"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import type { ResultsCandidate } from "@/lib/results-data";

interface PositionPieChartProps {
  candidates: ResultsCandidate[];
  variant?: "admin" | "public";
}

const PUBLIC_COLORS = [
  "hsl(38, 88%, 52%)",
  "hsl(218, 30%, 38%)",
  "hsl(218, 30%, 48%)",
  "hsl(45, 30%, 72%)",
  "hsl(38, 65%, 42%)",
  "hsl(218, 22%, 58%)",
  "hsl(38, 50%, 60%)",
  "hsl(218, 30%, 28%)",
];

const ADMIN_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(218 30% 45%)",
  "hsl(38 70% 50%)",
  "hsl(218 20% 55%)",
  "hsl(38 55% 58%)",
  "hsl(218 25% 65%)",
  "hsl(38 45% 45%)",
];

function truncateName(name: string, max = 28): string {
  return name.length > max ? `${name.slice(0, max)}…` : name;
}

export function PositionPieChart({
  candidates,
  variant = "admin",
}: PositionPieChartProps) {
  const palette = variant === "public" ? PUBLIC_COLORS : ADMIN_COLORS;
  const sorted = [...candidates].sort((a, b) => b.voteCount - a.voteCount);
  const chartData = sorted
    .filter((candidate) => candidate.voteCount > 0)
    .map((candidate, index) => ({
      id: candidate.id,
      name: truncateName(candidate.name),
      fullName: candidate.name,
      value: candidate.voteCount,
      color: palette[index % palette.length],
    }));

  const total = sorted.reduce((sum, candidate) => sum + candidate.voteCount, 0);

  if (candidates.length === 0) {
    return (
      <p
        className={
          variant === "public"
            ? "text-xl text-[hsl(var(--foreground))]/50"
            : "text-base text-muted-foreground"
        }
      >
        No candidates for this position.
      </p>
    );
  }

  if (total === 0) {
    return (
      <p
        className={
          variant === "public"
            ? "text-xl text-[hsl(var(--foreground))]/50"
            : "text-base text-muted-foreground"
        }
      >
        No votes cast yet for this position.
      </p>
    );
  }

  const legendFill =
    variant === "public"
      ? "hsl(45, 30%, 90%)"
      : "hsl(var(--foreground))";

  const tooltipStyle =
    variant === "public"
      ? {
          borderRadius: "8px",
          border: "1px solid hsl(218, 30%, 32%)",
          background: "hsl(218, 35%, 14%)",
          color: "hsl(45, 30%, 97%)",
          fontSize: "14px",
        }
      : {
          borderRadius: "8px",
          border: "1px solid hsl(var(--border))",
          fontSize: "14px",
        };

  return (
    <div
      className={
        variant === "public"
          ? "mx-auto w-full max-w-md"
          : "mx-auto w-full max-w-sm"
      }
    >
      <div className={variant === "public" ? "h-72" : "h-64"}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={variant === "public" ? 56 : 48}
              outerRadius={variant === "public" ? 88 : 76}
              paddingAngle={chartData.length > 1 ? 2 : 0}
              animationDuration={700}
            >
              {chartData.map((entry) => (
                <Cell key={entry.id} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, _name, item) => {
                const payload = item.payload as { fullName: string; value: number };
                const share = Math.round((payload.value / total) * 100);
                return [`${payload.value} votes (${share}%)`, payload.fullName];
              }}
              contentStyle={tooltipStyle}
            />
            <Legend
              verticalAlign="bottom"
              height={chartData.length > 4 ? 72 : 48}
              formatter={(value: string) => (
                <span style={{ color: legendFill, fontSize: 13 }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <p
        className={
          variant === "public"
            ? "mt-2 text-center text-lg text-[hsl(var(--foreground))]/60"
            : "mt-2 text-center text-sm text-muted-foreground"
        }
      >
        {total} vote{total === 1 ? "" : "s"} total
      </p>
    </div>
  );
}
