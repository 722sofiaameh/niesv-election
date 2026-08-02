type SmsChannel = "generic" | "voice";

interface TermiiSendResponse {
  code?: string;
  message?: string;
  message_id?: string | number;
  message_id_str?: string;
}

interface InboxMessage {
  message_id?: string | number;
  status?: string;
  sms_type?: string;
  receiver?: string;
}

export type OtpDeliveryMethod = "sms" | "voice";

export interface SendOtpNotificationResult {
  method: OtpDeliveryMethod;
}

export class SmsDeliveryError extends Error {
  constructor(
    message: string,
    readonly deliveryStatus?: string,
  ) {
    super(message);
    this.name = "SmsDeliveryError";
  }
}

function getBaseUrl(): string {
  return (process.env.TERMII_BASE_URL ?? "https://v3.api.termii.com").replace(
    /\/+$/,
    "",
  );
}

function getApiKey(): string {
  const key = process.env.TERMII_API_KEY;
  if (!key) {
    throw new Error("TERMII_API_KEY environment variable is not set");
  }
  return key;
}

function getSenderId(): string {
  return process.env.TERMII_SENDER_ID ?? "INDURA";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeMessageId(value: string | number | undefined): string | null {
  if (value === undefined || value === null) return null;
  return String(value);
}

async function sendOnChannel(
  phone: string,
  message: string,
  channel: SmsChannel,
): Promise<string> {
  const response = await fetch(`${getBaseUrl()}/api/sms/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: getApiKey(),
      to: phone,
      from: getSenderId(),
      sms: message,
      type: "plain",
      channel,
    }),
  });

  const data = (await response.json().catch(() => ({}))) as TermiiSendResponse;

  if (!response.ok) {
    console.error(`[SMS] Termii ${channel} error:`, data);
    throw new Error(data.message ?? "Failed to send SMS.");
  }

  const messageId =
    normalizeMessageId(data.message_id_str) ??
    normalizeMessageId(data.message_id);

  if (!messageId) {
    console.error(`[SMS] Termii ${channel} missing message_id:`, data);
    throw new Error("Failed to send SMS.");
  }

  console.log(`[SMS] Sent via ${channel}`, { phone, messageId });
  return messageId;
}

async function fetchInboxMessage(
  messageId: string,
): Promise<InboxMessage | null> {
  const response = await fetch(
    `${getBaseUrl()}/api/sms/inbox?api_key=${encodeURIComponent(getApiKey())}`,
  );

  if (!response.ok) {
    return null;
  }

  const items = (await response.json().catch(() => [])) as InboxMessage[];
  if (!Array.isArray(items)) return null;

  return (
    items.find((item) => normalizeMessageId(item.message_id) === messageId) ??
    null
  );
}

async function pollDeliveryStatus(
  messageId: string,
  maxWaitMs = 8000,
): Promise<string | null> {
  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    const item = await fetchInboxMessage(messageId);
    const status = item?.status;

    if (
      status === "Delivered" ||
      status === "Rejected" ||
      status === "Failed"
    ) {
      return status;
    }

    await sleep(1500);
  }

  return (await fetchInboxMessage(messageId))?.status ?? null;
}

/** NIESV-branded body; sender ID (from) stays INDURA until NIESV is approved. */
export function buildOtpSmsMessage(code: string): string {
  return `Your NIESV voting verification code is ${code}. Valid for 5 minutes. Do not share this code.`;
}

/** Voice reads digits more clearly when spaced. */
export function buildOtpVoiceMessage(code: string): string {
  const spaced = code.split("").join(" ");
  return `Your NIESV voting verification code is ${spaced}. Valid for 5 minutes. Do not share this code.`;
}

/**
 * Send OTP via the borrowed INDURA Termii account.
 * Uses generic SMS first; falls back to a voice call when SMS is blocked (DND).
 */
export async function sendOtpNotification(
  phone: string,
  code: string,
): Promise<SendOtpNotificationResult> {
  const smsMessage = buildOtpSmsMessage(code);
  const smsMessageId = await sendOnChannel(phone, smsMessage, "generic");
  const smsStatus = await pollDeliveryStatus(smsMessageId);

  if (smsStatus === "Delivered") {
    console.log("[SMS] Delivered via generic", { phone, smsMessageId });
    return { method: "sms" };
  }

  if (smsStatus !== "Rejected" && smsStatus !== "Failed") {
    // Still in transit — generic usually delivers for non-DND numbers.
    console.log("[SMS] Generic route pending", { phone, smsMessageId, smsStatus });
    return { method: "sms" };
  }

  console.log("[SMS] Generic blocked, falling back to voice call", {
    phone,
    smsMessageId,
    smsStatus,
  });

  const voiceMessage = buildOtpVoiceMessage(code);
  await sendOnChannel(phone, voiceMessage, "voice");
  return { method: "voice" };
}

/** @deprecated Use sendOtpNotification for OTP delivery. */
export async function sendSms(phone: string, message: string): Promise<void> {
  await sendOnChannel(phone, message, "generic");
}
