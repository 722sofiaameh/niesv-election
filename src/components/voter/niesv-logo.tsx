import Image from "next/image";

import { cn } from "@/lib/utils";

interface NiesvLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  priority?: boolean;
}

const sizeClasses = {
  sm: "h-12 w-12 sm:h-14 sm:w-14",
  md: "h-16 w-16 sm:h-20 sm:w-20",
  lg: "h-24 w-24 sm:h-28 sm:w-28",
};

export function NiesvLogo({
  size = "sm",
  className,
  priority = false,
}: NiesvLogoProps) {
  return (
    <div
      className={cn("shrink-0 rounded-lg bg-white p-1.5 shadow-sm", className)}
    >
      <Image
        src="/niesv-logo.png"
        alt="NIESV Abuja Branch crest"
        width={112}
        height={112}
        className={cn("object-contain", sizeClasses[size])}
        priority={priority}
      />
    </div>
  );
}
