/**
 * Normalizes a Nigerian phone number to digits-only international format (234…).
 * Handles 080…, +234…, 234…, and strips spaces/dashes/parentheses.
 */
export function normalizePhoneNumber(input: string): string | null {
  const digits = input.replace(/[\s\-().]/g, "").replace(/^\+/, "");

  if (!/^\d+$/.test(digits)) {
    return null;
  }

  let normalized: string;

  if (digits.startsWith("0") && digits.length === 11) {
    normalized = `234${digits.slice(1)}`;
  } else if (digits.startsWith("234") && digits.length === 13) {
    normalized = digits;
  } else if (digits.length === 10 && !digits.startsWith("0")) {
    normalized = `234${digits}`;
  } else {
    return null;
  }

  return normalized;
}

/** Masks a normalized phone for display, e.g. 2348012345678 → +234 *** *** 5678 */
export function maskPhoneNumber(normalized: string): string {
  if (normalized.length < 7) return "***";
  const local = normalized.startsWith("234")
    ? normalized.slice(3)
    : normalized;
  const lastFour = local.slice(-4);
  return `+234 *** *** ${lastFour}`;
}
