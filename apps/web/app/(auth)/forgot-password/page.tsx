"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { AuthCard, AuthIconBadge } from "../../../components/auth/auth-card";
import { Spinner } from "../../../components/auth/spinner";
import {
  goldButtonClass,
  inputIconClass,
  labelClass,
} from "../../../components/auth/ui";
import { authApi } from "../../../lib/api-client";
import {
  type ForgotPasswordValues,
  forgotPasswordSchema,
} from "../../../lib/validation";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    // Always succeeds (no account enumeration).
    try {
      await authApi.forgotPassword({ email: values.email });
    } catch {
      // Ignore — the screen is identical whether the email exists or not.
    }
    setSent(values.email);
  };

  const resend = async () => {
    const email = getValues("email");
    if (email) {
      try {
        await authApi.forgotPassword({ email });
      } catch {
        // ignore
      }
    }
  };

  if (sent) {
    return (
      <AuthCard>
        <AuthIconBadge size={64}>
          <Mail size={30} />
        </AuthIconBadge>
        <h1 className="mb-2 text-center font-serif text-[25px] font-bold text-text-cream">
          Check your email
        </h1>
        <p className="mb-[22px] text-center text-sm leading-[1.55] text-text-muted">
          We sent a password reset link to
          <br />
          <span className="font-semibold text-text-body">{sent}</span>. It
          expires in 60 minutes.
        </p>
        <div className="text-center text-[13px] text-text-muted">
          Didn&rsquo;t get it? Check spam, or{" "}
          <button
            type="button"
            onClick={resend}
            className="font-semibold text-gold"
          >
            resend
          </button>
        </div>
        <p className="mt-[14px] text-center text-[12.5px] text-text-faint">
          <Link href="/login" className="font-semibold text-gold">
            ← Back to login
          </Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <AuthIconBadge>
        <Lock size={24} />
      </AuthIconBadge>
      <h1 className="mb-2 text-center font-serif text-[25px] font-bold text-text-cream">
        Forgot your password?
      </h1>
      <p className="mb-6 text-center text-sm leading-[1.55] text-text-muted">
        Enter your email and we&rsquo;ll send you a secure link to reset it.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <label className={labelClass} htmlFor="email">
          Email address
        </label>
        <div className="relative mb-1">
          <Mail
            size={17}
            className="pointer-events-none absolute left-[13px] top-[13px] text-text-faint"
          />
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@firm.ng"
            className={inputIconClass}
            {...register("email")}
          />
        </div>
        {errors.email ? (
          <p className="mb-3 text-[11px] text-danger">{errors.email.message}</p>
        ) : (
          <div className="mb-4" />
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={goldButtonClass}
        >
          {isSubmitting ? <Spinner /> : "Send reset link"}
        </button>
      </form>

      <p className="mt-[18px] text-center text-[13px] text-text-muted">
        <Link href="/login" className="font-semibold text-gold">
          ← Back to login
        </Link>
      </p>
    </AuthCard>
  );
}
