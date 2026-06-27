"use client";

import { ArrowRight, Briefcase, Building2, Scale, User } from "lucide-react";
import { useRouter } from "next/navigation";

import { goldButtonAutoClass } from "../../../../components/auth/ui";
import { ACCOUNT_TYPES, type AccountTypeOption } from "../../../../lib/constants";
import { useRegistrationStore } from "../../../../lib/stores/registration";

const ICONS = {
  user: User,
  building2: Building2,
  briefcase: Briefcase,
  scale: Scale,
} as const;

export default function RegisterStep1() {
  const router = useRouter();
  const accountType = useRegistrationStore((s) => s.accountType);
  const setField = useRegistrationStore((s) => s.setField);

  const select = (option: AccountTypeOption) => {
    setField("accountType", option.key);
    setField("organisationType", option.defaultOrgType);
  };

  return (
    <div className="mx-auto max-w-[760px]">
      <div className="mb-8 text-center">
        <h1 className="mb-2 font-serif text-[30px] font-bold tracking-[-.02em] text-text-cream">
          How will you use DeLaw?
        </h1>
        <p className="text-[14.5px] text-text-muted">
          We&rsquo;ll tailor your workspace to how you practise.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
        {ACCOUNT_TYPES.map((option) => {
          const Icon = ICONS[option.icon];
          const selected = accountType === option.key;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => select(option)}
              className={`rounded-[14px] border p-[18px] text-left transition ${
                selected
                  ? "border-[1.5px] border-gold bg-gradient-to-br from-gold/10 to-bg-750 shadow-[0_6px_22px_rgba(201,168,76,.1)]"
                  : "border-line bg-bg-750 hover:border-line-accent"
              }`}
            >
              <div className="flex items-start gap-[14px]">
                <span
                  className={`flex h-[46px] w-[46px] flex-none items-center justify-center rounded-[12px] border text-gold ${
                    selected
                      ? "border-gold/30 bg-gold/[.14]"
                      : "border-line bg-bg-600"
                  }`}
                >
                  <Icon size={22} />
                </span>
                <div className="flex-1">
                  <div className="mb-1 font-serif text-[17px] font-semibold text-text-cream">
                    {option.title}
                  </div>
                  <div className="text-[13px] leading-[1.5] text-text-muted">
                    {option.desc}
                  </div>
                </div>
                <span
                  className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border-[1.5px] ${
                    selected ? "border-gold" : "border-line-accent"
                  }`}
                >
                  {selected ? (
                    <span className="h-[9px] w-[9px] rounded-full bg-gold" />
                  ) : null}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-7 flex justify-end">
        <button
          type="button"
          disabled={!accountType}
          onClick={() => router.push("/register/step-2")}
          className={goldButtonAutoClass}
        >
          Continue <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
