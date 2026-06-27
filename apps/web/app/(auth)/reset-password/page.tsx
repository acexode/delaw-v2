"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Lock } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";

import { AuthCard, AuthIconBadge } from "../../../components/auth/auth-card";
import { PasswordStrength } from "../../../components/auth/password-strength";
import { Spinner } from "../../../components/auth/spinner";
import {
  goldButtonClass,
  inputClass,
  labelClass,
} from "../../../components/auth/ui";
import { ApiError, authApi } from "../../../lib/api-client";
import {
  type ResetPasswordValues,
  resetPasswordSchema,
} from "../../../lib/validation";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const password = watch("password") ?? "";
  const confirmPassword = watch("confirmPassword") ?? "";

  const onSubmit = async (values: ResetPasswordValues) => {
    if (!token) {
      return;
    }
    setServerError(null);
    try {
      await authApi.resetPassword({ token, password: values.password });
      setDone(true);
    } catch (err) {
      setServerError(
        err instanceof ApiError
          ? err.message
          : "Could not reset your password. Please try again.",
      );
    }
  };

  if (!token) {
    return (
      <AuthCard className="text-center">
        <AuthIconBadge>
          <Lock size={24} />
        </AuthIconBadge>
        <h1 className="mb-2 font-serif text-[25px] font-bold text-text-cream">
          Invalid reset link
        </h1>
        <p className="mb-6 text-sm leading-[1.55] text-text-muted">
          This password reset link is missing or malformed. Request a new one to
          continue.
        </p>
        <Link href="/forgot-password" className={goldButtonClass}>
          Request a new link
        </Link>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard className="text-center">
        <div className="mx-auto mb-[22px] flex h-16 w-16 items-center justify-center rounded-full border border-success/35 bg-success/10 text-success">
          <CheckCircle2 size={28} />
        </div>
        <h1 className="mb-2 font-serif text-[25px] font-bold text-text-cream">
          Password reset
        </h1>
        <p className="mb-[26px] text-sm leading-[1.55] text-text-muted">
          Your password has been updated. You can now sign in with your new
          credentials.
        </p>
        <Link href="/login" className={goldButtonClass}>
          Back to login
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <AuthIconBadge>
        <Lock size={24} />
      </AuthIconBadge>
      <h1 className="mb-2 text-center font-serif text-[25px] font-bold text-text-cream">
        Set a new password
      </h1>
      <p className="mb-6 text-center text-sm text-text-muted">
        Choose a strong password you haven&rsquo;t used before.
      </p>

      {serverError ? (
        <div className="mb-4 rounded-[10px] border border-danger/30 bg-danger/10 px-3 py-2.5 text-[13px] text-danger">
          {serverError}
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <label className={labelClass} htmlFor="password">
          New password
        </label>
        <input
          id="password"
          type="password"
          className={inputClass}
          placeholder="New password"
          {...register("password")}
        />
        <PasswordStrength value={password} />
        {errors.password ? (
          <p className="mt-1 text-[11px] text-danger">
            {errors.password.message}
          </p>
        ) : null}

        <div className="h-[14px]" />
        <label className={labelClass} htmlFor="confirmPassword">
          Confirm new password
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
        {errors.confirmPassword ? (
          <p className="mt-1 text-[11px] text-danger">
            {errors.confirmPassword.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`${goldButtonClass} mt-[18px]`}
        >
          {isSubmitting ? <Spinner /> : "Reset password"}
        </button>
      </form>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
