"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Eye, EyeOff, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { GoogleButton } from "../../../components/auth/google-button";
import { Logo } from "../../../components/auth/logo";
import { Spinner } from "../../../components/auth/spinner";
import {
  goldButtonClass,
  inputIconClass,
  labelClass,
} from "../../../components/auth/ui";
import { ApiError, authApi } from "../../../lib/api-client";
import { storeTokens } from "../../../lib/auth";
import { type LoginValues, loginSchema } from "../../../lib/validation";

export default function LoginPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [ssoNote, setSsoNote] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: true },
  });

  const onSubmit = async (values: LoginValues) => {
    setServerError(null);
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("next");
    const next = raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : null;
    try {
      const res = await authApi.login({
        email: values.email,
        password: values.password,
      });
      if ("totpRequired" in res && res.totpRequired) {
        sessionStorage.setItem("delaw.challengeToken", res.challengeToken);
        sessionStorage.setItem("delaw.next", next ?? "");
        router.push("/login/2fa");
        return;
      }
      storeTokens(res.accessToken);
      router.push(next ?? "/dashboard");
    } catch (err) {
      setServerError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again.",
      );
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* brand panel */}
      <div
        className="relative hidden w-[46%] flex-none flex-col overflow-hidden border-r border-line-subtle px-[52px] py-12 lg:flex"
        style={{ background: "linear-gradient(165deg,#0E1424,#0A0F1E)" }}
      >
        <div
          className="absolute -right-[120px] -top-[120px] h-[420px] w-[420px]"
          style={{
            background:
              "radial-gradient(circle, rgba(201,168,76,.1), transparent 65%)",
          }}
        />
        <div className="relative">
          <Logo />
        </div>
        <div className="relative mt-auto">
          <h2 className="mb-5 font-serif text-[32px] font-bold leading-[1.2] tracking-[-.02em] text-text-cream">
            The practice tool a Senior Advocate is proud to use.
          </h2>
          <div className="rounded-[14px] border border-line bg-[rgba(16,23,40,.6)] p-[18px]">
            <p className="mb-[14px] font-serif text-[15px] italic leading-[1.6] text-text-secondary">
              &ldquo;DeLaw cut my research time in half. The citations are
              verified — I stopped second-guessing the AI.&rdquo;
            </p>
            <div className="flex items-center gap-[11px]">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line-accent bg-gradient-to-br from-line-raised to-bg-500 text-xs font-bold text-gold">
                NO
              </span>
              <div>
                <div className="text-[13px] font-semibold text-text-body">
                  Ngozi Okonkwo, Esq.
                </div>
                <div className="text-[11.5px] text-gold-muted">
                  Partner · Okonkwo &amp; Partners, Lagos
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* form panel */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[384px]">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="mb-[7px] font-serif text-[28px] font-bold tracking-[-.02em] text-text-cream">
            Welcome back
          </h1>
          <p className="mb-[26px] text-sm text-text-muted">
            Sign in to your DeLaw workspace.
          </p>

          <GoogleButton onClick={() => setSsoNote(true)} />
          {ssoNote ? (
            <p className="mt-2 text-center text-[12px] text-text-muted">
              Google SSO is coming soon — sign in with your email below.
            </p>
          ) : null}

          <div className="my-[18px] flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="text-[11.5px] text-text-faint">
              or sign in with email
            </span>
            <div className="h-px flex-1 bg-line" />
          </div>

          {serverError ? (
            <div className="mb-4 rounded-[10px] border border-danger/30 bg-danger/10 px-3 py-2.5 text-[13px] text-danger">
              {serverError}
            </div>
          ) : null}

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
              <p className="mb-3 text-[11px] text-danger">
                {errors.email.message}
              </p>
            ) : (
              <div className="mb-3" />
            )}

            <label className={labelClass} htmlFor="password">
              Password
            </label>
            <div className="relative mb-1">
              <Lock
                size={17}
                className="pointer-events-none absolute left-[13px] top-[13px] text-text-faint"
              />
              <input
                id="password"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Your password"
                className={`${inputIconClass} pr-10`}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="absolute right-[10px] top-[11px] flex h-6 w-6 items-center justify-center text-text-faint hover:text-text-body"
              >
                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password ? (
              <p className="text-[11px] text-danger">
                {errors.password.message}
              </p>
            ) : null}

            <div className="mb-[22px] mt-[14px] flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-[13px] text-text-secondary">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  {...register("remember")}
                />
                <span className="flex h-[18px] w-[18px] flex-none items-center justify-center rounded-[5px] border-[1.5px] border-line-accent text-transparent peer-checked:border-gold peer-checked:bg-gold peer-checked:text-gold-ink">
                  <Check size={12} />
                </span>
                Remember me
              </label>
              <Link
                href="/forgot-password"
                className="text-[13px] font-semibold text-gold"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={goldButtonClass}
            >
              {isSubmitting ? <Spinner /> : "Sign in"}
            </button>
          </form>

          <p className="mt-5 text-center text-[13.5px] text-text-muted">
            New to DeLaw?{" "}
            <Link
              href="/register/step-1"
              className="font-semibold text-gold"
            >
              Start your free trial
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
