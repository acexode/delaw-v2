"use client";

import { Check, ChevronDown, SlidersHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Option = { label: string; value: string };

/**
 * A filter pill that opens a dropdown of options, styled to match the research
 * home filter bar. Multi-select keeps the dropdown open and toggles values;
 * single-select picks one value and closes.
 */
export function FilterPill({
  label,
  summary,
  options,
  isOn,
  onPick,
  multi = false,
  leadingIcon = false,
}: {
  label: string;
  summary: string;
  options: Option[];
  isOn: (value: string) => boolean;
  onPick: (value: string) => void;
  multi?: boolean;
  leadingIcon?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        className={`inline-flex h-[30px] items-center gap-1.5 rounded border bg-bg-750 px-3 text-[12px] font-medium transition ${
          open
            ? "border-gold text-text-body"
            : "border-line-strong text-text-secondary hover:border-line-accent"
        }`}
      >
        {leadingIcon && <SlidersHorizontal size={13} />}
        {summary}
        <ChevronDown size={13} className="text-text-faint" />
      </button>

      {open && (
        <div className="absolute left-0 top-[34px] z-30 min-w-[180px] rounded-[10px] border border-line bg-bg-800 p-1.5 shadow-[0_10px_30px_rgba(0,0,0,.4)]">
          <div className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.07em] text-text-faint">
            {label}
          </div>
          {options.map((o) => {
            const on = isOn(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onPick(o.value);
                  if (!multi) setOpen(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-[7px] px-2 py-[7px] text-left text-[12.5px] text-text-secondary hover:bg-bg-700"
              >
                <span
                  className={`flex h-[16px] w-[16px] flex-none items-center justify-center border-[1.5px] ${
                    multi ? "rounded-[5px]" : "rounded-full"
                  } ${
                    on
                      ? "border-gold bg-gold text-gold-ink"
                      : "border-line-accent text-transparent"
                  }`}
                >
                  {on && <Check size={10} strokeWidth={3} />}
                </span>
                {o.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
