"use client";

import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Spinner } from "../../../../components/auth/spinner";
import { backButtonClass, goldButtonAutoClass } from "../../../../components/auth/ui";
import { PLANS } from "../../../../lib/constants";
import { ApiError, authApi } from "../../../../lib/api-client";
import { storeTokens } from "../../../../lib/auth";
import { useRegistrationStore } from "../../../../lib/stores/registration";

export default function RegisterStep4() {
  const router = useRouter();
  const store = useRegistrationStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!store.accountType || !store.email || !store.password) {
      router.replace("/register/step-1");
    }
  }, [store.accountType, store.email, store.password, router]);

  const submit = async () => {
    setLoading(true);
    setError(null);
    const phone = store.phone.trim()
      ? `${store.dialCode} ${store.phone.trim()}`
      : undefined;
    try {
      const res = await authApi.register({
        email: store.email,
        password: store.password,
        fullName: store.fullName,
        organisationName: store.organisationName,
        organisationType: store.organisationType,
        plan: store.plan,
        country: store.jurisdiction,
        phone,
      });
      storeTokens(res.accessToken);
      sessionStorage.setItem("delaw.verifyEmail", res.user.email);
      store.reset();
      router.push("/verify-email");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Registration failed. Please try again.",
      );
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1000px]">
      <div className="mb-[30px] text-center">
        <h1 className="mb-2 font-serif text-[30px] font-bold tracking-[-.02em] text-text-cream">
          Choose your plan
        </h1>
        <p className="text-[14.5px] text-text-muted">
          Start with a 14-day free trial. Upgrade, downgrade or cancel anytime.
        </p>
      </div>

      {error ? (
        <div className="mx-auto mb-5 max-w-[520px] rounded-[10px] border border-danger/30 bg-danger/10 px-3 py-2.5 text-center text-[13px] text-danger">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 items-stretch gap-[14px] sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => {
          const selected = store.plan === plan.key;
          return (
            <button
              key={plan.key}
              type="button"
              onClick={() => store.setField("plan", plan.key)}
              className={`relative rounded-[15px] p-[22px_18px] text-left transition ${
                selected
                  ? "border-[1.5px] border-gold bg-gradient-to-br from-gold/[.09] to-bg-750 shadow-[0_8px_28px_rgba(201,168,76,.1)]"
                  : "border border-line bg-bg-750 hover:border-line-accent"
              }`}
            >
              {plan.recommended ? (
                <div className="absolute -top-[11px] left-1/2 -translate-x-1/2 rounded-[20px] bg-gradient-to-br from-gold-hover to-gold px-[11px] py-1 text-[9.5px] font-bold tracking-[.06em] text-gold-ink">
                  RECOMMENDED
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <span className="text-[13.5px] font-bold text-text-secondary">
                  {plan.name}
                </span>
                <span
                  className={`flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full border-[1.5px] ${
                    selected ? "border-gold" : "border-line-accent"
                  }`}
                >
                  {selected ? (
                    <span className="h-[9px] w-[9px] rounded-full bg-gold" />
                  ) : null}
                </span>
              </div>
              <div className="mb-[2px] mt-3 font-serif text-[25px] font-bold text-text-cream">
                {plan.price}
              </div>
              <div className="mb-[14px] text-[11.5px] text-text-faint">
                {plan.unit}
              </div>
              <div className="flex flex-col gap-[9px] border-t border-line-subtle pt-[14px]">
                {plan.features.map((feat) => (
                  <div
                    key={feat}
                    className="flex items-start gap-2 text-[12.5px] leading-[1.4] text-text-tertiary"
                  >
                    <Check size={12} className="mt-[2px] flex-none text-gold" />
                    {feat}
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-7 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/register/step-3")}
          className={backButtonClass}
        >
          <ArrowLeft size={16} /> Back
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className={goldButtonAutoClass}
        >
          {loading ? <Spinner /> : <>Start free trial <ArrowRight size={18} /></>}
        </button>
      </div>
    </div>
  );
}
