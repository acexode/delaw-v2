import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { RequireAuth } from "@/components/auth/require-auth";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  );
}
