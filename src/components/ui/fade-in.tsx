import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type FadeInVariant = "fade" | "up" | "scale";

interface FadeInProps {
  children: ReactNode;
  className?: string;
  variant?: FadeInVariant;
  delay?: 0 | 75 | 100 | 150 | 200 | 300;
}

const variantClass: Record<FadeInVariant, string> = {
  fade: "animate-fade-in",
  up: "animate-fade-in-up",
  scale: "animate-scale-in",
};

const delayClass: Record<NonNullable<FadeInProps["delay"]>, string> = {
  0: "",
  75: "animation-delay-75",
  100: "animation-delay-100",
  150: "animation-delay-150",
  200: "animation-delay-200",
  300: "animation-delay-300",
};

export function FadeIn({
  children,
  className,
  variant = "up",
  delay = 0,
}: FadeInProps) {
  return (
    <div
      className={cn(
        variantClass[variant],
        delay > 0 && delayClass[delay],
        "motion-reduce:animate-none motion-reduce:opacity-100",
        className,
      )}
    >
      {children}
    </div>
  );
}
