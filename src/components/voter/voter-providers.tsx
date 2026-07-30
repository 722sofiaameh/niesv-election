"use client";

import { ConfirmProvider } from "@/components/ui/confirm-provider";

export function VoterProviders({ children }: { children: React.ReactNode }) {
  return <ConfirmProvider>{children}</ConfirmProvider>;
}
