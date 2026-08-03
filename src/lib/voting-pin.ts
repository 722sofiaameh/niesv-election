import { createHash, randomInt, timingSafeEqual } from "node:crypto";

import { VOTING_PIN_LENGTH } from "@/lib/voting-pin-ui";

export { VOTING_PIN_LENGTH, normalizeVotingPinInput } from "@/lib/voting-pin-ui";

/** Avoid ambiguous characters (0/O, 1/I/L). */
const PIN_CHARSET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function hashPin(pin: string): string {
  const secret = process.env.SESSION_SECRET ?? "dev-voting-pin-secret";
  return createHash("sha256")
    .update(`${secret}:voting-pin:${pin.toUpperCase()}`)
    .digest("hex");
}

export function generateVotingPin(): string {
  let pin = "";
  for (let i = 0; i < VOTING_PIN_LENGTH; i++) {
    pin += PIN_CHARSET[randomInt(0, PIN_CHARSET.length)];
  }
  return pin;
}

export function hashVotingPin(pin: string): string {
  return hashPin(pin.trim());
}

export function verifyVotingPin(storedHash: string, pin: string): boolean {
  const normalized = pin.trim().toUpperCase();
  if (!/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/.test(normalized)) {
    return false;
  }

  const expected = hashPin(normalized);
  try {
    return timingSafeEqual(Buffer.from(storedHash), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function isValidVotingPinFormat(pin: string): boolean {
  const normalized = pin.trim().toUpperCase();
  return /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/.test(normalized);
}