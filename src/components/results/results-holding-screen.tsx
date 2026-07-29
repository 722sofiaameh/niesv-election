import { ResultsBrandHeader } from "@/components/results/results-brand-header";

export function ResultsHoldingScreen() {
  return (
    <main className="results-theme flex min-h-screen flex-col items-center justify-center bg-[hsl(var(--background))] px-8 text-[hsl(var(--foreground))]">
      <div className="h-1.5 w-full max-w-4xl animate-pulse-soft bg-[hsl(var(--gold))] shadow-lg motion-reduce:animate-none" />
      <div className="max-w-4xl animate-fade-in-up px-4 pt-12 text-center motion-reduce:animate-none">
        <ResultsBrandHeader centered />
        <h1 className="mt-12 text-4xl font-bold leading-tight md:text-6xl">
          Results will be published once voting closes
        </h1>
        <p className="mt-8 text-2xl text-[hsl(var(--foreground))]/60 md:text-3xl">
          Please check back shortly.
        </p>
      </div>
    </main>
  );
}
