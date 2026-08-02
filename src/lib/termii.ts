function getBaseUrl(): string {
  const raw = process.env.TERMII_BASE_URL ?? "https://v3.api.termii.com";
  return raw.replace(/\/+$/, "");
}

const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 5;
const OTP_ATTEMPTS = 3;

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

function getChannel(): string {
  return process.env.TERMII_CHANNEL ?? "generic";
}

function buildMessageText(): string {
  return "Your NIESV voting verification code is < 123456 >. Valid for 5 minutes. Do not share this code.";
}

export interface SendOtpResult {
  pinId: string;
  expiresAt: Date;
}

function buildOtpPayload(phone: string) {
  return {
    api_key: getApiKey(),
    message_type: "NUMERIC",
    pin_type: "NUMERIC",
    to: phone,
    from: getSenderId(),
    channel: getChannel(),
    pin_attempts: OTP_ATTEMPTS,
    pin_time_to_live: OTP_TTL_MINUTES,
    pin_length: OTP_LENGTH,
    pin_placeholder: "< 123456 >",
    message_text: buildMessageText(),
  };
}

export async function sendOtp(phone: string): Promise<SendOtpResult> {
  const response = await fetch(`${getBaseUrl()}/api/sms/otp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildOtpPayload(phone)),
  });

  const data = (await response.json()) as {
    pin_id?: string;
    pinId?: string;
    status?: string | number;
    message?: string;
    error?: string;
  };

  const pinId = data.pin_id ?? data.pinId;
  if (!response.ok || !pinId) {
    console.error("Termii send OTP error:", data);
    const message =
      data.message ??
      data.error ??
      "Failed to send verification code.";
    throw new Error(message);
  }

  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  return { pinId, expiresAt };
}

export async function verifyOtp(pinId: string, pin: string): Promise<boolean> {
  const response = await fetch(`${getBaseUrl()}/api/sms/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: getApiKey(),
      pin_id: pinId,
      pin: pin.trim(),
    }),
  });

  const data = (await response.json()) as {
    verified?: string | boolean;
    message?: string;
  };

  if (!response.ok) {
    console.error("Termii verify OTP error:", data);
    return false;
  }

  const verified = data.verified;
  return verified === true || verified === "True" || verified === "true";
}

export { OTP_LENGTH, OTP_TTL_MINUTES };
