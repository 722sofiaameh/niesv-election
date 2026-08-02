/**
 * Send SMS via Termii (Nigeria). Requires TERMII_API_KEY in production.
 */
export async function sendSms(phone: string, message: string): Promise<void> {
  const apiKey = process.env.TERMII_API_KEY;
  const senderId = process.env.TERMII_SENDER_ID ?? "N-Alert";

  if (!apiKey) {
    console.log(`[SMS] To: ${phone}\n[SMS] Message: ${message}`);
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMS provider is not configured (TERMII_API_KEY).");
    }
    return;
  }

  const response = await fetch("https://api.ng.termii.com/api/sms/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      to: phone,
      from: senderId,
      sms: message,
      type: "plain",
      channel: "generic",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("Termii SMS failed:", response.status, body);
    throw new Error("Could not send verification text message.");
  }
}
