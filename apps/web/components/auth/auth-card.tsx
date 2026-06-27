import type { ReactNode } from "react";

import { authCardClass, authCenterClass } from "./ui";

/** Centered card shell used by the 2FA, verify-email, forgot/reset screens. */
export function AuthCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={authCenterClass}>
      <div className={`${authCardClass} ${className}`}>{children}</div>
    </div>
  );
}

/** Gold rounded-square icon badge centered above a card title. */
export function AuthIconBadge({
  children,
  variant = "gold",
  size = 54,
}: {
  children: ReactNode;
  variant?: "gold" | "success";
  size?: number;
}) {
  const palette =
    variant === "success"
      ? "border-success/30 bg-success/10 text-success"
      : "border-gold/30 bg-gold/10 text-gold";
  return (
    <div
      className={`mx-auto mb-5 flex items-center justify-center rounded-[14px] border ${palette}`}
      style={{ width: size, height: size }}
    >
      {children}
    </div>
  );
}
