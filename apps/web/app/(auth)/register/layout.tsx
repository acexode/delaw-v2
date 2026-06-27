"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { Logo } from "../../../components/auth/logo";

const STEPS = [
  { n: 1, label: "Account" },
  { n: 2, label: "Details" },
  { n: 3, label: "Firm" },
  { n: 4, label: "Plan" },
];

export default function RegisterLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const match = pathname.match(/step-(\d)/);
  const current = match ? Number(match[1]) : 1;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 flex-none items-center gap-[14px] border-b border-line-subtle px-8">
        <Logo size="sm" />
        <div className="mx-auto flex max-w-[560px] flex-1 items-start justify-center">
          {STEPS.map((step, i) => {
            const done = step.n < current;
            const active = step.n === current;
            return (
              <div key={step.n} className="flex items-start">
                <div className="flex flex-none flex-col items-center gap-[6px]">
                  <span
                    className={`flex h-[30px] w-[30px] items-center justify-center rounded-full border-[1.5px] text-[13px] font-bold ${
                      done
                        ? "border-gold bg-gold text-gold-ink"
                        : active
                          ? "border-gold bg-gold/10 text-gold"
                          : "border-line-accent bg-transparent text-text-faint"
                    }`}
                  >
                    {done ? <Check size={15} /> : step.n}
                  </span>
                  <span
                    className={`text-[11px] font-semibold ${
                      active
                        ? "text-text-cream"
                        : done
                          ? "text-gold"
                          : "text-text-faint"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 ? (
                  <div
                    className={`mx-[6px] mt-[15px] h-[2px] w-12 flex-none rounded-[2px] ${
                      done ? "bg-gold" : "bg-line-strong"
                    }`}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
        <Link
          href="/login"
          className="text-[13px] font-semibold text-text-muted transition hover:text-text-body"
        >
          Save &amp; exit
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto px-8 pb-28 pt-10">{children}</div>
    </div>
  );
}
