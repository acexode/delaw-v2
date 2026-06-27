"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Briefcase,
  FileText,
  BookOpen,
  Plus,
  CircleCheckBig,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

type CommandItem = {
  label: string;
  hint: string;
  group: string;
  icon: LucideIcon;
  href: string;
};

// Static placeholder results — 4 categories (Matters, Documents, Actions, Settings).
const COMMANDS: CommandItem[] = [
  {
    label: "Adebayo v. United Bank for Africa Plc",
    hint: "FHC/L/CS/123/2025",
    group: "Matters",
    icon: Briefcase,
    href: "/matters",
  },
  {
    label: "Reg. Trustees, LCCI v. AG Lagos",
    hint: "Open matter",
    group: "Matters",
    icon: Briefcase,
    href: "/matters",
  },
  {
    label: "Statement of Claim — Draft",
    hint: "Document",
    group: "Documents",
    icon: FileText,
    href: "/documents",
  },
  {
    label: "Templates",
    hint: "Clause & document templates",
    group: "Documents",
    icon: BookOpen,
    href: "/documents/templates",
  },
  {
    label: "New Matter",
    hint: "Open a new case file",
    group: "Actions",
    icon: Plus,
    href: "/matters",
  },
  {
    label: "Verify a Citation",
    hint: "Check if a case is good law",
    group: "Actions",
    icon: CircleCheckBig,
    href: "/citation-check",
  },
  {
    label: "Account Settings",
    hint: "Profile & preferences",
    group: "Settings",
    icon: Settings,
    href: "/settings/account",
  },
  {
    label: "Team",
    hint: "Manage chambers members",
    group: "Settings",
    icon: Users,
    href: "/settings/team",
  },
];

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMANDS;
    return COMMANDS.filter(
      (c) =>
        c.label.toLowerCase().includes(q) || c.hint.toLowerCase().includes(q),
    );
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      // Focus after the overlay mounts.
      const id = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!open) return null;

  const select = (item: CommandItem | undefined) => {
    if (!item) return;
    onClose();
    router.push(item.href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      select(results[activeIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  // Group results while keeping a flat index for keyboard navigation.
  let flatIndex = -1;
  const groups = ["Matters", "Documents", "Actions", "Settings"].filter((g) =>
    results.some((r) => r.group === g),
  );

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[80] flex animate-fade items-start justify-center bg-[rgba(4,7,16,0.6)] pt-[13vh] backdrop-blur-[3px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        className="w-[560px] max-w-[92vw] animate-rise overflow-hidden rounded-xl border border-line-raised bg-bg-800 shadow-[0_24px_70px_rgba(0,0,0,.6)]"
      >
        <div className="flex items-center gap-[11px] border-b border-line-faint px-4 py-[14px]">
          <span className="flex text-gold">
            <Search size={18} strokeWidth={1.7} />
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or jump to…"
            className="flex-1 bg-transparent text-[15px] text-text-body outline-none placeholder:text-text-faint"
          />
          <span className="rounded-[5px] border border-line-strong px-[6px] py-0.5 font-mono text-[10.5px] text-text-faint">
            ESC
          </span>
        </div>

        <div className="max-h-[360px] overflow-y-auto p-2">
          {results.length === 0 && (
            <div className="px-3 py-8 text-center text-[13px] text-text-faint">
              No results for “{query}”
            </div>
          )}
          {groups.map((group) => (
            <div key={group}>
              {results
                .filter((r) => r.group === group)
                .map((item) => {
                  flatIndex += 1;
                  const idx = flatIndex;
                  const active = idx === activeIndex;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => select(item)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={[
                        "flex w-full items-center gap-3 rounded-lg px-3 py-[10px] text-left transition-colors",
                        active ? "bg-[#18203a]" : "hover:bg-[#18203a]",
                      ].join(" ")}
                    >
                      <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-lg bg-bg-hover text-gold">
                        <Icon size={16} strokeWidth={1.7} />
                      </span>
                      <div className="flex min-w-0 flex-col leading-[1.25]">
                        <span className="text-[13.5px] font-semibold text-text-body">
                          {item.label}
                        </span>
                        <span className="text-[11.5px] text-text-faint">
                          {item.hint}
                        </span>
                      </div>
                      <span className="ml-auto text-[10px] font-semibold uppercase tracking-[0.06em] text-text-faint">
                        {item.group}
                      </span>
                    </button>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
