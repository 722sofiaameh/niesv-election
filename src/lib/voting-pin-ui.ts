export const VOTING_PIN_LENGTH = 8;

export function normalizeVotingPinInput(pin: string): string {
  return pin
    .trim()
    .toUpperCase()
    .replace(/[^23456789A-Z]/g, "")
    .slice(0, VOTING_PIN_LENGTH);
}
