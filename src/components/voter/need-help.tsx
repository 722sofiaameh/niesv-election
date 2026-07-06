"use client";

import { HelpCircle, Phone, X } from "lucide-react";
import { useState } from "react";

import { HELP_INSTRUCTIONS, HELP_PHONE, HELP_PHONE_DISPLAY } from "@/lib/voter-ui";

export function NeedHelp() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-primary bg-card px-5 py-3 text-base font-semibold text-primary shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-secondary hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 active:scale-[0.98] sm:bottom-6 sm:right-6 sm:text-lg"
        aria-label="Need help? Contact the election help desk"
      >
        <HelpCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
        Need help?
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-primary/40 p-4 motion-reduce:animate-none sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-title"
          onClick={() => setOpen(false)}
        >
          <div
            className="voter-card w-full max-w-md animate-fade-in-up motion-reduce:animate-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="voter-wing-label">Election support</p>
                <h2 id="help-title" className="mt-2 text-2xl font-bold text-foreground">
                  Need help?
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border-2 border-border bg-card p-2 shadow-sm hover:bg-secondary"
                aria-label="Close help"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <p className="mt-4 voter-body text-muted-foreground">{HELP_INSTRUCTIONS}</p>

            <a
              href={`tel:${HELP_PHONE.replace(/\s/g, "")}`}
              className="mt-6 flex min-h-14 items-center justify-center gap-3 rounded-xl border-2 border-primary bg-primary px-6 text-xl font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90"
            >
              <Phone className="h-5 w-5" aria-hidden="true" />
              Call {HELP_PHONE_DISPLAY}
            </a>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-3 w-full min-h-12 rounded-xl border-2 border-border bg-card py-3 text-lg font-medium text-muted-foreground shadow-sm hover:bg-secondary"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
