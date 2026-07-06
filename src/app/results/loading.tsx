import { Spinner } from "@/components/ui/spinner";

export default function ResultsLoading() {
  return (
    <main className="results-theme flex min-h-screen flex-col items-center justify-center gap-4 bg-[hsl(var(--background))] px-8 text-[hsl(var(--foreground))]">
      <Spinner size="xl" variant="accent" label="Loading results" />
      <p className="text-2xl text-[hsl(var(--foreground))]/70 md:text-3xl">
        Loading results
      </p>
    </main>
  );
}
