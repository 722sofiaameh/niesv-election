export type CandidateStatus = "FELLOW" | "MEMBER";

export type VotingCandidate = {
  id: string;
  name: string;
  photoUrl: string | null;
  bio: string | null;
  status: CandidateStatus;
};

export type VotingPosition = {
  id: string;
  title: string;
  wingName: string;
  candidates: VotingCandidate[];
};

/** null means the voter abstained from this position */
export type VoteChoice = {
  candidateId: string;
  candidateName: string;
} | null;

export type VoteChoices = Record<string, VoteChoice>;

export function formatCandidateStatus(status: CandidateStatus): string {
  return status === "FELLOW" ? "Fellow" : "Member";
}

export function getInitials(name: string): string {
  return name
    .replace(/^Esv\.\s*/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
