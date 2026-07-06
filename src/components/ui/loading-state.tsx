import type { ReactNode } from "react";

import { Spinner, type SpinnerProps } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  description?: string;
  size?: SpinnerProps["size"];
  variant?: SpinnerProps["variant"];
  className?: string;
  /** Compact row layout for tables and inline use */
  inline?: boolean;
  children?: ReactNode;
}

export function LoadingState({
  message = "Loading",
  description,
  size = "lg",
  variant = "primary",
  className,
  inline = false,
  children,
}: LoadingStateProps) {
  if (inline) {
    return (
      <div
        className={cn("flex items-center justify-center gap-3", className)}
        role="status"
        aria-live="polite"
      >
        <Spinner size="sm" variant={variant} label={message} />
        <span className="text-base text-muted-foreground">{message}</span>
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-16 text-center animate-fade-in motion-reduce:animate-none",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Spinner size={size} variant={variant} label={message} />
      <div className="space-y-1">
        <p className="text-lg font-medium text-foreground">{message}</p>
        {description && (
          <p className="text-base text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

interface ButtonLoadingProps {
  label: string;
  variant?: SpinnerProps["variant"];
}

export function ButtonLoading({
  label,
  variant = "onPrimary",
}: ButtonLoadingProps) {
  return (
    <span className="inline-flex items-center justify-center gap-2.5">
      <Spinner size="sm" variant={variant} label={label} />
      <span>{label}</span>
    </span>
  );
}
