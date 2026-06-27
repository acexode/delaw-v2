"use client";

import { useEffect } from "react";
import { Bell, X } from "lucide-react";

export function NotificationSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-[85] animate-fade bg-[rgba(4,7,16,0.55)] backdrop-blur-[3px]"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
        className="fixed bottom-0 right-0 top-0 z-[86] flex w-[400px] max-w-[94vw] flex-col border-l border-line-raised bg-bg-850 shadow-[-24px_0_70px_rgba(0,0,0,.5)]"
      >
        <div className="flex flex-none items-center justify-between border-b border-line-subtle px-[22px] py-[18px]">
          <h2 className="font-serif text-[19px] font-semibold text-text-cream">
            Notifications
          </h2>
          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-line-strong bg-bg-750 text-text-muted transition-colors hover:border-line-accent hover:text-text-body"
          >
            <X size={16} strokeWidth={1.7} />
          </button>
        </div>

        {/* Empty state */}
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-bg-750 text-text-faint">
            <Bell size={24} strokeWidth={1.7} />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-text-body">
              You&apos;re all caught up
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-text-muted">
              New notifications about deadlines, tasks and AI jobs will appear
              here.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
