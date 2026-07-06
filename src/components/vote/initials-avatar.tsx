import { getInitials } from "@/lib/voting";
import { cn } from "@/lib/utils";

interface InitialsAvatarProps {
  name: string;
  className?: string;
}

export function InitialsAvatar({ name, className }: InitialsAvatarProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border-2 border-primary/20 bg-primary text-xl font-bold text-primary-foreground shadow-sm",
        className,
      )}
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  );
}
