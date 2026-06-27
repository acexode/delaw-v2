"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { CommandPalette } from "./command-palette";
import { NotificationSheet } from "./notification-sheet";
import {
  RightPanelProvider,
  useRightPanelContent,
} from "@/lib/right-panel";

const SIDEBAR_KEY = "delaw:sidebar-collapsed";
const UNREAD_COUNT = 3; // static for now

function ShellInner({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const rightPanel = useRightPanelContent();

  // Restore persisted sidebar state after mount (avoids hydration mismatch).
  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_KEY);
    if (stored !== null) setCollapsed(stored === "true");
  }, []);

  const toggleSidebar = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(SIDEBAR_KEY, String(next));
      return next;
    });
  }, []);

  // Global ⌘K / Ctrl+K to toggle the command palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-navy text-text-body antialiased">
      <Sidebar collapsed={collapsed} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          onToggleSidebar={toggleSidebar}
          onOpenCommand={() => setCmdOpen(true)}
          onOpenNotifications={() => setNotifOpen(true)}
          unreadCount={UNREAD_COUNT}
        />

        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
            {children}
          </main>
          {rightPanel && (
            <aside className="w-80 flex-none overflow-y-auto border-l border-line-subtle bg-bg-900">
              {rightPanel}
            </aside>
          )}
        </div>
      </div>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
      <NotificationSheet open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <RightPanelProvider>
      <ShellInner>{children}</ShellInner>
    </RightPanelProvider>
  );
}
