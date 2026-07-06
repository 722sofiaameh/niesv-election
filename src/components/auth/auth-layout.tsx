import type { ReactNode } from "react";

import { FadeIn } from "@/components/ui/fade-in";
import { VoterShell } from "@/components/voter/voter-shell";

interface AuthLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function AuthLayout({ title, description, children }: AuthLayoutProps) {
  return (
    <VoterShell centered>
      <FadeIn variant="scale">
        <div className="voter-card w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="voter-heading">{title}</h1>
            {description && (
              <p className="mt-4 voter-subheading">{description}</p>
            )}
          </div>
          {children}
        </div>
      </FadeIn>
    </VoterShell>
  );
}
