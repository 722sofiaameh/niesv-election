interface VotingProgressProps {
  value: number;
}

export function VotingProgress({ value }: VotingProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div
      className="mb-6 h-1.5 overflow-hidden rounded-full bg-muted"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Voting progress"
    >
      <div
        className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
