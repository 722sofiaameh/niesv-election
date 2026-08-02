/**
 * Send an SMS message. Stub for Termii integration — logs in development.
 */
export async function sendSms(phone: string, message: string): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    console.log(`[SMS] To: ${phone}\n[SMS] Message: ${message}`);
    return;
  }

  // TODO: Wire up Termii API
  console.log(`[SMS] To: ${phone}\n[SMS] Message: ${message}`);
}
