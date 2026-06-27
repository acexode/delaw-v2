"use client";

import { usePathname } from "next/navigation";
import { PanelLeft, Search, Bell } from "lucide-react";
import { getRouteTitle } from "@/lib/nav";

type HeaderProps = {
  onToggleSidebar: () => void;
  onOpenCommand: () => void;
  onOpenNotifications: () => void;
  unreadCount: number;
};

export function Header({
  onToggleSidebar,
  onOpenCommand,
  onOpenNotifications,
  unreadCount,
}: HeaderProps) {
  const pathname = usePathname();
  const title = getRouteTitle(pathname);

  return (
    <header className="flex h-14 flex-none items-center gap-[14px] border-b border-line-subtle bg-[rgba(10,15,30,0.72)] px-[18px] backdrop-blur-md">
      <button
        type="button"
        onClick={onToggleSidebar}
        title="Toggle sidebar"
        className="flex h-8 w-8 flex-none items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg-hover hover:text-text-body"
      >
        <PanelLeft size={18} strokeWidth={1.7} />
      </button>

      {/* Breadcrumbs */}
      <div className="flex min-w-0 items-center gap-[9px] text-[13.5px]">
        <span className="whitespace-nowrap text-text-muted">
          Adeyemi Chambers
        </span>
        <span className="text-line-accent">/</span>
        <span className="whitespace-nowrap font-semibold text-text-body">
          {title}
        </span>
      </div>

      {/* Search trigger */}
      <button
        type="button"
        onClick={onOpenCommand}
        className="ml-auto flex h-[34px] min-w-[230px] items-center gap-[9px] rounded-md border border-line-strong bg-bg-850 px-[11px] text-[13px] text-text-faint transition-colors hover:border-line-accent hover:bg-[#10172a]"
      >
        <span className="flex text-text-faint">
          <Search size={16} strokeWidth={1.7} />
        </span>
        <span>Search cases, statutes, docs…</span>
        <span className="ml-auto flex items-center gap-0.5 rounded-[5px] border border-line-strong bg-bg-hover px-[6px] py-px font-mono text-[11px] text-text-faint">
          ⌘K
        </span>
      </button>

      {/* Notification bell */}
      <button
        type="button"
        onClick={onOpenNotifications}
        title="Notifications"
        className="relative flex h-[34px] w-[34px] flex-none items-center justify-center rounded-md border border-line-strong bg-bg-850 text-text-muted transition-colors hover:border-line-accent hover:text-text-body"
      >
        <Bell size={18} strokeWidth={1.7} />
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full border-[1.5px] border-bg-base bg-danger px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* User avatar */}
      <button
        type="button"
        title="Babatunde Fashola · SAN · Principal"
        className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full border border-line-accent bg-gradient-to-br from-line-raised to-[#1a2233] text-[11px] font-semibold text-gold transition-[filter] hover:brightness-110"
      >
        BF
      </button>
    </header>
  );
}
