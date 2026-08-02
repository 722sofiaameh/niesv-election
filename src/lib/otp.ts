import { randomInt } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/sms";

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

export function generateOtpCode(): string {
  return String(randomInt(100_000, 1_000_000));
}

export async function sendLoginOtp(voterId: string, phoneNumber: string) {
  const voter = await prisma.voter.findUnique({
    where: { id: voterId },
    select: { otpExpiresAt: true, otpCode: true },
  });

  if (
    voter?.otpCode &&
    voter.otpExpiresAt &&
    voter.otpExpiresAt.getTime() > Date.now()
  ) {
    const sentAt = voter.otpExpiresAt.getTime() - OTP_TTL_MS;
    if (Date.now() - sentAt < OTP_RESEND_COOLDOWN_MS) {
      return { sent: true, cooldown: true };
    }
  }

  const code = generateOtpCode();
  const otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.voter.update({
    where: { id: voterId },
    data: { otpCode: code, otpExpiresAt },
  });

  await sendSms(
    phoneNumber,
    `Your NIESV Abuja Branch election code is ${code}. It expires in 10 minutes. Do not share this code.`,
  );

  return { sent: true, cooldown: false };
}

export async function verifyLoginOtp(
  voterId: string,
  code: string,
): Promise<boolean> {
  const voter = await prisma.voter.findUnique({
    where: { id: voterId },
    select: { otpCode: true, otpExpiresAt: true },
  });

  if (!voter?.otpCode || !voter.otpExpiresAt) {
    return false;
  }

  if (voter.otpExpiresAt.getTime() < Date.now()) {
    return false;
  }

  if (voter.otpCode !== code.trim()) {
    return false;
  }

  await prisma.voter.update({
    where: { id: voterId },
    data: { otpCode: null, otpExpiresAt: null },
  });

  return true;
}
