import type { ReactNode } from "react";

// Auth group — no app shell. Each page owns its own chrome (split panel,
// stepper header, or centered card), so this layout is a bare full-height
// canvas on the navy background.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-navy text-text-body">{children}</div>;
}
