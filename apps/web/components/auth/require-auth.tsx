"use client";

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";

import { refreshAccessToken } from "../../lib/api-client";
import { isAuthenticated } from "../../lib/auth";

type Status = "checking" | "authed" | "unauthed";

/**
 * Client-side gate for the authenticated app shell. If no valid access token
 * is present it tries a silent refresh (httpOnly refresh cookie); on failure it
 * redirects to /login with a `next` param so the user returns where they were.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let active = true;

    const verify = async () => {
      if (isAuthenticated()) {
        if (active) setStatus("authed");
        return;
      }
      const refreshed = await refreshAccessToken();
      if (!active) {
        return;
      }
      if (refreshed && isAuthenticated()) {
        setStatus("authed");
      } else {
        setStatus("unauthed");
        const next = encodeURIComponent(pathname || "/dashboard");
        router.replace(`/login?next=${next}`);
      }
    };

    void verify();
    return () => {
      active = false;
    };
    // Run once on mount; the layout persists across in-app navigations.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "authed") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy">
      <span
        className="inline-block h-6 w-6 animate-spin rounded-full"
        style={{ border: "2px solid #243049", borderTopColor: "#C9A84C" }}
        aria-label="Loading"
      />
    </div>
  );
}
