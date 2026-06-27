"use client";

import { Check, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AuthCard } from "../../../components/auth/auth-card";
import { OtpInput } from "../../../components/auth/otp-input";
import { Spinner } from "../../../components/auth/spinner";
import { goldButtonClass } from "../../../components/auth/ui";
import { ApiError, authApi } from "../../../lib/api-client";

const RESEND_SECONDS = 60;

export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);

  useEffect(() => {
    const stored = sessionStorage.getItem("delaw.verifyEmail");
    if (!stored) {
      router.replace("/login");
      return;
    }
    setEmail(stored);
  }, [router]);

  useEffect(() => {
    if (resendIn <= 0) {
      return;
    }
    const id = setInterval(() => setResendIn((v) => (v <= 1 ? 0 : v - 1)), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  const verify = useCallback(
    async (code: string) => {
      if (!email || code.length !== 6) {
        return;
      }
      setLoading(true);
      setError(null);
      try {
        await authApi.verifyEmail({ email, otp: code });
        sessionStorage.removeItem("delaw.verifyEmail");
        router.push("/onboarding");
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : "Verification failed. Please try again.",
        );
        setOtp(["", "", "", "", "", ""]);
        setLoading(false);
      }
    },
    [email, router],
  );

  const resend = async () => {
    if (!email || resendIn > 0) {
      return;
    }
    try {
      await authApi.resendVerification({ email });
    } catch {
      // Endpoint always returns 200; ignore transport errors here.
    }
    setResendIn(RESEND_SECONDS);
  };

  return (
    <AuthCard>
      <div className="relative mx-auto mb-[22px] h-16 w-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-[16px] border border-gold/30 bg-gold/10 text-gold">
          <Mail size={30} />
        </div>
        <span className="absolute -right-1 -top-1 flex h-[22px] w-[22px] items-center justify-center rounded-full border-[3px] border-bg-800 bg-success text-[#04140d]">
          <Check size={12} />
        </span>
      </div>

      <h1 className="mb-2 text-center font-serif text-[25px] font-bold text-text-cream">
        Check your email
      </h1>
      <p className="mb-6 text-center text-sm leading-[1.55] text-text-muted">
        We sent a 6-digit code to
        <br />
        <span className="font-semibold text-text-body">
          {email ?? "your email"}
        </span>
      </p>

      <div className="mb-5">
        <OtpInput
          value={otp}
          onChange={setOtp}
          onComplete={verify}
          disabled={loading}
          autoFocus
        />
      </div>

      {error ? (
        <p className="mb-3 text-center text-[13px] text-danger">{error}</p>
      ) : null}

      <button
        type="button"
        onClick={() => verify(otp.join(""))}
        disabled={loading || otp.some((d) => d === "")}
        className={goldButtonClass}
      >
        {loading ? <Spinner /> : "Verify & continue"}
      </button>

      <div className="mt-[18px] text-center text-[13px] text-text-muted">
        {resendIn > 0 ? (
          <span className="text-text-faint">
            Resend code in 0:{String(resendIn).padStart(2, "0")}
          </span>
        ) : (
          <span>
            Didn&rsquo;t get it?{" "}
            <button
              type="button"
              onClick={resend}
              className="font-semibold text-gold"
            >
              Resend code
            </button>
          </span>
        )}
      </div>

      <p className="mt-[14px] text-center text-[12.5px] text-text-faint">
        Wrong address?{" "}
        <Link href="/register/step-2" className="font-semibold text-gold">
          Change email
        </Link>
      </p>
    </AuthCard>
  );
}
