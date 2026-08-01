"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface CampaignTrackingChartProps {
  candidateVotes: number;
  positionTotalVotes: number;
}

const COLORS = {
  candidate: "hsl(var(--primary))",
  other: "hsl(var(--muted-foreground) / 0.35)",
};

export function CampaignTrackingChart({
  candidateVotes,
  positionTotalVotes,
}: CampaignTrackingChartProps) {
  const otherVotes = Math.max(0, positionTotalVotes - candidateVotes);
  const share =
    positionTotalVotes > 0
      ? Math.round((candidateVotes / positionTotalVotes) * 100)
      : 0;

  const chartData = [
    { name: "Your candidate", value: candidateVotes },
    { name: "Other candidates", value: otherVotes },
  ].filter((entry) => entry.value > 0);

  if (positionTotalVotes === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        No votes have been cast for this position yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mx-auto h-52 w-full max-w-xs">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={80}
              paddingAngle={chartData.length > 1 ? 2 : 0}
              animationDuration={600}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={
                    entry.name === "Your candidate"
                      ? COLORS.candidate
                      : COLORS.other
                  }
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [
                `${Number(value ?? 0)} votes`,
                String(name),
              ]}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                fontSize: "14px",
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value: string) => (
                <span className="text-sm text-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Your candidate has {share}% of votes cast for this position (
        {candidateVotes} of {positionTotalVotes}).
      </p>
    </div>
  );
}
