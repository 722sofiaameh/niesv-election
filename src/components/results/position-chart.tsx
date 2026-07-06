"use client";

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import type { ResultsCandidate } from "@/lib/results-data";

interface PositionChartProps {
  candidates: ResultsCandidate[];
}

function truncateName(name: string, max = 36): string {
  return name.length > max ? `${name.slice(0, max)}…` : name;
}

const GOLD = "hsl(38, 88%, 52%)";
const BAR_DEFAULT = "hsl(218, 30%, 32%)";

export function PositionChart({ candidates }: PositionChartProps) {
  if (candidates.length === 0) {
    return (
      <p className="text-xl text-[hsl(var(--foreground))]/50">
        No candidates for this position.
      </p>
    );
  }

  const maxVotes = Math.max(...candidates.map((c) => c.voteCount), 1);
  const chartData = candidates.map((candidate, index) => ({
    ...candidate,
    displayName: truncateName(candidate.name),
    isLeader: index === 0 && candidate.voteCount > 0,
  }));

  const chartHeight = Math.max(candidates.length * 80, 140);

  return (
    <div style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 80, bottom: 4, left: 8 }}
        >
          <XAxis type="number" domain={[0, maxVotes]} hide />
          <YAxis
            type="category"
            dataKey="displayName"
            width={220}
            tick={({ x, y, payload, index }) => {
              const entry = chartData[index ?? 0];
              const isLeader = entry?.isLeader;
              return (
                <text
                  x={x}
                  y={y}
                  dy={4}
                  textAnchor="end"
                  fill={isLeader ? GOLD : "hsl(45, 30%, 90%)"}
                  fontSize={20}
                  fontWeight={isLeader ? 700 : 500}
                >
                  {payload?.value}
                </text>
              );
            }}
            axisLine={false}
            tickLine={false}
          />
          <Bar
            dataKey="voteCount"
            radius={[0, 8, 8, 0]}
            animationDuration={900}
            animationEasing="ease-out"
            isAnimationActive
            barSize={36}
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.id}
                fill={entry.isLeader ? GOLD : BAR_DEFAULT}
                stroke={entry.isLeader ? GOLD : "none"}
                strokeWidth={entry.isLeader ? 2 : 0}
              />
            ))}
            <LabelList
              dataKey="voteCount"
              position="right"
              fill="hsl(45, 30%, 97%)"
              fontSize={24}
              fontWeight={700}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
