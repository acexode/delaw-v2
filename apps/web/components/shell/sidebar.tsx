"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { NAV_GROUPS } from "@/lib/nav";

function isActive(pathname: string, href: string): boolean {
  return pathname === href;
}

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();

  return (
    <aside
      className="flex min-h-0 flex-none flex-col border-r border-line-subtle bg-bg-900 transition-[width] duration-150 ease-in-out"
      style={{ width: collapsed ? 66 : 244 }}
    >
      {/* Brand */}
      <div className="flex h-14 flex-none items-center gap-[11px] border-b border-line-subtle px-[14px]">
        <div className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-lg bg-gradient-to-br from-gold to-gold-deep shadow-[0_2px_10px_rgba(201,168,76,.28)]">
          <span className="font-serif text-lg font-bold text-navy">D</span>
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-[1.05]">
            <span className="font-serif text-[17px] font-bold tracking-[-0.01em] text-text-cream">
              DeLaw
            </span>
            <span className="text-[9.5px] font-semibold uppercase tracking-[0.13em] text-gold-muted">
              African Law
            </span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-[10px] pb-[14px] pt-2">
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label ?? `top-${gi}`}>
            {group.label && !collapsed && (
              <div className="px-[10px] pb-[5px] pt-[14px] text-[10px] font-bold uppercase tracking-[0.1em] text-text-ghost">
                {group.label}
              </div>
            )}
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={[
                    "group my-px flex items-center gap-[11px] rounded-lg text-[13.5px] transition-colors duration-150",
                    collapsed ? "justify-center px-0 py-[9px]" : "px-[10px] py-2",
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
                  {!collapsed && (
                    <span className="whitespace-nowrap">{item.label}</span>
                  )}
                  {!collapsed && item.dot && !active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gold" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer: settings + user */}
      <div className="flex-none border-t border-line-subtle p-[10px]">
        <Link
          href="/settings/account"
          title="Settings"
          className={[
            "flex w-full items-center gap-[11px] rounded-lg px-[10px] py-2 text-[13.5px] font-medium text-text-muted transition-colors hover:bg-bg-hover hover:text-text-body",
            collapsed ? "justify-center" : "justify-start",
          ].join(" ")}
        >
          <span className="flex text-text-muted">
            <Settings size={18} strokeWidth={1.7} />
          </span>
          {!collapsed && <span>Settings</span>}
        </Link>
        <button
          type="button"
          className={[
            "mt-0.5 flex w-full items-center gap-[11px] rounded-lg px-2 py-[7px] transition-colors hover:bg-bg-hover",
            collapsed ? "justify-center" : "justify-start",
          ].join(" ")}
        >
          <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full border border-line-accent bg-gradient-to-br from-line-raised to-[#1a2233] text-[11px] font-semibold text-gold">
            BF
          </span>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden text-left leading-[1.2]">
              <span className="whitespace-nowrap text-[12.5px] font-semibold text-text-body">
                Babatunde Fashola
              </span>
              <span className="text-[10.5px] font-semibold tracking-[0.04em] text-gold-muted">
                SAN · Principal
              </span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
