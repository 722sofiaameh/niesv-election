export type CandidateStatus = "FELLOW" | "MEMBER";

export type VotingCandidate = {
  id: string;
  name: string;
  photoUrl: string | null;
  bio?: string | null;
  status: CandidateStatus;
};

export type VotingPosition = {
  id: string;
  title: string;
  wingName: string;
  maxSelections: number;
  candidates: VotingCandidate[];
};

export type CompletedBallotEntry = {
  positionId: string;
  title: string;
  wingName: string;
  maxSelections: number;
  selectedCandidates: VotingCandidate[];
};

/** Single-choice: one candidate or skip (null) */
export type SingleVoteChoice = {
  candidateId: string;
  candidateName: string;
} | null;

/** Multi-choice: exactly maxSelections candidates */
export type MultiVoteChoice = {
  candidateIds: string[];
  candidateNames: string[];
};

export type VoteChoice = SingleVoteChoice | MultiVoteChoice | undefined;

export type VoteChoices = Record<string, VoteChoice>;

export function isMultiSelectPosition(position: VotingPosition): boolean {
  return position.maxSelections > 1;
}

export function isMultiVoteChoice(
  choice: VoteChoice,
): choice is MultiVoteChoice {
  return (
    choice !== undefined &&
    choice !== null &&
    "candidateIds" in choice &&
    Array.isArray(choice.candidateIds)
  );
}

export function isPositionChoiceComplete(
  position: VotingPosition,
  choice: VoteChoice,
): boolean {
  if (choice === undefined) return false;
  if (isMultiSelectPosition(position)) {
    return isMultiVoteChoice(choice) && choice.candidateIds.length === position.maxSelections;
  }
  return choice !== undefined;
}

export function formatCandidateStatus(status: CandidateStatus): string {
  return status;
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

export type SubmitPositionChoice = {
  positionId: string;
  candidateIds: string[];
};

export function buildSubmitPayload(
  positions: VotingPosition[],
  choices: VoteChoices,
): SubmitPositionChoice[] {
  return positions.map((position) => {
    const choice = choices[position.id];

    if (isMultiSelectPosition(position)) {
      if (isMultiVoteChoice(choice)) {
        return { positionId: position.id, candidateIds: choice.candidateIds };
      }
      return { positionId: position.id, candidateIds: [] };
    }

    if (choice && !isMultiVoteChoice(choice) && choice !== null) {
      return { positionId: position.id, candidateIds: [choice.candidateId] };
    }

    return { positionId: position.id, candidateIds: [] };
  });
}
