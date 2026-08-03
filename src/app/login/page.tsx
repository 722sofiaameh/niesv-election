"use client";

import { KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthLayout } from "@/components/auth/auth-layout";
import { ButtonLoading } from "@/components/ui/loading-state";
import { FadeIn } from "@/components/ui/fade-in";
import { VOTING_PIN_LENGTH, normalizeVotingPinInput } from "@/lib/voting-pin-ui";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pin.length < VOTING_PIN_LENGTH || loading) return;

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, pin }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Incorrect PIN. Please try again.");
        return;
      }

      router.push("/vote");
    } catch {
      setError("Unable to connect. Please check your internet and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Sign in to vote"
      description="Enter your registered phone number and the 8-character voting PIN sent to you by the election committee."
    >
      <FadeIn variant="up">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <KeyRound className="h-7 w-7" aria-hidden="true" />
            </div>
          </div>

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

          <div>
            <label htmlFor="voting-pin" className="voter-label">
              Voting PIN
            </label>
            <input
              id="voting-pin"
              type="text"
              inputMode="text"
              autoComplete="one-time-code"
              placeholder="ABCD2345"
              value={pin}
              disabled={loading}
              maxLength={VOTING_PIN_LENGTH}
              className="voter-input font-mono uppercase tracking-[0.2em]"
              onChange={(e) => setPin(normalizeVotingPinInput(e.target.value))}
            />
            <p className="mt-2 text-sm text-muted-foreground">
              8 characters, letters and numbers. Check WhatsApp or contact the
              help desk if you don&apos;t have yours.
            </p>
          </div>

          {error && (
            <p role="alert" className="voter-alert-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !phone.trim() || pin.length < VOTING_PIN_LENGTH}
            className="voter-btn-primary w-full"
          >
            {loading ? (
              <ButtonLoading label="Signing you in" />
            ) : (
              "Sign in & vote"
            )}
          </button>
        </form>
      </FadeIn>
    </AuthLayout>
  );
}
