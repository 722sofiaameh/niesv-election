"use client";

import { ArrowLeft, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AuthLayout } from "@/components/auth/auth-layout";
import { OtpInput } from "@/components/auth/otp-input";
import { ButtonLoading } from "@/components/ui/loading-state";
import { FadeIn } from "@/components/ui/fade-in";

type Step = "phone" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"sms" | "voice">("sms");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setInterval(() => {
      setResendSeconds((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendSeconds]);

  const sendOtp = useCallback(async () => {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        if (typeof data.resendWaitSeconds === "number") {
          setResendSeconds(data.resendWaitSeconds);
        }
        return false;
      }

      setMaskedPhone(data.maskedPhone ?? "");
      setDeliveryMethod(data.deliveryMethod === "voice" ? "voice" : "sms");
      setResendSeconds(data.resendWaitSeconds ?? 60);
      setOtp("");
      setStep("otp");
      return true;
    } catch {
      setError("Unable to connect. Please check your internet and try again.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [phone]);

  async function handlePhoneSubmit(event: React.FormEvent) {
    event.preventDefault();
    await sendOtp();
  }

  async function handleOtpSubmit(event?: React.FormEvent) {
    event?.preventDefault();
    if (otp.length < 6 || loading) return;

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Incorrect code. Please try again.");
        if (data.expired) {
          setOtp("");
        }
        return;
      }

      router.push("/vote");
    } catch {
      setError("Unable to connect. Please check your internet and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendSeconds > 0 || loading) return;
    await sendOtp();
  }

  function handleBack() {
    setStep("phone");
    setOtp("");
    setError("");
  }

  if (step === "otp") {
    return (
      <AuthLayout
        title="Enter verification code"
        description={
          deliveryMethod === "voice"
            ? maskedPhone
              ? `SMS could not reach ${maskedPhone}, so we are calling you with your NIESV voting code. Please answer the call.`
              : "We are calling your phone with your NIESV voting code. Please answer the call."
            : maskedPhone
              ? `We sent a 6-digit NIESV voting code to ${maskedPhone}. Check your messages (including spam). The sender name on your phone may show as INDURA.`
              : "Enter the 6-digit NIESV voting code we sent to your phone. The sender name may show as INDURA."
        }
      >
        <FadeIn variant="up">
          <form onSubmit={handleOtpSubmit} className="space-y-8">
            <div className="flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MessageSquare className="h-7 w-7" aria-hidden="true" />
              </div>
            </div>

            <OtpInput
              value={otp}
              onChange={setOtp}
              onComplete={() => void handleOtpSubmit()}
              disabled={loading}
              autoFocus
            />

            {error && (
              <p role="alert" className="voter-alert-error">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="voter-btn-primary w-full"
            >
              {loading ? (
                <ButtonLoading label="Verifying your code" />
              ) : (
                "Verify & continue"
              )}
            </button>

            <div className="space-y-4 text-center">
              <p className="text-base text-muted-foreground">
                Didn&apos;t receive the code?{" "}
                {resendSeconds > 0 ? (
                  <span className="font-medium text-foreground">
                    Resend in {resendSeconds}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading}
                    className="font-semibold text-primary underline-offset-4 hover:underline disabled:opacity-50"
                  >
                    Resend code
                  </button>
                )}
              </p>

              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="inline-flex items-center gap-2 text-base font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Change phone number
              </button>
            </div>
          </form>
        </FadeIn>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Sign in to vote"
      description="Enter the phone number registered with your NIESV membership. We'll send you a voting verification code by text — or by phone call if SMS is blocked."
    >
      <form onSubmit={handlePhoneSubmit} className="space-y-6">
        <div>
          <label htmlFor="phone" className="voter-label">
            Phone number
          </label>
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="08012345678"
            value={phone}
            disabled={loading}
            className="voter-input"
            onChange={(e) => setPhone(e.target.value)}
            autoFocus
          />
        </div>

        {error && (
          <p role="alert" className="voter-alert-error">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !phone.trim()}
          className="voter-btn-primary w-full"
        >
          {loading ? (
            <ButtonLoading label="Sending verification code" />
          ) : (
            "Send verification code"
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
