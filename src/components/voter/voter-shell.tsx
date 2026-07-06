import type { ReactNode } from "react";

import { NeedHelp } from "@/components/voter/need-help";
import { NiesvHeader } from "@/components/voter/niesv-header";

interface VoterShellProps {
  children: ReactNode;
  centered?: boolean;
  wide?: boolean;
}

export function VoterShell({ children, centered = false, wide = false }: VoterShellProps) {
  return (
    <div className="voter-theme min-h-screen bg-background">
      <NiesvHeader />

      <main
        className={
          centered
            ? "mx-auto flex min-h-[calc(100vh-7rem)] max-w-3xl flex-col items-center justify-center px-6 py-10 pb-24"
            : `mx-auto min-h-[calc(100vh-7rem)] px-6 py-8 pb-24 sm:py-10 ${wide ? "max-w-4xl" : "max-w-3xl"}`
        }
      >
        {children}
      </main>

      <NeedHelp />
    </div>
  );
}
