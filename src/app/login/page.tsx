"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthLayout } from "@/components/auth/auth-layout";
import { ButtonLoading } from "@/components/ui/loading-state";

type LoginStep = "phone" | "code";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSendCode(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setStep("code");
      setInfo(
        data.message ??
          "We sent a verification code to your phone by text message.",
      );
    } catch {
      setError("Unable to connect. Please check your internet and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
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
    setError("");
    setInfo("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Could not resend code.");
        return;
      }

      setInfo(data.message ?? "A new code was sent.");
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "code") {
    return (
      <AuthLayout
        title="Enter verification code"
        description="We sent a 6-digit code to your phone by SMS. Only the person with that phone can receive it."
      >
        <form onSubmit={handleVerifyCode} className="space-y-6">
          {info && (
            <p className="rounded-xl border border-border bg-secondary/40 px-4 py-3 text-base text-foreground">
              {info}
            </p>
          )}

          <div>
            <label htmlFor="code" className="voter-label">
              Verification code
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              maxLength={6}
              value={code}
              disabled={loading}
              className="voter-input text-center text-2xl tracking-[0.3em]"
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
          </div>

          {error && (
            <p role="alert" className="voter-alert-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="voter-btn-primary w-full"
          >
            {loading ? (
              <ButtonLoading label="Verifying — please wait" />
            ) : (
              "Continue to ballot"
            )}
          </button>

          <div className="flex flex-col gap-2 text-center text-base">
            <button
              type="button"
              disabled={loading}
              onClick={handleResend}
              className="font-semibold text-primary underline-offset-2 hover:underline disabled:opacity-50"
            >
              Send a new code
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setStep("phone");
                setCode("");
                setError("");
                setInfo("");
              }}
              className="text-muted-foreground underline-offset-2 hover:underline disabled:opacity-50"
            >
              Use a different phone number
            </button>
          </div>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Sign in to vote"
      description="Enter your registered phone number. We will text you a one-time code — only the person holding that phone can vote."
    >
      <form onSubmit={handleSendCode} className="space-y-6">
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
            <ButtonLoading label="Sending code — please wait" />
          ) : (
            "Send verification code"
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
