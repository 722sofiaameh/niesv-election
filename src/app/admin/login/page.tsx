import { Suspense } from "react";

import { AdminLoginForm } from "@/components/admin/login-form";
import { LoadingState } from "@/components/ui/loading-state";
import { VoterShell } from "@/components/voter/voter-shell";

function LoginFormFallback() {
  return <LoadingState message="Loading" size="md" className="py-8" />;
}

export default function AdminLoginPage() {
  return (
    <VoterShell centered>
      <div className="voter-card w-full max-w-md">
        <p className="voter-wing-label">Administrator</p>
        <h1 className="mt-3 admin-page-title">Sign in</h1>
        <p className="mt-2 admin-page-desc">
          Email and password access for election administrators.
        </p>
        <div className="mt-8">
          <Suspense fallback={<LoginFormFallback />}>
            <AdminLoginForm />
          </Suspense>
        </div>
      </div>
    </VoterShell>
  );
}
