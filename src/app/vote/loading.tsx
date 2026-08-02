import { Spinner } from "@/components/ui/spinner";
import { VoterShell } from "@/components/voter/voter-shell";

export default function VoteLoading() {
  return (
    <VoterShell centered>
      <div className="voter-card w-full max-w-lg text-center">
        <Spinner className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-8 text-2xl font-bold text-foreground sm:text-3xl">
          Loading your ballot
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Please wait — this can take a moment on slower connections.
        </p>
        <p className="mt-3 text-base text-muted-foreground">
          Do not refresh or close this page.
        </p>
      </div>
    </VoterShell>
  );
}
