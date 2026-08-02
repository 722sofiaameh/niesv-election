import { createHash, randomInt, timingSafeEqual } from "node:crypto";

const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 5;

function hashOtp(code: string): string {
  const secret = process.env.SESSION_SECRET ?? "dev-otp-secret";
  return createHash("sha256").update(`${secret}:${code}`).digest("hex");
}

export function generateDevOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(OTP_LENGTH, "0");
}

export function hashDevOtp(code: string): string {
  return `dev:${hashOtp(code)}`;
}

export function verifyDevOtp(stored: string, code: string): boolean {
  if (!stored.startsWith("dev:")) return false;
  const expected = stored.slice(4);
  const actual = hashOtp(code);
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
  } catch {
    return false;
  }
}

export function isDevOtp(stored: string | null | undefined): boolean {
  return stored?.startsWith("dev:") ?? false;
}

export { OTP_LENGTH, OTP_TTL_MINUTES };
