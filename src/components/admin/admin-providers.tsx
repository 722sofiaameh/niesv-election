"use client";

import { ConfirmProvider } from "@/components/ui/confirm-provider";
import { ToastProvider } from "@/components/ui/toast";
import { AdminSessionProvider } from "@/components/admin/session-provider";

export function AdminProviders({ children }: { children: React.ReactNode }) {
  return (
    <AdminSessionProvider>
      <ToastProvider>
        <ConfirmProvider>{children}</ConfirmProvider>
      </ToastProvider>
    </AdminSessionProvider>
  );
}
