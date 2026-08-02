"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";

import { cn } from "@/lib/utils";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: () => void;
  disabled?: boolean;
  autoFocus?: boolean;
  id?: string;
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  autoFocus = false,
  id = "otp-input",
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(length, " ").slice(0, length).split("");

  const focusAt = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, length - 1));
    inputRefs.current[clamped]?.focus();
    inputRefs.current[clamped]?.select();
  }, [length]);

  useEffect(() => {
    if (autoFocus) {
      focusAt(0);
    }
  }, [autoFocus, focusAt]);

  function updateDigit(index: number, digit: string) {
    const next = digits.map((d, i) => (i === index ? digit : d.trim())).join("");
    onChange(next.replace(/\s/g, "").slice(0, length));
  }

  function handleChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const nextValue = digits
      .map((d, i) => (i === index ? digit : d.trim()))
      .join("")
      .replace(/\s/g, "")
      .slice(0, length);
    onChange(nextValue);
    if (digit && index < length - 1) {
      focusAt(index + 1);
    }
    if (nextValue.length === length) {
      onComplete?.();
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      event.preventDefault();
      if (digits[index]?.trim()) {
        updateDigit(index, "");
      } else if (index > 0) {
        updateDigit(index - 1, "");
        focusAt(index - 1);
      }
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusAt(index - 1);
      return;
    }

    if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      focusAt(index + 1);
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    if (pasted) {
      onChange(pasted);
      focusAt(Math.min(pasted.length, length - 1));
      if (pasted.length === length) {
        onComplete?.();
      }
    }
  }

  return (
    <div
      className="mx-auto grid w-full max-w-xs grid-cols-6 gap-1.5 sm:max-w-sm sm:gap-2.5"
      role="group"
      aria-label="Verification code"
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          id={index === 0 ? id : undefined}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit.trim()}
          disabled={disabled}
          aria-label={`Digit ${index + 1} of ${length}`}
          className={cn(
            "aspect-square w-full min-w-0 rounded-lg border-2 border-input bg-card p-0 text-center text-lg font-bold tabular-nums shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:opacity-50 sm:rounded-xl sm:text-2xl sm:focus:ring-4",
            digit.trim() && "border-primary bg-primary/5",
          )}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}
