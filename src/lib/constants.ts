export const SESSION_COOKIE_NAME = "voter_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24; // 24 hours

export function getSupportContact(): string {
  return process.env.SUPPORT_CONTACT ?? "the election committee";
}
