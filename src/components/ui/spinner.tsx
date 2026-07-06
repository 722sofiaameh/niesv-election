import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const spinnerVariants = cva(
  "animate-spin rounded-full border-[3px] border-solid",
  {
    variants: {
      size: {
        xs: "h-3.5 w-3.5 border-2",
        sm: "h-5 w-5 border-2",
        md: "h-8 w-8",
        lg: "h-12 w-12 border-4",
        xl: "h-16 w-16 border-4",
      },
      variant: {
        primary: "border-primary/15 border-t-primary",
        accent: "border-accent/20 border-t-accent",
        muted: "border-muted border-t-muted-foreground",
        light: "border-white/20 border-t-white",
        onPrimary: "border-primary-foreground/25 border-t-primary-foreground",
        onAccent: "border-accent-foreground/25 border-t-accent-foreground",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "primary",
    },
  },
);

export interface SpinnerProps extends VariantProps<typeof spinnerVariants> {
  className?: string;
  label?: string;
}

export function Spinner({ size, variant, className, label = "Loading" }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn(spinnerVariants({ size, variant }), className)}
    />
  );
}
