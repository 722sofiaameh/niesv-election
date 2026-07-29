"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type AdminSelectOption = {
  value: string;
  label: string;
};

interface AdminSelectProps {
  label?: string;
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: AdminSelectOption[];
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function AdminSelect({
  label,
  id,
  value,
  onChange,
  options,
  disabled = false,
  className,
  placeholder = "Select…",
}: AdminSelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {label && (
        <label htmlFor={selectId} className="mb-2 block text-sm font-semibold">
          {label}
        </label>
      )}

      <button
        id={selectId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "admin-select flex w-full items-center justify-between text-left",
          open && "border-primary ring-4 ring-primary/15",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <span className={cn(!selected && "text-muted-foreground")}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-labelledby={selectId}
          className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border-2 border-border bg-card py-1 shadow-lg"
        >
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <li key={option.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 px-4 py-2.5 text-left text-base transition-colors hover:bg-secondary",
                    isSelected && "bg-secondary font-semibold text-foreground",
                  )}
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0 text-primary",
                      !isSelected && "opacity-0",
                    )}
                    aria-hidden
                  />
                  <span>{option.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
