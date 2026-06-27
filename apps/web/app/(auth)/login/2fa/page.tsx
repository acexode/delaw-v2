"use client";

import { Check, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthCard, AuthIconBadge } from "../../../../components/auth/auth-card";
import { OtpInput } from "../../../../components/auth/otp-input";
import { Spinner } from "../../../../components/auth/spinner";
import { goldButtonClass } from "../../../../components/auth/ui";
import { ApiError, authApi } from "../../../../lib/api-client";
import { storeTokens } from "../../../../lib/auth";

export default function TwoFactorPage() {
  const router = useRouter();
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [trust, setTrust] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [challengeToken, setChallengeToken] = useState<string | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem("delaw.challengeToken");
    if (!token) {
      router.replace("/login");
      return;
    }
    setChallengeToken(token);
  }, [router]);

  const verify = async (code: string) => {
    if (!challengeToken || code.length !== 6) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.totpChallenge({ challengeToken, code });
      storeTokens(res.accessToken);
      sessionStorage.removeItem("delaw.challengeToken");
      const next = sessionStorage.getItem("delaw.next");
      sessionStorage.removeItem("delaw.next");
      router.push(next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Verification failed. Try again.",
      );
      setOtp(["", "", "", "", "", ""]);
      setLoading(false);
    }
  };

  return (
    <AuthCard>
      <AuthIconBadge>
        <ShieldCheck size={24} />
      </AuthIconBadge>
      <h1 className="mb-2 text-center font-serif text-[25px] font-bold text-text-cream">
        Two-factor authentication
      </h1>
      <p className="mb-[26px] text-center text-sm leading-[1.55] text-text-muted">
        Enter the 6-digit code from your authenticator app to finish signing in.
      </p>

      <div className="mb-[18px]">
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

      <label className="mb-[22px] flex cursor-pointer items-center justify-center gap-2 text-[13px] text-text-secondary">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={trust}
          onChange={(e) => setTrust(e.target.checked)}
        />
        <span className="flex h-[18px] w-[18px] flex-none items-center justify-center rounded-[5px] border-[1.5px] border-line-accent text-transparent peer-checked:border-gold peer-checked:bg-gold peer-checked:text-gold-ink">
          <Check size={12} />
        </span>
        Trust this device for 30 days
      </label>

      <button
        type="button"
        onClick={() => verify(otp.join(""))}
        disabled={loading || otp.some((d) => d === "")}
        className={goldButtonClass}
      >
        {loading ? <Spinner /> : "Verify & continue"}
      </button>

      <p className="mt-[18px] text-center text-[13px] text-text-muted">
        Lost your device? Use your authenticator app, or a backup code if you
        saved one.
      </p>
    </AuthCard>
  );
}
