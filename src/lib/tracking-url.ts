export function buildCampaignTrackingUrl(
  origin: string,
  trackingToken: string,
): string {
  return `${origin.replace(/\/$/, "")}/track/${trackingToken}`;
}
