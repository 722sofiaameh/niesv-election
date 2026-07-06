import { Skeleton } from "@/components/ui/skeleton";
import { VoterShell } from "@/components/voter/voter-shell";

export default function VoteLoading() {
  return (
    <VoterShell>
      <div className="voter-card animate-fade-in space-y-6 motion-reduce:animate-none">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-10 w-2/3" />
        <div className="space-y-4 pt-2">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      </div>
    </VoterShell>
  );
}
