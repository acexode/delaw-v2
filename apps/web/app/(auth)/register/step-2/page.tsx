"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, ChevronDown, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { PasswordStrength } from "../../../../components/auth/password-strength";
import {
  backButtonClass,
  goldButtonAutoClass,
  inputClass,
  labelClass,
  selectClass,
} from "../../../../components/auth/ui";
import { DIAL_CODES, NIGERIA_STATES } from "../../../../lib/constants";
import { useRegistrationStore } from "../../../../lib/stores/registration";
import {
  type PersonalDetailsValues,
  personalDetailsSchema,
} from "../../../../lib/validation";

export default function RegisterStep2() {
  const router = useRouter();
  const store = useRegistrationStore();

  useEffect(() => {
    if (!store.accountType) {
      router.replace("/register/step-1");
    }
  }, [store.accountType, router]);

  const showBar = store.accountType !== "judiciary";

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PersonalDetailsValues>({
    resolver: zodResolver(personalDetailsSchema),
    defaultValues: {
      fullName: store.fullName,
      email: store.email,
      dialCode: store.dialCode,
      phone: store.phone,
      password: store.password,
      confirmPassword: store.confirmPassword,
      barNumber: store.barNumber,
      stateOfPractice: store.stateOfPractice,
      acceptedTerms: store.acceptedTerms || undefined,
    },
  });

  const password = watch("password") ?? "";
  const confirmPassword = watch("confirmPassword") ?? "";

  const onSubmit = (values: PersonalDetailsValues) => {
    store.setField("fullName", values.fullName);
    store.setField("email", values.email);
    store.setField("dialCode", values.dialCode);
    store.setField("phone", values.phone ?? "");
    store.setField("password", values.password);
    store.setField("confirmPassword", values.confirmPassword);
    store.setField("barNumber", values.barNumber ?? "");
    store.setField("stateOfPractice", values.stateOfPractice);
    store.setField("acceptedTerms", values.acceptedTerms);
    router.push("/register/step-3");
  };

  return (
    <div className="mx-auto max-w-[540px]">
      <div className="mb-[26px]">
        <h1 className="mb-2 font-serif text-[28px] font-bold tracking-[-.02em] text-text-cream">
          Your details
        </h1>
        <p className="text-sm text-text-muted">
          Tell us about yourself. This appears on your filings and profile.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <label className={labelClass} htmlFor="fullName">
          Full name
        </label>
        <input
          id="fullName"
          className={inputClass}
          placeholder="e.g. Babatunde Adeyemi"
          {...register("fullName")}
        />
        <FieldError message={errors.fullName?.message} />

        <div className="h-4" />
        <label className={labelClass} htmlFor="email">
          Email address
        </label>
        <input
          id="email"
          type="email"
          className={inputClass}
          placeholder="you@firm.ng"
          {...register("email")}
        />
        <FieldError message={errors.email?.message} />

        <div className="h-4" />
        <label className={labelClass}>Phone number</label>
        <div className="flex gap-[10px]">
          <div className="relative flex-none">
            <select
              className={`${selectClass} w-[104px] pl-[13px]`}
              {...register("dialCode")}
            >
              {DIAL_CODES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-[10px] top-[14px] text-text-faint"
            />
          </div>
          <input
            className={inputClass}
            placeholder="803 000 0000"
            {...register("phone")}
          />
        </div>
        <FieldError message={errors.phone?.message} />

        <div className="mt-4 grid grid-cols-1 gap-[14px] sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className={inputClass}
              placeholder="Create a password"
              {...register("password")}
            />
            <PasswordStrength value={password} />
            <FieldError message={errors.password?.message} />
          </div>
          <div>
            <label className={labelClass} htmlFor="confirmPassword">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              className={inputClass}
              placeholder="Re-enter password"
              {...register("confirmPassword")}
            />
            <div
              className="mt-2 min-h-[14px] text-[11px] font-medium"
              style={{
                color: confirmPassword
                  ? confirmPassword === password
                    ? "#10B981"
                    : "#EF4444"
                  : "#5C6678",
              }}
            >
              {confirmPassword
                ? confirmPassword === password
                  ? "✓ Passwords match"
                  : "Passwords do not match"
                : ""}
            </div>
            <FieldError message={errors.confirmPassword?.message} />
          </div>
        </div>

        <div className="mt-2 grid grid-cols-1 gap-[14px] sm:grid-cols-2">
          {showBar ? (
            <div>
              <label
                className={`${labelClass} flex items-center gap-[6px]`}
                htmlFor="barNumber"
              >
                Bar (SCN) number
                <span
                  title="Your Nigerian Bar Association enrolment number (Supreme Court Number). We verify it against the NBA roll to unlock filing features."
                  className="flex cursor-help text-text-faint"
                >
                  <HelpCircle size={14} />
                </span>
              </label>
              <input
                id="barNumber"
                className={inputClass}
                placeholder="SCN 000000"
                {...register("barNumber")}
              />
              <div className="mt-[6px] text-[11px] text-text-faint">
                Optional now — verify later to enable filing.
              </div>
            </div>
          ) : null}
          <div>
            <label className={labelClass} htmlFor="stateOfPractice">
              State of practice
            </label>
            <div className="relative">
              <select
                id="stateOfPractice"
                className={selectClass}
                {...register("stateOfPractice")}
              >
                {NIGERIA_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
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

        <label className="mt-5 flex cursor-pointer items-start gap-[10px]">
          <input
            type="checkbox"
            className="peer sr-only"
            {...register("acceptedTerms")}
          />
          <span className="mt-[1px] flex h-5 w-5 flex-none items-center justify-center rounded-[6px] border-[1.5px] border-line-accent text-transparent peer-checked:border-gold peer-checked:bg-gold peer-checked:text-gold-ink">
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
          <span className="text-[13px] leading-[1.5] text-text-secondary">
            I agree to the{" "}
            <span className="font-semibold text-gold">Terms of Service</span>{" "}
            and <span className="font-semibold text-gold">Privacy Policy</span>,
            and consent to DeLaw processing my data under the NDPR.
          </span>
        </label>
        <FieldError message={errors.acceptedTerms?.message} />

        <div className="mt-[26px] flex justify-between">
          <button
            type="button"
            onClick={() => router.push("/register/step-1")}
            className={backButtonClass}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <button type="submit" className={goldButtonAutoClass}>
            Continue <ArrowRight size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }
  return <p className="mt-1 text-[11px] text-danger">{message}</p>;
}
