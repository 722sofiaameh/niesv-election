import {
  generateDevOtp,
  hashDevOtp,
  OTP_LENGTH,
  OTP_TTL_MINUTES,
  verifyDevOtp,
} from "@/lib/otp-dev";
import {
  OtpDeliveryMethod,
  sendOtpNotification,
  SmsDeliveryError,
} from "@/lib/sms";
import * as termii from "@/lib/termii";

export { OTP_LENGTH, OTP_TTL_MINUTES };
export type { OtpDeliveryMethod };

export interface SendOtpResult {
  pinId: string;
  expiresAt: Date;
  deliveryMethod?: OtpDeliveryMethod;
}

function isConsoleOtpMode(): boolean {
  return process.env.TERMII_DEV_MODE === "true";
}

/** local = we generate the code and send plain SMS; termii = Termii OTP API */
function getOtpMode(): "local" | "termii" {
  const mode = process.env.TERMII_OTP_MODE ?? "local";
  return mode === "termii" ? "termii" : "local";
}

async function sendLocalOtp(phone: string): Promise<SendOtpResult> {
  const code = generateDevOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  if (isConsoleOtpMode()) {
    console.log(`[OTP DEV] To: ${phone}  Code: ${code}`);
    return { pinId: hashDevOtp(code), expiresAt, deliveryMethod: "sms" };
  }

  const { method } = await sendOtpNotification(phone, code);
  return { pinId: hashDevOtp(code), expiresAt, deliveryMethod: method };
}

export async function sendOtp(phone: string): Promise<SendOtpResult> {
  if (isConsoleOtpMode()) {
    const code = generateDevOtp();
    console.log(`[OTP DEV] To: ${phone}  Code: ${code}`);
    return {
      pinId: hashDevOtp(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
    };
  }

  if (getOtpMode() === "local") {
    return sendLocalOtp(phone);
  }

  return termii.sendOtp(phone);
}

export async function verifyOtp(pinId: string, pin: string): Promise<boolean> {
  if (pinId.startsWith("dev:")) {
    return verifyDevOtp(pinId, pin);
  }

  return termii.verifyOtp(pinId, pin);
}

export function getSmsDeliveryError(error: unknown): string | null {
  if (error instanceof SmsDeliveryError) {
    return "sms_delivery_failed";
  }
  return null;
}

export function getTermiiConfigError(error: unknown): string | null {
  if (!(error instanceof Error)) return null;

  const message = error.message.toLowerCase();
  const cause = (error as { cause?: { code?: string } }).cause;

  if (message.includes("invalid api key") || message.includes("api key is required")) {
    return "termii_invalid_key";
  }
  if (message.includes("termii_api_key")) {
    return "termii_missing_key";
  }
  if (
    message.includes("fetch failed") ||
    cause?.code === "UND_ERR_CONNECT_TIMEOUT" ||
    message.includes("connect timeout")
  ) {
    return "termii_network";
  }
  return null;
}
