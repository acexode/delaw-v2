"use client";

import { ArrowRight, Check, CheckCircle2, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Logo } from "../../../components/auth/logo";
import { usersApi } from "../../../lib/api-client";
import { ONBOARDING_ITEMS } from "../../../lib/constants";

export default function OnboardingPage() {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [openKey, setOpenKey] = useState<string | null>(ONBOARDING_ITEMS[0]?.key ?? null);

  const doneCount = useMemo(
    () => ONBOARDING_ITEMS.filter((item) => completed[item.key]).length,
    [completed],
  );
  const progressPct = Math.round((doneCount / ONBOARDING_ITEMS.length) * 100);

  const toggleComplete = (key: string) => {
    setCompleted((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      const completedItems = ONBOARDING_ITEMS.filter((i) => next[i.key]).map(
        (i) => i.key,
      );
      // Best-effort persistence — endpoint may not exist yet (see report).
      void usersApi
        .updateOnboarding({
          completedItems,
          complete: completedItems.length === ONBOARDING_ITEMS.length,
        })
        .catch(() => undefined);
      return next;
    });
  };

  return (
    <div className="min-h-screen">
      <header className="flex h-16 items-center gap-[14px] border-b border-line-subtle px-8">
        <Logo size="sm" />
        <Link
          href="/dashboard"
          className="ml-auto text-[13px] font-semibold text-text-muted transition hover:text-text-body"
        >
          Skip for now →
        </Link>
      </header>

      <div className="mx-auto max-w-[680px] px-7 pb-28 pt-10">
        <div className="mb-[18px] flex h-[50px] w-[50px] items-center justify-center rounded-[13px] border border-success/30 bg-success/10 text-success">
          <CheckCircle2 size={26} />
        </div>
        <h1 className="mb-2 font-serif text-[30px] font-bold tracking-[-.02em] text-text-cream">
          Welcome to DeLaw
        </h1>
        <p className="mb-[26px] text-[15px] text-text-muted">
          Your workspace is ready. Complete these steps to get the most out of
          DeLaw.
        </p>

        <div className="mb-6 rounded-[14px] border border-line bg-bg-750 px-5 py-[18px]">
          <div className="mb-[11px] flex items-center justify-between">
            <span className="text-[13.5px] font-semibold text-text-body">
              Getting started
            </span>
            <span className="font-mono text-[12.5px] font-semibold text-gold">
              {doneCount} of {ONBOARDING_ITEMS.length} complete
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-[5px] bg-bg-500">
            <div
              className="h-full rounded-[5px] bg-gradient-to-r from-gold to-gold-hover transition-[width] duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-[10px]">
          {ONBOARDING_ITEMS.map((item) => {
            const done = !!completed[item.key];
            const expanded = openKey === item.key;
            return (
              <div
                key={item.key}
                className={`overflow-hidden rounded-[13px] border bg-bg-750 transition ${
                  expanded ? "border-line-accent" : "border-line"
                }`}
              >
                <div
                  className="flex cursor-pointer items-center gap-[13px] px-[17px] py-[15px]"
                  onClick={() =>
                    setOpenKey((prev) => (prev === item.key ? null : item.key))
                  }
                >
                  <span
                    role="checkbox"
                    aria-checked={done}
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleComplete(item.key);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleComplete(item.key);
                      }
                    }}
                    className={`flex h-6 w-6 flex-none items-center justify-center rounded-[7px] border-[1.5px] ${
                      done
                        ? "border-gold bg-gold text-gold-ink"
                        : "border-line-accent text-transparent"
                    }`}
                  >
                    <Check size={15} />
                  </span>
                  <span
                    className={`flex-1 text-[14px] font-semibold ${
                      done
                        ? "text-text-faint line-through"
                        : "text-text-body"
                    }`}
                  >
                    {item.title}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-text-faint transition-transform ${
                      expanded ? "rotate-180" : ""
                    }`}
                  />
                </div>
                {expanded ? (
                  <div className="pb-4 pl-[47px] pr-[17px]">
                    <p className="mb-[13px] text-[13px] leading-[1.55] text-text-muted">
                      {item.desc}
                    </p>
                    <Link
                      href={item.href}
                      className="inline-flex h-9 items-center rounded-[9px] bg-gradient-to-br from-gold-hover to-gold px-[15px] text-[12.5px] font-bold text-gold-ink transition hover:brightness-105"
                    >
                      {item.action}
                    </Link>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <Link
          href="/dashboard"
          className="mt-[26px] flex h-12 items-center justify-center gap-2 rounded-[12px] bg-gradient-to-br from-gold-hover to-gold text-[15px] font-bold text-gold-ink shadow-gold-lg transition hover:brightness-105"
        >
          Go to your dashboard <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
