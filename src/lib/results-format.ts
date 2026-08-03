export type ResultsCandidate = {
  id: string;
  name: string;
  voteCount: number;
  status: string;
};

export type ResultsPosition = {
  id: string;
  title: string;
  candidates: ResultsCandidate[];
};

export type ResultsWing = {
  id: string;
  name: string;
  slug: string;
  positions: ResultsPosition[];
};

export type ResultsWingOption = {
  id: string;
  name: string;
  slug: string;
};

export function mapResultsWings(
  wings: Array<{
    id: string;
    name: string;
    slug: string;
    positions: Array<{
      id: string;
      title: string;
      candidates: ResultsCandidate[];
    }>;
  }>,
): ResultsWing[] {
  return wings.map((wing) => ({
    id: wing.id,
    name: wing.name,
    slug: wing.slug,
    positions: wing.positions.map((position) => ({
      id: position.id,
      title: position.title,
      candidates: position.candidates,
    })),
  }));
}

export function filterResultsWings(
  wings: ResultsWing[],
  wingFilter?: string | null,
): ResultsWing[] {
  if (!wingFilter?.trim()) {
    return wings;
  }

  const normalized = wingFilter.trim().toLowerCase();
  return wings.filter(
    (wing) =>
      wing.slug === normalized ||
      wing.id === wingFilter ||
      wing.name.toLowerCase() === normalized,
  );
}

export function escapeResultsCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildResultsCsv(wings: ResultsWing[]): string {
  const lines = ["Wing,Position,Candidate,Status,Votes"];

  for (const wing of wings) {
    for (const position of wing.positions) {
      for (const candidate of position.candidates) {
        lines.push(
          [
            escapeResultsCsv(wing.name),
            escapeResultsCsv(position.title),
            escapeResultsCsv(candidate.name),
            candidate.status,
            String(candidate.voteCount),
          ].join(","),
        );
      }
    }
  }

  return lines.join("\n");
}

export function resultsCsvFilename(wingFilter?: string | null): string {
  if (!wingFilter?.trim()) {
    return "election-results.csv";
  }

  const slug = wingFilter.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  return `election-results-${slug}.csv`;
}
