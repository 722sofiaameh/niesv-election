"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthLayout } from "@/components/auth/auth-layout";
import { ButtonLoading } from "@/components/ui/loading-state";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
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
      description="Enter the phone number registered with your NIESV membership."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
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
          {loading ? <ButtonLoading label="Please wait" /> : "Continue"}
        </button>
      </form>
    </AuthLayout>
  );
}
