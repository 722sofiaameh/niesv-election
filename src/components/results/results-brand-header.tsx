import { NiesvLogo } from "@/components/voter/niesv-logo";

interface ResultsBrandHeaderProps {
  title?: string;
  centered?: boolean;
  children?: React.ReactNode;
}

export function ResultsBrandHeader({
  title,
  centered = false,
  children,
}: ResultsBrandHeaderProps) {
  return (
    <header className={centered ? "text-center" : "border-b-2 border-[hsl(var(--navy-border))] pb-8"}>
      <div className={centered ? "mb-8 flex justify-center" : "mb-6"}>
        <NiesvLogo size={centered ? "lg" : "md"} priority />
      </div>
      <p className="text-xl font-semibold uppercase tracking-[0.25em] text-[hsl(var(--gold))] md:text-2xl">
        Nigerian Institution of Estate Surveyors and Valuers
      </p>
      <p className="mt-3 text-2xl font-medium text-[hsl(var(--foreground))]/70 md:text-3xl">
        Abuja Branch Election
      </p>
      {title && (
        <h1 className="mt-8 text-4xl font-bold leading-tight md:text-5xl">
          {title}
        </h1>
      )}
      {children}
    </header>
  );
}
