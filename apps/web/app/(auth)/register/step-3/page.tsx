"use client";

import { ArrowLeft, ArrowRight, Check, ChevronDown, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  backButtonClass,
  goldButtonAutoClass,
  inputClass,
  labelClass,
  selectClass,
} from "../../../../components/auth/ui";
import {
  JURISDICTIONS,
  LAWYER_COUNTS,
  ORG_TYPE_OPTIONS,
  PRACTICE_AREAS,
} from "../../../../lib/constants";
import { useRegistrationStore } from "../../../../lib/stores/registration";

export default function RegisterStep3() {
  const router = useRouter();
  const store = useRegistrationStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!store.accountType) {
      router.replace("/register/step-1");
    }
  }, [store.accountType, router]);

  const onContinue = () => {
    if (!store.organisationName.trim()) {
      setError("Organisation name is required");
      return;
    }
    router.push("/register/step-4");
  };

  return (
    <div className="mx-auto max-w-[640px]">
      <div className="mb-6">
        <h1 className="mb-2 font-serif text-[28px] font-bold tracking-[-.02em] text-text-cream">
          Set up your chambers
        </h1>
        <p className="text-sm text-text-muted">
          We&rsquo;ll preload templates and matters relevant to your practice.
        </p>
      </div>

      <label className={labelClass} htmlFor="organisationName">
        Firm / organisation name
      </label>
      <input
        id="organisationName"
        className={inputClass}
        value={store.organisationName}
        onChange={(e) => {
          store.setField("organisationName", e.target.value);
          if (error) setError(null);
        }}
        placeholder="e.g. Adeyemi Chambers & Associates"
      />
      {error ? <p className="mt-1 text-[11px] text-danger">{error}</p> : null}

      <div className="mt-4 grid grid-cols-1 gap-[14px] sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="organisationType">
            Organisation type
          </label>
          <div className="relative">
            <select
              id="organisationType"
              className={selectClass}
              value={store.organisationType}
              onChange={(e) =>
                store.setField(
                  "organisationType",
                  e.target.value as (typeof ORG_TYPE_OPTIONS)[number]["value"],
                )
              }
            >
              {ORG_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-[14px] text-text-faint"
            />
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor="jurisdiction">
            Primary jurisdiction
          </label>
          <div className="relative">
            <select
              id="jurisdiction"
              className={selectClass}
              value={store.jurisdiction}
              onChange={(e) => store.setField("jurisdiction", e.target.value)}
            >
              {JURISDICTIONS.map((j) => (
                <option key={j.value} value={j.value}>
                  {j.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-[14px] text-text-faint"
            />
          </div>
        </div>
      </div>

      <label className={`${labelClass} mt-4`}>Number of lawyers</label>
      <div className="flex flex-wrap gap-2">
        {LAWYER_COUNTS.map((count) => {
          const selected = store.lawyerCount === count;
          return (
            <button
              key={count}
              type="button"
              onClick={() => store.setField("lawyerCount", count)}
              className={`h-10 rounded-[10px] px-[18px] text-[13.5px] transition ${
                selected
                  ? "border-[1.5px] border-gold bg-gold/10 font-bold text-text-cream"
                  : "border border-line-strong bg-bg-850 font-semibold text-text-muted hover:border-line-accent"
              }`}
            >
              {count}
            </button>
          );
        })}
      </div>

      <label className={`${labelClass} mt-[18px]`}>
        Practice areas{" "}
        <span className="font-normal text-text-faint">
          — select all that apply
        </span>
      </label>
      <div className="flex flex-wrap gap-2">
        {PRACTICE_AREAS.map((area) => {
          const on = store.practiceAreas.includes(area);
          return (
            <button
              key={area}
              type="button"
              onClick={() => store.togglePracticeArea(area)}
              className={`inline-flex h-[34px] items-center gap-[6px] rounded-[9px] px-[13px] text-[12.5px] transition ${
                on
                  ? "border-[1.5px] border-gold bg-gold/10 font-semibold text-text-cream"
                  : "border border-line-strong bg-bg-850 font-medium text-text-muted hover:border-line-accent"
              }`}
            >
              {on ? <Check size={12} /> : null}
              {area}
            </button>
          );
        })}
      </div>

      <label className={`${labelClass} mt-[18px]`}>
        Firm logo <span className="font-normal text-text-faint">— optional</span>
      </label>
      <div className="flex cursor-pointer items-center gap-4 rounded-[12px] border-[1.5px] border-dashed border-line-accent bg-bg-850 p-[18px] transition hover:border-gold hover:bg-gold/[.03]">
        <div className="flex h-[46px] w-[46px] items-center justify-center rounded-[11px] border border-line bg-bg-600 text-gold">
          <Upload size={20} />
        </div>
        <div>
          <div className="text-[13.5px] font-semibold text-text-body">
            Drag &amp; drop, or click to upload
          </div>
          <div className="mt-[2px] text-[12px] text-text-faint">
            PNG or SVG, max 2MB · square works best
          </div>
        </div>
      </div>

      <div className="mt-[26px] flex justify-between">
        <button
          type="button"
          onClick={() => router.push("/register/step-2")}
          className={backButtonClass}
        >
          <ArrowLeft size={16} /> Back
        </button>
        <button type="button" onClick={onContinue} className={goldButtonAutoClass}>
          Continue <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
