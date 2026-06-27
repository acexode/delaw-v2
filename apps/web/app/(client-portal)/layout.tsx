"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, FileText, MessageSquare, Receipt } from "lucide-react";

const PORTAL_NAV = [
  { label: "My Cases", href: "/portal/matters", icon: Briefcase },
  { label: "My Documents", href: "/portal/documents", icon: FileText },
  { label: "Messages", href: "/portal/messages", icon: MessageSquare },
  { label: "Invoices", href: "/portal/invoices", icon: Receipt },
];

export default function ClientPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-navy text-text-body antialiased">
      <aside className="flex w-[244px] flex-none flex-col border-r border-line-subtle bg-bg-900">
        <div className="flex h-14 flex-none items-center gap-[11px] border-b border-line-subtle px-[14px]">
          <div className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-lg bg-gradient-to-br from-gold to-gold-deep shadow-[0_2px_10px_rgba(201,168,76,.28)]">
            <span className="font-serif text-lg font-bold text-navy">D</span>
          </div>
          <div className="flex flex-col leading-[1.05]">
            <span className="font-serif text-[17px] font-bold tracking-[-0.01em] text-text-cream">
              DeLaw
            </span>
            <span className="text-[9.5px] font-semibold uppercase tracking-[0.13em] text-gold-muted">
              Client Portal
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-[10px] pb-[14px] pt-2">
          {PORTAL_NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "group my-px flex items-center gap-[11px] rounded-lg px-[10px] py-2 text-[13.5px] transition-colors duration-150",
                  active
                    ? "bg-gold/10 font-semibold text-text-cream shadow-[inset_2.5px_0_0_#C9A84C]"
                    : "font-medium text-text-muted hover:bg-bg-hover hover:text-text-body",
                ].join(" ")}
              >
                <span
                  className={
                    active
                      ? "flex text-gold"
                      : "flex text-text-muted group-hover:text-text-body"
                  }
                >
                  <Icon size={18} strokeWidth={1.7} />
                </span>
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
